const express = require('express');
const auth = require('../middleware/auth');
const File = require('../models/File');
const router = express.Router();

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
      folder: folder || null
    });
    await file.save();
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
    res.json(file);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!file) return res.status(404).json({ msg: 'File not found' });
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

module.exports = router;
