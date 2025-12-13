const express = require('express');
const auth = require('../middleware/auth');
const Share = require('../models/Share');
const File = require('../models/File');
const Folder = require('../models/Folder');
const router = express.Router();

// GET /api/shares - Get all shares created by user
router.get('/', auth, async (req, res) => {
  try {
    const shares = await Share.find({ user: req.user._id })
      .populate('files', 'title')
      .populate('folders', 'name')
      .sort({ createdAt: -1 });
    res.json(shares);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST /api/shares - Create a new share
router.post('/', auth, async (req, res) => {
  try {
    const { name, files, folders, expiresIn, maxAccessCount } = req.body;
    
    if (!name) return res.status(400).json({ msg: 'Share name is required' });
    if ((!files || files.length === 0) && (!folders || folders.length === 0)) {
      return res.status(400).json({ msg: 'Select at least one file or folder to share' });
    }

    // Verify ownership of files and folders
    if (files && files.length > 0) {
      const fileCount = await File.countDocuments({ _id: { $in: files }, user: req.user._id });
      if (fileCount !== files.length) {
        return res.status(403).json({ msg: 'You can only share your own files' });
      }
    }
    
    if (folders && folders.length > 0) {
      const folderCount = await Folder.countDocuments({ _id: { $in: folders }, user: req.user._id });
      if (folderCount !== folders.length) {
        return res.status(403).json({ msg: 'You can only share your own folders' });
      }
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      const hours = parseInt(expiresIn);
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    const share = new Share({
      user: req.user._id,
      name,
      files: files || [],
      folders: folders || [],
      expiresAt,
      maxAccessCount: maxAccessCount ? parseInt(maxAccessCount) : null
    });

    await share.save();
    await share.populate(['files', 'folders']);
    res.json(share);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/shares/:token - Access shared content (public, no auth required)
router.get('/:token', async (req, res) => {
  try {
    // Set cache-control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Use lean() to get fresh data from DB without mongoose cache
    const share = await Share.findOne({ shareToken: req.params.token })
      .populate('files')
      .populate('folders')
      .lean();
    
    if (!share) {
      return res.status(404).json({ msg: 'Share not found' });
    }

    // Check basic validity (active, not expired)
    if (!share.isActive) {
      console.log('Share is inactive:', share._id);
      return res.status(410).json({ msg: 'Share is no longer active' });
    }
    
    if (share.expiresAt && new Date() > share.expiresAt) {
      console.log('Share has expired:', share._id);
      return res.status(410).json({ msg: 'Share has expired' });
    }

    // Only increment if this is a new access (check if lastAccessedAt is more than 1 minute ago)
    const now = new Date();
    const shouldIncrement = !share.lastAccessedAt || (now - share.lastAccessedAt) > 60000; // 1 minute
    
    if (shouldIncrement) {
      // Check if we've reached max access count BEFORE incrementing
      if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
        console.log('Max access reached:', share._id);
        return res.status(410).json({ msg: 'Maximum access limit reached' });
      }
      
      // Update the share document
      await Share.updateOne(
        { _id: share._id },
        { 
          $inc: { accessCount: 1 },
          $set: { lastAccessedAt: now }
        }
      );
      
      share.accessCount += 1;
    }

    // Helper function to get all subfolders recursively
    const getAllSubfolders = async (folderId) => {
      const subfolders = await Folder.find({ parentFolder: folderId }).lean();
      let allSubfolders = [...subfolders];
      
      for (const subfolder of subfolders) {
        const children = await getAllSubfolders(subfolder._id);
        allSubfolders = allSubfolders.concat(children);
      }
      
      return allSubfolders;
    };

    // Get all folders (including subfolders recursively)
    let allFolders = [...(share.folders || [])];
    for (const folder of share.folders || []) {
      const subfolders = await getAllSubfolders(folder._id);
      allFolders = allFolders.concat(subfolders);
    }

    // Get files inside all folders (including subfolders)
    const allFolderIds = allFolders.map(f => f._id);
    const folderFiles = await File.find({ folder: { $in: allFolderIds } }).lean();

    // Build folder structure with files
    const folderStructure = allFolders.map(folder => ({
      ...folder,
      files: folderFiles.filter(f => String(f.folder) === String(folder._id))
    }));

    res.json({
      name: share.name,
      files: share.files,
      folders: share.folders,
      folderStructure: folderStructure, // Complete folder tree with files
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      remainingAccess: share.maxAccessCount ? share.maxAccessCount - share.accessCount : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/shares/:id - Delete a share
router.delete('/:id', auth, async (req, res) => {
  try {
    const share = await Share.findOne({ _id: req.params.id, user: req.user._id });
    if (!share) return res.status(404).json({ msg: 'Share not found' });
    
    await Share.deleteOne({ _id: req.params.id });
    res.json({ msg: 'Share deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PATCH /api/shares/:id/toggle - Toggle share active status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const share = await Share.findOne({ _id: req.params.id, user: req.user._id })
      .populate('files', 'title')
      .populate('folders', 'name');
    
    if (!share) return res.status(404).json({ msg: 'Share not found' });
    
    share.isActive = !share.isActive;
    // Reset lastAccessedAt when reactivating so it can be accessed immediately
    if (share.isActive) {
      share.lastAccessedAt = null;
    }
    await share.save();
    
    console.log('Share toggled:', share._id, 'isActive:', share.isActive);
    res.json(share);
  } catch (err) {
    console.error('Toggle error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
