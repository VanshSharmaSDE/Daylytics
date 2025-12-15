const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const DailyArchive = require('../models/DailyArchive');
const router = express.Router();

// POST /api/archive/rollover?date=YYYY-MM-DD - archive tasks for a date (defaults to yesterday)
const formatDate = (d = new Date()) => d.toISOString().slice(0, 10);

router.post('/rollover', auth, async (req, res) => {
  try {
    let date = req.query.date;
    if (!date) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      date = formatDate(yesterday);
    }

    // Check if this date is already archived
    const existingArchive = await DailyArchive.findOne({ user: req.user._id, date });
    if (existingArchive) {
      return res.status(400).json({ msg: 'This date has already been archived', date });
    }

    const tasks = await Task.find({ user: req.user._id, date });
    if (!tasks || tasks.length === 0) return res.status(200).json({ msg: 'No tasks to archive for date', date });

    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Save archive document
    const archive = new DailyArchive({ user: req.user._id, date, total, completed, percentage });
    await archive.save();

    // Don't remove tasks - keep them in the Task collection
    // await Task.deleteMany({ user: req.user._id, date });

    res.json({ archive });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET /api/archive - list archives for user
router.get('/', auth, async (req, res) => {
  try {
    const archives = await DailyArchive.find({ user: req.user._id }).sort({ date: -1 });
    res.json(archives);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
