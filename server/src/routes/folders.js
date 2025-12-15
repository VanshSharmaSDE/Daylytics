const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Folder = require('../models/Folder');
const File = require('../models/File');

// Get all folders for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { parentFolder } = req.query;
    const query = { user: req.user.id };
    
    // Filter by parent folder if specified, otherwise get root folders
    if (parentFolder) {
      query.parentFolder = parentFolder;
    } else {
      query.parentFolder = null;
    }

    const folders = await Folder.find(query).sort({ createdAt: -1 });
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific folder by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    res.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new folder
router.post('/', auth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Folder name is required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ message: 'Folder name must be 100 characters or less' });
    }

    // Check if parent folder exists and belongs to user
    if (parentFolder) {
      const parent = await Folder.findOne({ _id: parentFolder, user: req.user.id });
      if (!parent) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
    }

    const folder = new Folder({
      user: req.user.id,
      name: name.trim(),
      parentFolder: parentFolder || null
    });

    await folder.save();
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update folder (rename or move)
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user.id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'Folder name cannot be empty' });
      }
      if (name.length > 100) {
        return res.status(400).json({ message: 'Folder name must be 100 characters or less' });
      }
      folder.name = name.trim();
    }

    if (parentFolder !== undefined) {
      // Prevent moving folder into itself or its descendants
      if (parentFolder === req.params.id) {
        return res.status(400).json({ message: 'Cannot move folder into itself' });
      }
      
      if (parentFolder) {
        const parent = await Folder.findOne({ _id: parentFolder, user: req.user.id });
        if (!parent) {
          return res.status(404).json({ message: 'Parent folder not found' });
        }
      }
      
      folder.parentFolder = parentFolder || null;
    }

    await folder.save();
    res.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete folder
router.delete('/:id', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user.id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if folder has subfolders
    const hasSubfolders = await Folder.countDocuments({ parentFolder: req.params.id, user: req.user.id });
    if (hasSubfolders > 0) {
      return res.status(400).json({ message: 'Cannot delete folder with subfolders. Delete subfolders first.' });
    }

    // Check if folder has files
    const hasFiles = await File.countDocuments({ folder: req.params.id, user: req.user.id });
    if (hasFiles > 0) {
      return res.status(400).json({ message: 'Cannot delete folder with files. Move or delete files first.' });
    }

    await Folder.deleteOne({ _id: req.params.id });
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle folder pin status
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user.id });

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    folder.isPinned = !folder.isPinned;
    await folder.save();
    res.json(folder);
  } catch (error) {
    console.error('Error toggling folder pin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
