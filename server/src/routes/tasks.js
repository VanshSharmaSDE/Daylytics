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

// GET /api/tasks - Get all tasks for user with optional filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category, search, sort } = req.query;
    
    let query = { user: req.user._id };
    
    // Apply filters
    if (status === 'completed') query.done = true;
    if (status === 'pending') query.done = false;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Determine sort order
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'priority') sortOption = { priority: -1, createdAt: -1 };
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    
    const tasks = await Task.find(query).sort(sortOption);
    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks - Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title required' });

    // Validate title length
    if (title.length > 500) {
      return res.status(400).json({ msg: 'Task title cannot exceed 500 characters' });
    }

    // Validate description
    if (description && description.length > 2000) {
      return res.status(400).json({ msg: 'Description cannot exceed 2000 characters' });
    }

    const taskData = { 
      user: req.user._id, 
      title,
      description,
      priority: priority || 'medium',
      category
    };

    if (dueDate) taskData.dueDate = new Date(dueDate);

    const task = new Task(taskData);
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).send('Server error');
  }
});

// PATCH /api/tasks/:id - Toggle task completion
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

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, priority, category, dueDate } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    
    if (title !== undefined) {
      if (!title) return res.status(400).json({ msg: 'Title required' });
      if (title.length > 500) {
        return res.status(400).json({ msg: 'Task title cannot exceed 500 characters' });
      }
      task.title = title;
    }
    
    if (description !== undefined) {
      if (description && description.length > 2000) {
        return res.status(400).json({ msg: 'Description cannot exceed 2000 characters' });
      }
      task.description = description;
    }
    
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id - Delete single task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ msg: 'Task not found' });

    // Delete attachment if exists
    if (task.attachment && task.attachment.fileId) {
      try {
        await cloudinaryService.deleteFile(task.attachment.fileId);
        // Reduce storage usage
        if (task.attachment.size && req.user) {
          req.user.storageUsed = Math.max(0, req.user.storageUsed - task.attachment.size);
          await req.user.save();
        }
      } catch (err) {
        console.error('Error deleting task attachment:', err);
      }
    }

    await task.deleteOne();
    res.json({ msg: 'Task deleted', id: req.params.id });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks - Delete all completed tasks
router.delete('/', auth, async (req, res) => {
  try {
    const { type } = req.query; // type can be 'completed', 'all'
    
    let query = { user: req.user._id };
    if (type === 'completed') {
      query.done = true;
    }
    
    const tasksToDelete = await Task.find(query);
    
    // Delete attachments from storage
    for (const task of tasksToDelete) {
      if (task.attachment && task.attachment.fileId) {
        try {
          await cloudinaryService.deleteFile(task.attachment.fileId);
          if (task.attachment.size && req.user) {
            req.user.storageUsed = Math.max(0, req.user.storageUsed - task.attachment.size);
          }
        } catch (err) {
          console.error('Error deleting task attachment:', err);
        }
      }
    }
    
    if (req.user) await req.user.save();
    
    const result = await Task.deleteMany(query);
    res.json({ msg: 'Tasks deleted', count: result.deletedCount });
  } catch (err) {
    console.error('Bulk delete error:', err);
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
