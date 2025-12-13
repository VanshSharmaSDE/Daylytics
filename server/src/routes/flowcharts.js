const express = require('express');
const auth = require('../middleware/auth');
const FlowChart = require('../models/FlowChart');

const router = express.Router();

const MAX_NODES = 80;
const MAX_EDGES = 200;

const sanitizeSteps = (steps) => {
  if (!Array.isArray(steps)) return [];

  return steps
    .map((step) => (typeof step === 'string' ? step.trim() : ''))
    .filter((step) => step.length > 0)
    .slice(0, 50);
};

const sanitizeViewport = (viewport = {}) => {
  const parsedZoom = Number(viewport.zoom);
  const clampZoom = (value) => Math.min(3, Math.max(0.25, value));

  return {
    x: Number.isFinite(Number(viewport.x)) ? Number(viewport.x) : 0,
    y: Number.isFinite(Number(viewport.y)) ? Number(viewport.y) : 0,
    zoom: Number.isFinite(parsedZoom) ? clampZoom(parsedZoom) : 1,
  };
};

const sanitizeNodes = (nodes) => {
  if (!Array.isArray(nodes)) return [];

  const usedIds = new Set();

  return nodes
    .slice(0, MAX_NODES)
    .map((node, index) => {
      const id = String(node?.id || `node-${index}`).slice(0, 40).trim();

      if (!id || usedIds.has(id)) {
        return null;
      }

      usedIds.add(id);

      const position = node?.position || {};
      const rawLabel = node?.data?.label;
      const rawVariant = node?.data?.variant;
      const rawDescription = node?.data?.description;

      const label =
        typeof rawLabel === 'string' && rawLabel.trim().length > 0
          ? rawLabel.trim().slice(0, 160)
          : `Step ${index + 1}`;

      const variant =
        typeof rawVariant === 'string' && rawVariant.trim().length > 0
          ? rawVariant.trim().slice(0, 32)
          : 'primary';

      const description =
        typeof rawDescription === 'string' && rawDescription.trim().length > 0
          ? rawDescription.trim().slice(0, 280)
          : undefined;

      return {
        id,
        type:
          typeof node?.type === 'string' && node.type.trim().length > 0
            ? node.type.trim().slice(0, 40)
            : 'smartNode',
        position: {
          x: Number.isFinite(Number(position.x)) ? Number(position.x) : 0,
          y: Number.isFinite(Number(position.y)) ? Number(position.y) : index * 120,
        },
        data: {
          label,
          variant,
          ...(description ? { description } : {}),
        },
      };
    })
    .filter(Boolean);
};

const sanitizeEdges = (edges, allowedNodeIds) => {
  if (!Array.isArray(edges)) return [];

  const nodeIds = new Set(allowedNodeIds);
  const usedIds = new Set();

  return edges
    .slice(0, MAX_EDGES)
    .map((edge, index) => {
      const source = String(edge?.source || '').trim();
      const target = String(edge?.target || '').trim();

      if (!nodeIds.has(source) || !nodeIds.has(target)) {
        return null;
      }

      const id = String(edge?.id || `edge-${index}`).slice(0, 60).trim();

      if (!id || usedIds.has(id)) {
        return null;
      }

      usedIds.add(id);

      const label =
        typeof edge?.label === 'string' && edge.label.trim().length > 0
          ? edge.label.trim().slice(0, 160)
          : undefined;

      return {
        id,
        source,
        target,
        sourceHandle:
          typeof edge?.sourceHandle === 'string' && edge.sourceHandle.trim().length > 0
            ? edge.sourceHandle.trim().slice(0, 40)
            : undefined,
        targetHandle:
          typeof edge?.targetHandle === 'string' && edge.targetHandle.trim().length > 0
            ? edge.targetHandle.trim().slice(0, 40)
            : undefined,
        type:
          typeof edge?.type === 'string' && edge.type.trim().length > 0
            ? edge.type.trim().slice(0, 40)
            : 'smoothstep',
        label,
        animated: Boolean(edge?.animated),
      };
    })
    .filter(Boolean);
};

const deriveSteps = (nodes) =>
  nodes
    .map((node) => (typeof node?.data?.label === 'string' ? node.data.label : ''))
    .filter((label) => label.length > 0)
    .slice(0, 50);

const buildPayload = (body) => {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const nodes = sanitizeNodes(body.nodes);
  const edges = sanitizeEdges(body.edges, nodes.map((node) => node.id));
  const viewport = sanitizeViewport(body.viewport);
  const steps = deriveSteps(nodes);

  return { title, nodes, edges, viewport, steps };
};

// GET /api/flowcharts - list all flow charts for the user
router.get('/', auth, async (req, res) => {
  try {
    const flowcharts = await FlowChart.find({ user: req.user._id })
      .sort({ updatedAt: -1 });
    res.json(flowcharts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flow charts.' });
  }
});

// GET /api/flowcharts/:id - fetch single chart
router.get('/:id', auth, async (req, res) => {
  try {
    const chart = await FlowChart.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chart) {
      return res.status(404).json({ message: 'Flow chart not found.' });
    }

    res.json(chart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load flow chart.' });
  }
});

// POST /api/flowcharts - create new chart
router.post('/', auth, async (req, res) => {
  const payload = buildPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  if (payload.title.length > 120) {
    return res.status(400).json({ message: 'Title must be 120 characters or less.' });
  }

  if (payload.nodes.length === 0) {
    return res.status(400).json({ message: 'Add at least one node to create a flow chart.' });
  }

  try {
    const flowchart = await FlowChart.create({
      user: req.user._id,
      title: payload.title,
      orientation: 'freeform',
      steps: payload.steps,
      nodes: payload.nodes,
      edges: payload.edges,
      viewport: payload.viewport,
    });

    res.json(flowchart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save flow chart.' });
  }
});

// PUT /api/flowcharts/:id - update chart
router.put('/:id', auth, async (req, res) => {
  const payload = buildPayload(req.body);

  if (!payload.title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  if (payload.title.length > 120) {
    return res.status(400).json({ message: 'Title must be 120 characters or less.' });
  }

  if (payload.nodes.length === 0) {
    return res.status(400).json({ message: 'Add at least one node to update the flow chart.' });
  }

  try {
    const chart = await FlowChart.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chart) {
      return res.status(404).json({ message: 'Flow chart not found.' });
    }

    chart.title = payload.title;
    chart.orientation = 'freeform';
    chart.steps = payload.steps;
    chart.nodes = payload.nodes;
    chart.edges = payload.edges;
    chart.viewport = payload.viewport;

    await chart.save();

    res.json(chart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update flow chart.' });
  }
});

// DELETE /api/flowcharts/:id - delete chart
router.delete('/:id', auth, async (req, res) => {
  try {
    const chart = await FlowChart.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!chart) {
      return res.status(404).json({ message: 'Flow chart not found.' });
    }

    res.json({ message: 'Flow chart deleted.', id: chart._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete flow chart.' });
  }
});

module.exports = router;
