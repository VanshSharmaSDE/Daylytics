const mongoose = require("mongoose");

const plannerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
    },
    plans: {
      monday: { type: String, default: "" },
      tuesday: { type: String, default: "" },
      wednesday: { type: String, default: "" },
      thursday: { type: String, default: "" },
      friday: { type: String, default: "" },
      saturday: { type: String, default: "" },
      sunday: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// Index for efficient queries
plannerSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model("Planner", plannerSchema);
