const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const cloudinaryService = require('../services/cloudinaryService');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper: format date to YYYY-MM-DD
const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

// GET /api/tasks?date=YYYY-MM-DD (defaults to today)
router.get('/', auth, async (req, res) => {
  try {
    const date = req.query.date || formatDate();
    
    // Get tasks for the specific date
    const tasks = await Task.find({ user: req.user._id, date }).sort({ createdAt: 1 });
    
    // Return tasks as-is (daily-repeat feature removed)
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks - body { title, date? }
router.post('/', auth, async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title required' });

    // Validate title length
    if (title.length > 500) {
      return res.status(400).json({ msg: 'Task title cannot exceed 500 characters' });
    }

    // Validate word count
    const wordCount = title.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 50) {
      return res.status(400).json({ msg: 'Task title cannot exceed 50 words' });
    }

    const dateKey = date ? date.slice(0, 10) : formatDate();
    const task = new Task({ user: req.user._id, title, date: dateKey });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// PATCH /api/tasks/:id toggle done
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    task.done = !task.done;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});


// PUT /api/tasks/:id - edit task title
router.put('/:id', auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title required' });

    // Validate title length
    if (title.length > 500) {
      return res.status(400).json({ msg: 'Task title cannot exceed 500 characters' });
    }

    // Validate word count
    const wordCount = title.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount > 50) {
      return res.status(400).json({ msg: 'Task title cannot exceed 50 words' });
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    
    task.title = title;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id remove task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    res.json({ msg: 'Task deleted', id: req.params.id });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks - delete all tasks for a specific date
router.delete('/', auth, async (req, res) => {
  try {
    const date = req.query.date || formatDate();
    const result = await Task.deleteMany({ user: req.user._id, date });
    res.json({ msg: 'Tasks deleted', count: result.deletedCount, date });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// POST /api/tasks/:id/upload - upload image for task
router.post('/:id/upload', auth, upload.single('image'), async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    if (!req.file) {
      return res.status(400).json({ msg: 'No image file provided' });
    }

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

    // Validate file
    const validation = cloudinaryService.validateTaskImage({
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    if (!validation.valid) {
      return res.status(400).json({ msg: validation.error });
    }

    // Delete old attachment if exists
    if (task.attachment && task.attachment.fileId) {
      try {
        await cloudinaryService.deleteFile(task.attachment.fileId);
        // Reduce storage usage
        if (task.attachment.size) {
          user.storageUsed = Math.max(0, user.storageUsed - task.attachment.size);
        }
      } catch (err) {
        console.error('Error deleting old task image:', err);
      }
    }

    // Upload to Cloudinary
    const result = await cloudinaryService.uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'daylytics/tasks'
    );

    // Update task
    task.attachment = {
      fileId: result.fileId,
      url: result.url,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    };

    // Update user storage
    user.storageUsed = (user.storageUsed || 0) + req.file.size;
    await user.save();

    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Failed to upload image' });
  }
});

// DELETE /api/tasks/:id/upload - delete task image
router.delete('/:id/upload', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    if (!task.attachment || !task.attachment.fileId) {
      return res.status(404).json({ msg: 'No attachment found' });
    }

    // Delete from Cloudinary
    try {
      await cloudinaryService.deleteFile(task.attachment.fileId);
    } catch (err) {
      console.error('Error deleting task image from Cloudinary:', err);
    }

    // Remove attachment from task
    task.attachment = undefined;
    await task.save();
    
    res.json({ msg: 'Attachment deleted', task });
  } catch (err) {
    console.error('Delete attachment error:', err);
    res.status(500).json({ msg: 'Failed to delete attachment' });
  }
});

module.exports = router;
