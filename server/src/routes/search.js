const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const Folder = require('../models/Folder');

// @route   GET /api/search
// @desc    Search files and folders recursively
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || !query.trim()) {
      return res.json({ files: [], folders: [] });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search files by title or content
    const files = await File.find({
      user: req.user.id,
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    })
    .populate('folder', 'name')
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

    // Search folders by name
    const folders = await Folder.find({
      user: req.user.id,
      name: searchRegex
    })
    .populate('parentFolder', 'name')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    // Build folder paths efficiently
    const folderMap = new Map();
    const allFolders = await Folder.find({ user: req.user.id }).select('_id name parentFolder').lean();
    allFolders.forEach(f => folderMap.set(f._id.toString(), f));

    // Helper to build path for a folder
    const buildPath = (folderId, visited = new Set()) => {
      if (!folderId) return [];
      const folderIdStr = folderId.toString();
      if (visited.has(folderIdStr)) return []; // Prevent infinite loop
      visited.add(folderIdStr);
      
      const folder = folderMap.get(folderIdStr);
      if (!folder) return [];
      
      const parentPath = folder.parentFolder ? buildPath(folder.parentFolder, visited) : [];
      return [...parentPath, folder.name];
    };

    // Add path to files
    const filesWithPath = files.map(file => ({
      ...file,
      path: file.folder ? buildPath(file.folder._id || file.folder).join(' / ') : 'Root'
    }));

    // Add path to folders
    const foldersWithPath = folders.map(folder => ({
      ...folder,
      path: folder.parentFolder ? buildPath(folder.parentFolder._id || folder.parentFolder).join(' / ') : 'Root'
    }));

    res.json({
      files: filesWithPath,
      folders: foldersWithPath
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
