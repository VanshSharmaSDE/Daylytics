const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    type: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'smartNode',
    },
    position: {
      x: { type: Number, required: true, default: 0 },
      y: { type: Number, required: true, default: 0 },
    },
    data: {
      label: {
        type: String,
        trim: true,
        maxlength: 160,
        default: '',
      },
      variant: {
        type: String,
        trim: true,
        maxlength: 32,
        default: 'primary',
      },
      description: {
        type: String,
        trim: true,
        maxlength: 280,
      },
    },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    target: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    sourceHandle: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    targetHandle: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    type: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'smoothstep',
    },
    label: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    animated: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const viewportSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    zoom: { type: Number, default: 1 },
  },
  { _id: false }
);

const flowChartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    orientation: {
      type: String,
      enum: ['vertical', 'horizontal', 'freeform'],
      default: 'freeform',
    },
    steps: {
      type: [String],
      default: [],
      validate: {
        validator: function (steps) {
          if (!Array.isArray(steps)) {
            return false;
          }

          return steps.every(
            (step) => typeof step === 'string' && step.trim().length <= 160
          );
        },
        message: 'Steps must be strings up to 160 characters.',
      },
    },
    nodes: {
      type: [nodeSchema],
      default: [],
      validate: {
        validator: function (nodes) {
          return Array.isArray(nodes) && nodes.length <= 80;
        },
        message: 'You can store up to 80 nodes per flow chart.',
      },
    },
    edges: {
      type: [edgeSchema],
      default: [],
      validate: {
        validator: function (edges) {
          return Array.isArray(edges) && edges.length <= 200;
        },
        message: 'You can store up to 200 connections per flow chart.',
      },
    },
    viewport: {
      type: viewportSchema,
      default: () => ({ x: 0, y: 0, zoom: 1 }),
    },
  },
  { timestamps: true }
);

flowChartSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('FlowChart', flowChartSchema);
