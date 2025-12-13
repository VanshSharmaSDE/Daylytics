const express = require('express');
const auth = require('../middleware/auth');
const FlowChartShare = require('../models/FlowChartShare');
const FlowChart = require('../models/FlowChart');
const router = express.Router();

// GET /api/flowchart-shares - Get all flowchart shares created by user
router.get('/', auth, async (req, res) => {
  try {
    const shares = await FlowChartShare.find({ user: req.user._id })
      .populate('flowcharts', 'title')
      .sort({ createdAt: -1 });
    res.json(shares);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST /api/flowchart-shares - Create a new flowchart share
router.post('/', auth, async (req, res) => {
  try {
    const { name, flowcharts, expiresIn, maxAccessCount } = req.body;
    
    if (!name) {
      return res.status(400).json({ msg: 'Share name is required' });
    }
    
    if (!flowcharts || flowcharts.length === 0) {
      return res.status(400).json({ msg: 'Select at least one flowchart to share' });
    }

    // Verify ownership of flowcharts
    const flowChartCount = await FlowChart.countDocuments({ 
      _id: { $in: flowcharts }, 
      user: req.user._id 
    });
    
    if (flowChartCount !== flowcharts.length) {
      return res.status(403).json({ msg: 'You can only share your own flowcharts' });
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      const hours = parseInt(expiresIn);
      expiresAt.setHours(expiresAt.getHours() + hours);
    }

    const share = new FlowChartShare({
      user: req.user._id,
      name,
      flowcharts: flowcharts || [],
      expiresAt,
      maxAccessCount: maxAccessCount ? parseInt(maxAccessCount) : null
    });

    await share.save();
    await share.populate('flowcharts');
    res.json(share);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET /api/flowchart-shares/:token - Access shared flowcharts (public, no auth required)
router.get('/:token', async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const share = await FlowChartShare.findOne({ shareToken: req.params.token })
      .populate('flowcharts')
      .lean();
    
    if (!share) {
      return res.status(404).json({ msg: 'Share not found' });
    }

    // Check validity
    if (!share.isActive) {
      return res.status(410).json({ msg: 'Share is no longer active' });
    }
    
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({ msg: 'Share has expired' });
    }

    // Check access count limit
    if (share.maxAccessCount && share.accessCount >= share.maxAccessCount) {
      return res.status(410).json({ msg: 'Maximum access count reached' });
    }

    // Increment access count and update last accessed time
    await FlowChartShare.findByIdAndUpdate(share._id, {
      $inc: { accessCount: 1 },
      lastAccessedAt: new Date()
    });

    // Return share data with flowcharts
    res.json({
      name: share.name,
      flowcharts: share.flowcharts,
      expiresAt: share.expiresAt,
      accessCount: share.accessCount + 1,
      maxAccessCount: share.maxAccessCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/flowchart-shares/:id - Delete a flowchart share
router.delete('/:id', auth, async (req, res) => {
  try {
    const share = await FlowChartShare.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    
    if (!share) {
      return res.status(404).json({ msg: 'Share not found' });
    }
    
    res.json({ msg: 'Share deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PATCH /api/flowchart-shares/:id/toggle - Toggle share active status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const share = await FlowChartShare.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    
    if (!share) {
      return res.status(404).json({ msg: 'Share not found' });
    }
    
    share.isActive = !share.isActive;
    await share.save();
    await share.populate('flowcharts');
    
    res.json(share);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
