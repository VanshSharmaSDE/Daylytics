const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const File = require('../models/File');
const cloudinaryService = require('../services/cloudinaryService');
const router = express.Router();

// Helper function to sync inline images from markdown content
async function syncInlineImages(file) {
  if (!file.content) return;
  
  const imageRegex = /!\[.*?\]\((https?:\/\/res\.cloudinary\.com\/[^)]+)\)/g;
  const matches = [...file.content.matchAll(imageRegex)];
  const contentUrls = matches.map(m => m[1]);
  
  // Get existing tracked images
  const trackedUrls = (file.inlineImages || []).map(img => img.url);
  
  // Find images in content that aren't tracked yet
  const missingUrls = contentUrls.filter(url => !trackedUrls.includes(url));
  
  if (missingUrls.length > 0) {
    // Get user's pending inline images
    const User = require('../models/User');
    const user = await User.findById(file.user);
    const pendingImages = user.pendingInlineImages || [];
    
    for (const url of missingUrls) {
      try {
        // Extract fileId from URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const fileIdMatch = fileName.match(/^([a-f0-9]+)/);
        const fileId = fileIdMatch ? fileIdMatch[1] : fileName.split('.')[0];
        
        if (!file.inlineImages) file.inlineImages = [];
        
        // Try to find size from pending images
        const pendingImage = pendingImages.find(img => img.url === url);
        
        // Add to tracking with size if available
        file.inlineImages.push({
          fileId: fileId,
          url: url,
          originalName: pendingImage?.originalName || decodeURIComponent(fileName),
          size: pendingImage?.size || 0
        });
      } catch (err) {
        console.error('Error syncing inline image:', err);
      }
    }
    await file.save();
  }
}

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for files
});

// GET /api/files - Get all files for user
router.get('/', auth, async (req, res) => {
  try {
    const { folder } = req.query;
    const query = { user: req.user._id };
    
    // Filter by folder if specified
    if (folder !== undefined) {
      query.folder = folder === 'null' || folder === '' ? null : folder;
    }
    
    const files = await File.find(query)
      .sort({ isPinned: -1, updatedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET /api/files/:id - Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST /api/files - Create new file
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, folder } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title required' });

    if (title.length > 200) {
      return res.status(400).json({ msg: 'Title cannot exceed 200 characters' });
    }

    if (content && content.length > 50000) {
      return res.status(400).json({ msg: 'Content cannot exceed 50,000 characters' });
    }

    const file = new File({
      user: req.user._id,
      title,
      content: content || '',
      tags: tags || [],
      folder: folder || null,
      inlineImages: [] // Initialize empty array
    });
    await file.save();
    
    // Sync inline images from content (for images uploaded before file creation)
    await syncInlineImages(file);
    
    res.json(file);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PUT /api/files/:id - Update file
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, isPinned, folder } = req.body;

    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });

    if (title !== undefined) {
      if (title.length > 200) {
        return res.status(400).json({ msg: 'Title cannot exceed 200 characters' });
      }
      file.title = title;
    }

    if (content !== undefined) {
      if (content.length > 50000) {
        return res.status(400).json({ msg: 'Content cannot exceed 50,000 characters' });
      }
      file.content = content;
    }

    if (tags !== undefined) file.tags = tags;
    if (isPinned !== undefined) file.isPinned = isPinned;
    if (folder !== undefined) file.folder = folder || null;

    await file.save();
    
    // Sync inline images from content
    if (content !== undefined) {
      await syncInlineImages(file);
    }
    
    res.json(file);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });

    const user = req.user;
    let deletedSize = 0;

    // Delete all attachments from Cloudinary
    if (file.attachments && file.attachments.length > 0) {
      for (const attachment of file.attachments) {
        try {
          await cloudinaryService.deleteFile(attachment.fileId, attachment.resourceType);
          if (attachment.size) deletedSize += attachment.size;
        } catch (err) {
          console.error('Error deleting file attachment:', err);
        }
      }
    }

    // Delete inline images from Cloudinary and reduce storage
    if (file.inlineImages && file.inlineImages.length > 0) {
      for (const image of file.inlineImages) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = image.url.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
            const pathParts = urlParts.slice(uploadIndex + 2);
            const fileName = pathParts[pathParts.length - 1];
            const fileNameWithoutExt = fileName.split('.')[0];
            const folder = pathParts.slice(0, -1).join('/');
            const publicId = folder ? `${folder}/${fileNameWithoutExt}` : fileNameWithoutExt;
            
            await cloudinaryService.deleteFile(publicId, 'image');
            
            // Reduce storage for this inline image
            if (image.size) {
              deletedSize += image.size;
            }
          }
        } catch (err) {
          console.error('Error deleting inline image:', err);
        }
      }
    }

    // Update user storage if any attachments were deleted
    if (deletedSize > 0) {
      user.storageUsed = Math.max(0, (user.storageUsed || 0) - deletedSize);
      await user.save();
    }

    await File.findByIdAndDelete(file._id);
    res.json({ msg: 'File deleted', id: req.params.id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PATCH /api/files/:id/pin - Toggle pin status
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });
    
    file.isPinned = !file.isPinned;
    await file.save();
    res.json(file);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST /api/files/:id/upload - upload attachments to file
router.post('/:id/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files provided' });
    }

    const uploadedAttachments = [];

    // Upload each file
    for (const uploadedFile of req.files) {
      // Validate file type
      const validation = cloudinaryService.validateFileAttachment({
        mimetype: uploadedFile.mimetype
      });

      if (!validation.valid) {
        return res.status(400).json({ msg: validation.error });
      }

      // Upload to Cloudinary
      const result = await cloudinaryService.uploadBuffer(
        uploadedFile.buffer,
        uploadedFile.originalname,
        uploadedFile.mimetype,
        'daylytics/files'
      );

      uploadedAttachments.push({
        fileId: result.fileId,
        url: result.url,
        originalName: uploadedFile.originalname,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimetype,
        resourceType: result.resourceType
      });
    }

    // Add to file attachments
    file.attachments = file.attachments || [];
    file.attachments.push(...uploadedAttachments);
    await file.save();

    res.json(file);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Failed to upload files' });
  }
});

// DELETE /api/files/:id/attachments/:attachmentId - delete specific attachment
router.delete('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });

    const attachment = file.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ msg: 'Attachment not found' });
    }

    // Delete from Cloudinary
    try {
      await cloudinaryService.deleteFile(attachment.fileId, attachment.resourceType);
    } catch (err) {
      console.error('Error deleting attachment from Cloudinary:', err);
    }

    // Remove from array
    file.attachments.pull(req.params.attachmentId);
    await file.save();
    
    res.json({ msg: 'Attachment deleted', file });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ msg: 'Failed to delete attachment' });
  }
});

// POST /api/files/upload-inline - upload inline image for markdown
router.post('/upload-inline', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }

    const { fileId } = req.body; // File document ID to attach image metadata

    // Check storage limit
    const user = req.user;
    const storageLimit = user.storageLimit || 100 * 1024 * 1024; // 100MB
    const currentUsage = user.storageUsed || 0;
    
    if (currentUsage + req.file.size > storageLimit) {
      const remainingMB = ((storageLimit - currentUsage) / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ 
        msg: `Storage limit exceeded. You have ${remainingMB}MB remaining.` 
      });
    }

    // Validate file type (only images)
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ msg: 'Only image files are allowed' });
    }

    // Validate size (10MB max)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ msg: 'Image must be less than 10MB' });
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'daylytics/files/inline'
    );

    // Update user storage
    user.storageUsed = (user.storageUsed || 0) + req.file.size;
    
    // Store image metadata in user document for later association
    if (!user.pendingInlineImages) {
      user.pendingInlineImages = [];
    }
    
    // Add to pending images (will be associated with file later)
    user.pendingInlineImages.push({
      fileId: result.fileId,
      url: result.url,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date()
    });
    
    // Clean up old pending images (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    user.pendingInlineImages = user.pendingInlineImages.filter(
      img => new Date(img.uploadedAt) > oneDayAgo
    );
    
    await user.save();

    // If fileId provided, also store inline image metadata in file document
    if (fileId) {
      const file = await File.findOne({ _id: fileId, user: user._id });
      if (file) {
        if (!file.inlineImages) {
          file.inlineImages = [];
        }
        file.inlineImages.push({
          fileId: result.fileId,
          url: result.url,
          originalName: req.file.originalname,
          size: req.file.size
        });
        await file.save();
      }
    }

    res.json({
      url: result.url,
      fileId: result.fileId,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('Inline image upload error:', err);
    res.status(500).json({ msg: 'Failed to upload image' });
  }
});

module.exports = router;
