const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Planner = require("../models/Planner");

// Get planner for a specific week
router.get("/:weekStartDate", auth, async (req, res) => {
  try {
    const { weekStartDate } = req.params;
    const date = new Date(weekStartDate);

    let planner = await Planner.findOne({
      userId: req.user._id,
      weekStartDate: date,
    });

    if (!planner) {
      // Create a new planner for this week
      planner = new Planner({
        userId: req.user._id,
        weekStartDate: date,
        plans: {
          monday: "",
          tuesday: "",
          wednesday: "",
          thursday: "",
          friday: "",
          saturday: "",
          sunday: "",
        },
      });
      await planner.save();
    }

    res.json(planner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update planner for a specific week
router.put("/:weekStartDate", auth, async (req, res) => {
  try {
    const { weekStartDate } = req.params;
    const { plans } = req.body;
    const date = new Date(weekStartDate);

    let planner = await Planner.findOne({
      userId: req.user._id,
      weekStartDate: date,
    });

    if (!planner) {
      planner = new Planner({
        userId: req.user._id,
        weekStartDate: date,
        plans: plans || {},
      });
    } else {
      planner.plans = { ...planner.plans, ...plans };
    }

    await planner.save();
    res.json(planner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all planners for user (for history/archive)
router.get("/", auth, async (req, res) => {
  try {
    const planners = await Planner.find({ userId: req.user._id }).sort({
      weekStartDate: -1,
    });
    res.json(planners);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
