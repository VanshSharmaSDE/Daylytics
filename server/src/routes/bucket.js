const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadBuffer, deleteFile, generateDownloadUrl } = require('../services/cloudinaryService');
const BucketFile = require('../models/BucketFile');

// store file in memory to forward to Cloudinary
const storage = multer.memoryStorage();
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB per file
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_BYTES } }); // max 10MB

// Multer single-file wrapper to return friendly errors (413 when file too large)
const uploadSingle = (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ msg: 'File too large. Maximum allowed per file is 10 MB.' });
      console.error('Multer error:', err);
      return res.status(400).json({ msg: err.message || 'Upload error' });
    }
    next();
  });
};

// GET /api/bucket - list current user's bucket files
router.get('/', auth, async (req, res) => {
  try {
    const files = await BucketFile.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    return res.json(files);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/bucket/push - upload file to Cloudinary and save metadata
router.post('/push', auth, uploadSingle, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

    // basic validation
    const { originalname, mimetype, size, buffer } = req.file;

    // Check storage limit
    const user = req.user;
    const storageLimit = user.storageLimit || 100 * 1024 * 1024; // 100MB
    const currentUsage = user.storageUsed || 0;
    
    if (currentUsage + size > storageLimit) {
      const remainingMB = ((storageLimit - currentUsage) / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ 
        msg: `Storage limit exceeded. You have ${remainingMB}MB remaining.` 
      });
    }

    // upload to Cloudinary
    let result;
    try {
      result = await uploadBuffer(buffer, originalname, mimetype, 'daylytics/bucket');
    } catch (err) {
      const msg = err?.message || 'Upload failed';
      if (msg.toLowerCase().includes('cloudinary is not configured') || msg.toLowerCase().includes('cloudinary initialization failed') || msg.toLowerCase().includes('not configured')) {
        console.error('Cloudinary config error:', err);
        return res.status(503).json({ msg: msg });
      }
      console.error('Upload error:', err);
      return res.status(500).json({ msg: 'Upload to storage provider failed' });
    }

    if (!result || !result.fileId) {
      return res.status(500).json({ msg: 'Upload to storage provider failed' });
    }

    // save metadata to db (include resourceType when available)
    const bf = new BucketFile({
      fileId: result.fileId,
      url: result.url,
      resourceType: result.resourceType || null,
      fileName: originalname,
      mimeType: mimetype,
      fileSize: size,
      uploadedBy: req.user._id,
    });

    await bf.save();

    // Update user storage
    user.storageUsed = (user.storageUsed || 0) + size;
    await user.save();

    return res.status(201).json(bf);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/bucket/pull/:id - return a signed or secure CDN URL for the file (does not delete the file)
router.get('/pull/:id', auth, async (req, res) => {
  try {
    const file = await BucketFile.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'Not found' });
    if (!file.uploadedBy.equals(req.user._id)) return res.status(403).json({ msg: 'Forbidden' });

    try {
      const secureUrl = generateDownloadUrl(file.url, 300);
      return res.json({ url: secureUrl });
    } catch (err) {
      // Handle Cloudinary configuration errors specifically
      if (err?.message && err.message.toLowerCase().includes('not configured')) {
        console.error('Cloudinary configuration error:', err.message);
        return res.status(503).json({ 
          msg: 'File storage is not configured. Please contact administrator.' 
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('Error in pull endpoint:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/bucket/delete/:id - delete from storage provider then remove metadata
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const file = await BucketFile.findById(req.params.id);
    if (!file) return res.status(404).json({ msg: 'Not found' });
    if (!file.uploadedBy.equals(req.user._id)) return res.status(403).json({ msg: 'Forbidden' });

    // attempt delete from storage provider
    try {
      const result = await deleteFile(file.fileId);

      // Cloudinary returns { result: 'ok' } or { result: 'not found' } (or throws on error)
      // Normalize and accept common 'not found' variants from provider responses
      const resFlag = String(result?.result || '').toLowerCase().replace(/[_\s-]/g, '');
      if (result && resFlag && resFlag !== 'ok' && resFlag !== 'notfound') {
        console.error('Unexpected storage delete response:', result);
        return res.status(502).json({ msg: 'Failed to delete file from storage provider', detail: result });
      }
      if (resFlag === 'notfound') {
        // Storage didn't have the file; log and continue to remove DB metadata
        console.warn('Storage provider reported file not found during delete:', file.fileId);
      }
    } catch (err) {
      // Surface explicit 503 if provider not configured
      if (err?.message && err.message.toLowerCase().includes('not configured')) {
        console.error('Storage provider misconfiguration:', err);
        return res.status(503).json({ msg: err.message });
      }
      console.error('Error deleting from storage provider:', err);
      return res.status(500).json({ msg: 'Error deleting file from storage provider' });
    }

    // Update user storage before deleting
    const user = req.user;
    if (file.fileSize) {
      user.storageUsed = Math.max(0, (user.storageUsed || 0) - file.fileSize);
      await user.save();
    }

    // delete from db
    await file.deleteOne();

    return res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
