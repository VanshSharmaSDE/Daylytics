import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Handle,
  addEdge,
  useEdgesState,
  useNodesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import api from "../api";
import { useToast } from "../components/ToastProvider";
import Modal from "../components/Modal";

const EDGE_COLOR = "#0d6efd";
const EDGE_LINE_STYLE = {
  stroke: EDGE_COLOR,
  strokeWidth: 2.2,
  strokeDasharray: "14 10",
};
const DEFAULT_EDGE_OPTIONS = {
  type: "default",
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: EDGE_COLOR,
    width: 26,
    height: 26,
  },
  style: EDGE_LINE_STYLE,
};
const BACKGROUND_DOT_COLOR = "rgba(108,117,125,0.35)";
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };

const NODE_LIBRARY = [
  {
    type: "smartNode",
    label: "Start",
    description: "Entry point",
    variant: "success",
    icon: "ri-play-circle-line",
  },
  {
    type: "smartNode",
    label: "Task",
    description: "Action step",
    variant: "primary",
    icon: "ri-checkbox-circle-line",
  },
  {
    type: "smartNode",
    label: "Decision",
    description: "Branch",
    variant: "warning",
    icon: "ri-git-branch-line",
  },
  {
    type: "smartNode",
    label: "Info",
    description: "Reference",
    variant: "info",
    icon: "ri-information-line",
  },
  {
    type: "smartNode",
    label: "End",
    description: "Finish",
    variant: "danger",
    icon: "ri-flag-line",
  },
];

const SAMPLE_FLOW = {
  nodes: [
    {
      id: "sample-start",
      type: "smartNode",
      position: { x: 0, y: 0 },
      data: { label: "Start", description: "Kickoff", variant: "success" },
    },
    {
      id: "sample-plan",
      type: "smartNode",
      position: { x: 220, y: -60 },
      data: { label: "Plan", description: "Outline", variant: "primary" },
    },
    {
      id: "sample-build",
      type: "smartNode",
      position: { x: 440, y: 30 },
      data: { label: "Build", description: "Execute", variant: "info" },
    },
    {
      id: "sample-review",
      type: "smartNode",
      position: { x: 660, y: 0 },
      data: { label: "Review", description: "Check", variant: "warning" },
    },
    {
      id: "sample-end",
      type: "smartNode",
      position: { x: 880, y: -30 },
      data: { label: "Finish", description: "Ship", variant: "danger" },
    },
  ],
  edges: [
    { id: "sample-edge-1", source: "sample-start", target: "sample-plan" },
    { id: "sample-edge-2", source: "sample-plan", target: "sample-build" },
    { id: "sample-edge-3", source: "sample-build", target: "sample-review" },
    { id: "sample-edge-4", source: "sample-review", target: "sample-end" },
  ],
};

const trimString = (value, max = 160) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
};

const sanitizeNodesForSave = (nodes) =>
  nodes.map((node) => ({
    id: node.id,
    type: "smartNode",
    position: {
      x: Math.round(node.position.x * 100) / 100,
      y: Math.round(node.position.y * 100) / 100,
    },
    data: {
      label: trimString(node.data.label || "Step"),
      description: trimString(node.data.description || "", 280),
      variant: node.data.variant || "primary",
    },
  }));

const sanitizeEdgesForSave = (edges, nodeIds) =>
  edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge, index) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));

const normalizeNodesForCanvas = (nodes) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }
  return nodes.map((node, index) => ({
    id: String(node?.id || `node-${index}`),
    type: "smartNode",
    position: {
      x: Number(node?.position?.x) || index * 220,
      y: Number(node?.position?.y) || 0,
    },
    data: {
      label: trimString(node?.data?.label || node?.label || `Step ${index + 1}`),
      description: trimString(node?.data?.description || "", 280),
      variant: node?.data?.variant || "primary",
    },
  }));
};

const normalizeEdgesForCanvas = (edges, nodeIds) => {
  if (!Array.isArray(edges) || edges.length === 0) {
    return [];
  }
  return edges
    .filter((edge) => nodeIds.has(edge?.source) && nodeIds.has(edge?.target))
    .map((edge, index) => ({
      id: String(edge?.id || `edge-${index}`),
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: DEFAULT_EDGE_OPTIONS.type,
      markerEnd: { ...DEFAULT_EDGE_OPTIONS.markerEnd },
      style: { ...EDGE_LINE_STYLE },
    }));
};

const stepsToNodes = (steps = []) => {
  const safeSteps = Array.isArray(steps)
    ? steps
        .map((step) => trimString(step))
        .filter((step) => step.length > 0)
        .slice(0, 25)
    : [];

  if (safeSteps.length === 0) {
    return [];
  }

  return safeSteps.map((label, index) => ({
    id: `legacy-${index}`,
    type: "smartNode",
    position: { x: index * 220, y: index % 2 === 0 ? 0 : 120 },
    data: {
      label,
      description: "",
      variant: index === 0 ? "success" : index === safeSteps.length - 1 ? "danger" : "primary",
    },
  }));
};

const HANDLE_BASE_STYLE = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  border: "1px solid #ffffff",
  background: EDGE_COLOR,
  cursor: "crosshair",
};

const HANDLE_CONFIG = [
  { id: "target-top", type: "target", position: "top", style: { left: "30%", transform: "translate(-50%, -50%)" } },
  { id: "source-top", type: "source", position: "top", style: { left: "70%", transform: "translate(-50%, -50%)" } },
  { id: "target-right", type: "target", position: "right", style: { top: "30%", transform: "translate(50%, -50%)" } },
  { id: "source-right", type: "source", position: "right", style: { top: "70%", transform: "translate(50%, -50%)" } },
  { id: "target-bottom", type: "target", position: "bottom", style: { left: "30%", transform: "translate(-50%, 50%)" } },
  { id: "source-bottom", type: "source", position: "bottom", style: { left: "70%", transform: "translate(-50%, 50%)" } },
  { id: "target-left", type: "target", position: "left", style: { top: "30%", transform: "translate(-50%, -50%)" } },
  { id: "source-left", type: "source", position: "left", style: { top: "70%", transform: "translate(-50%, -50%)" } },
];

const FlowNode = ({ data }) => (
  <div
    className="flow-node"
    style={{
      minWidth: 160,
      padding: "12px 16px",
      borderRadius: 12,
      border: "2px solid rgba(13,110,253,0.4)",
      background: "var(--panel)",
      boxShadow: "0 4px 14px rgba(13,110,253,0.08)",
      position: "relative",
    }}
  >
    {HANDLE_CONFIG.map((config) => (
      <Handle
        key={config.id}
        id={config.id}
        type={config.type}
        position={config.position}
        style={{ ...HANDLE_BASE_STYLE, ...config.style }}
      />
    ))}
    <strong className="d-block">{data.label || "Step"}</strong>
    {data.description ? <small className="text-muted d-block mt-1">{data.description}</small> : null}
  </div>
);

const FlowChartEditorInner = ({ initialChart, onBack, onUpdate, onDelete }) => {
  const { addToast } = useToast();
  const [chart, setChart] = useState(initialChart || null);
  const [titleInput, setTitleInput] = useState(initialChart?.title || "");
  const [statusMessage, setStatusMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [chartViewerOpen, setChartViewerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const nodeIdRef = useRef(1);

  const nodeTypes = useMemo(() => ({ smartNode: FlowNode }), []);
  const activeNode = useMemo(
    () => nodes.find((node) => node.id === activeNodeId) || null,
    [nodes, activeNodeId]
  );

  const syncNodeCounter = useCallback((preparedNodes) => {
    nodeIdRef.current = preparedNodes.length + 1;
  }, []);

  const focusCanvas = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.3, duration: 300 });
    }
  }, [reactFlowInstance]);

  const loadChartIntoCanvas = useCallback(
    (chartData) => {
      if (!chartData) {
        setNodes([]);
        setEdges([]);
        setActiveNodeId(null);
        syncNodeCounter([]);
        return;
      }

      const nodesFromChart =
        Array.isArray(chartData?.nodes) && chartData.nodes.length > 0
          ? normalizeNodesForCanvas(chartData.nodes)
          : stepsToNodes(chartData?.steps);

      const nodeIds = new Set(nodesFromChart.map((node) => node.id));
      let edgesFromChart = normalizeEdgesForCanvas(chartData?.edges, nodeIds);

      if (!edgesFromChart.length && nodesFromChart.length > 1) {
        edgesFromChart = normalizeEdgesForCanvas(
          nodesFromChart.slice(0, nodesFromChart.length - 1).map((node, index) => ({
            id: `edge-${node.id}-${nodesFromChart[index + 1].id}`,
            source: node.id,
            target: nodesFromChart[index + 1].id,
          })),
          nodeIds
        );
      }

      setNodes(nodesFromChart);
      setEdges(edgesFromChart);
      setActiveNodeId(null);
      syncNodeCounter(nodesFromChart);
      requestAnimationFrame(() => focusCanvas());
    },
    [focusCanvas, setEdges, setNodes, syncNodeCounter]
  );

  useEffect(() => {
    setChart(initialChart || null);
    setTitleInput(initialChart?.title || "");
    setStatusMessage("");
    loadChartIntoCanvas(initialChart || null);
    if (initialChart?.viewport) {
      setViewport({
        x: Number(initialChart.viewport.x) || 0,
        y: Number(initialChart.viewport.y) || 0,
        zoom: Number(initialChart.viewport.zoom) || 1,
      });
    } else {
      setViewport(DEFAULT_VIEWPORT);
    }
  }, [initialChart, loadChartIntoCanvas]);

  const handleAddNode = useCallback(
    (template, position) => {
      let newNodeId = "";
      setNodes((current) => {
        const id = `node-${nodeIdRef.current++}`;
        newNodeId = id;
        const safePosition = position || { x: current.length * 200, y: current.length * 80 };
        return [
          ...current,
          {
            id,
            type: "smartNode",
            position: safePosition,
            data: {
              label: template.label,
              description: template.description,
              variant: template.variant,
            },
          },
        ];
      });
      if (newNodeId) {
        setActiveNodeId(newNodeId);
      }
    },
    [setNodes]
  );

  const handleDragStart = useCallback((event, template) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(template));
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) {
        return;
      }
      const template = JSON.parse(raw);
      const bounds = event.currentTarget.getBoundingClientRect();
      const project = reactFlowInstance?.project?.bind(reactFlowInstance);
      const position = project
        ? project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
        : { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      handleAddNode(template, position);
    },
    [handleAddNode, reactFlowInstance]
  );

  const handleQuickAdd = useCallback(
    (template) => {
      handleAddNode(template, null);
    },
    [handleAddNode]
  );

  const handleConnect = useCallback(
    (connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: DEFAULT_EDGE_OPTIONS.type,
            markerEnd: { ...DEFAULT_EDGE_OPTIONS.markerEnd },
            style: { ...EDGE_LINE_STYLE },
          },
          current
        )
      );
    },
    [setEdges]
  );

  const handleNodeLabelChange = useCallback(
    (value) => {
      if (!activeNodeId) {
        return;
      }
      setNodes((current) =>
        current.map((node) =>
          node.id === activeNodeId
            ? { ...node, data: { ...node.data, label: trimString(value) } }
            : node
        )
      );
    },
    [activeNodeId, setNodes]
  );

  const handleNodeDescriptionChange = useCallback(
    (value) => {
      if (!activeNodeId) {
        return;
      }
      setNodes((current) =>
        current.map((node) =>
          node.id === activeNodeId
            ? { ...node, data: { ...node.data, description: trimString(value, 280) } }
            : node
        )
      );
    },
    [activeNodeId, setNodes]
  );

  const handleDeleteNode = useCallback(() => {
    if (!activeNodeId) {
      return;
    }
    setNodes((current) => current.filter((node) => node.id !== activeNodeId));
    setEdges((current) =>
      current.filter((edge) => edge.source !== activeNodeId && edge.target !== activeNodeId)
    );
    setActiveNodeId(null);
  }, [activeNodeId, setEdges, setNodes]);

  const handleLoadSample = useCallback(() => {
    const preparedNodes = normalizeNodesForCanvas(SAMPLE_FLOW.nodes);
    const nodeIds = new Set(preparedNodes.map((node) => node.id));
    const preparedEdges = normalizeEdgesForCanvas(SAMPLE_FLOW.edges, nodeIds);
    setNodes(preparedNodes);
    setEdges(preparedEdges);
    syncNodeCounter(preparedNodes);
    setActiveNodeId(null);
    setStatusMessage("");
    requestAnimationFrame(() => focusCanvas());
  }, [focusCanvas, setEdges, setNodes, syncNodeCounter]);

  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setActiveNodeId(null);
  }, [setEdges, setNodes]);

  const handleSaveChart = useCallback(async () => {
    const trimmedTitle = titleInput.trim();
    if (!trimmedTitle) {
      setStatusMessage("Give the flow chart a title before saving.");
      return;
    }
    if (nodes.length === 0) {
      setStatusMessage("Drop a node onto the canvas to get started.");
      return;
    }

    const sanitizedNodes = sanitizeNodesForSave(nodes);
    const sanitizedEdges = sanitizeEdgesForSave(
      edges,
      new Set(sanitizedNodes.map((node) => node.id))
    );
    const payload = {
      title: trimmedTitle,
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
      viewport,
    };

    setSaving(true);
    setStatusMessage("");
    try {
      let response;
      if (chart?._id) {
        response = await api.put(`/api/flowcharts/${chart._id}`, payload);
        addToast("success", "Flow chart updated.");
      } else {
        response = await api.post("/api/flowcharts", payload);
        addToast("success", "Flow chart saved.");
      }
      const nextChart = response.data;
      setChart(nextChart);
      setTitleInput(nextChart.title);
      onUpdate?.(nextChart);
    } catch (error) {
      console.error("Failed to save flow chart", error);
      const message = error.response?.data?.message || "Failed to save flow chart.";
      addToast("error", message);
      setStatusMessage(message);
    } finally {
      setSaving(false);
    }
  }, [addToast, chart, edges, nodes, onUpdate, titleInput, viewport]);

  const requestDeleteChart = useCallback(() => {
    if (!chart?._id) {
      return;
    }
    setDeleteConfirmOpen(true);
  }, [chart]);

  const closeDeleteConfirm = useCallback(() => {
    if (deleting) return;
    setDeleteConfirmOpen(false);
  }, [deleting]);

  const handleDeleteChart = useCallback(async () => {
    if (!chart?._id) {
      setDeleteConfirmOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/api/flowcharts/${chart._id}`);
      addToast("success", "Flow chart deleted.");
      onDelete?.(chart._id);
      onBack?.();
    } catch (error) {
      console.error("Failed to delete flow chart", error);
      const message = error.response?.data?.message || "Failed to delete flow chart.";
      addToast("error", message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  }, [addToast, chart, deleting, onBack, onDelete]);

  const handleSelectionChange = useCallback(({ nodes: picked }) => {
    setActiveNodeId(picked?.[0]?.id || null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setActiveNodeId(null);
  }, []);

  const handleMoveEnd = useCallback((_, vp) => {
    setViewport({
      x: Number(vp?.x) || 0,
      y: Number(vp?.y) || 0,
      zoom: Number(vp?.zoom) || 1,
    });
  }, []);

  const handleInit = useCallback((instance) => {
    setReactFlowInstance(instance);
    requestAnimationFrame(() => instance.fitView({ padding: 0.25, duration: 300 }));
  }, []);

  return (
    <div className="flowchart-tab container-fluid">
      <div className="designer-view">
        <div className="flowchart-designer">
          <div className="designer-panel card shadow-sm">
            <div className="designer-sidebar-container">
              <div className="designer-sidebar-header">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 mb-3"
                  onClick={() => onBack?.()}
                  disabled={saving || deleting}
                >
                  <i className="ri-arrow-left-line me-1"></i>
                  Back to charts
                </button>
                <label className="form-label small fw-semibold text-uppercase">Chart Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  maxLength={120}
                  placeholder="Name this chart"
                />
                {statusMessage ? (
                  <div className="alert alert-warning py-2 px-3 mt-3 mb-0" role="alert">
                    <small className="d-block m-0">{statusMessage}</small>
                  </div>
                ) : (
                  <p className="text-muted small mt-2 mb-0">
                    {chart
                      ? `Editing "${chart.title}"`
                      : "This is a new flow. Drop a node onto the canvas to begin."}
                  </p>
                )}
              </div>

              <div className="designer-sidebar-scroll">
                <div>
                  <h6 className="fw-semibold mb-2">Node Inspector</h6>
                  {activeNode ? (
                    <div className="node-editor">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-semibold text-truncate me-2">
                          {activeNode.data.label || activeNode.id}
                        </span>
                        <button className="btn btn-sm btn-outline-danger" onClick={handleDeleteNode}>
                          Remove
                        </button>
                      </div>
                      <div className="mb-2">
                        <label className="form-label small">Label</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={activeNode.data.label}
                          onChange={(event) => handleNodeLabelChange(event.target.value)}
                          maxLength={160}
                        />
                      </div>
                      <div>
                        <label className="form-label small">Notes</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={3}
                          value={activeNode.data.description}
                          onChange={(event) => handleNodeDescriptionChange(event.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">Tap a node in the canvas to edit its copy.</p>
                  )}
                </div>

                <div className="sidebar-palette flex-grow-1 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-semibold mb-0">Palette</h6>
                    <small className="text-muted">Drag or click</small>
                  </div>
                  <div className="palette-scroll">
                    <div className="d-grid gap-2">
                      {NODE_LIBRARY.map((template) => (
                        <div
                          key={template.label}
                          className="border rounded px-3 py-2 d-flex justify-content-between align-items-center"
                          draggable
                          onDragStart={(event) => handleDragStart(event, template)}
                          onClick={() => handleQuickAdd(template)}
                          style={{ cursor: "grab" }}
                        >
                          <div className="me-3">
                            <div className="fw-semibold">{template.label}</div>
                            <small className="text-muted">{template.description}</small>
                          </div>
                          <i className={`${template.icon} fs-5 text-primary`}></i>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="designer-canvas card shadow-sm">
            <div className="card-body h-100 d-flex flex-column">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h5 className="mb-0">
                    <i className="ri-flow-chart me-2"></i>
                    Builder
                  </h5>
                  <small className="text-muted">Connect handles to show how work flows.</small>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button className="btn btn-primary btn-sm" onClick={handleSaveChart} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setChartViewerOpen(true)}
                    disabled={saving || deleting}
                  >
                    View Chart
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleLoadSample}
                    disabled={saving || deleting}
                  >
                    Sample
                  </button>
                  {chart?._id ? (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={requestDeleteChart}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  ) : null}
                  <button className="btn btn-outline-secondary btn-sm" onClick={handleClearCanvas}>
                    Clear
                  </button>
                  <button className="btn btn-outline-primary btn-sm" onClick={focusCanvas}>
                    Re-center
                  </button>
                </div>
              </div>
              <div className="canvas-shell flex-grow-1 rounded">
                <ReactFlow
                  className="daylytics-flow-canvas"
                  style={{ width: "100%", height: "100%" }}
                  nodes={nodes}
                  edges={edges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={handleConnect}
                  onSelectionChange={handleSelectionChange}
                  onNodeClick={(_, node) => setActiveNodeId(node.id)}
                  onPaneClick={handlePaneClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onInit={handleInit}
                  onMoveEnd={handleMoveEnd}
                  defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
                  connectionLineStyle={EDGE_LINE_STYLE}
                  connectionLineType="default"
                  fitView
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={16} size={1} color={BACKGROUND_DOT_COLOR} />
                  <MiniMap
                    nodeColor={(node) => (node?.data?.variant === "danger" ? "#dc3545" : EDGE_COLOR)}
                    nodeStrokeColor={() => EDGE_COLOR}
                  />
                  <Controls showInteractive showZoom showFitView />
                </ReactFlow>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={deleteConfirmOpen}
        title="Delete flow chart?"
        onClose={closeDeleteConfirm}
        footer={
          <div className="d-flex justify-content-end gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-autofocus
              onClick={closeDeleteConfirm}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteChart}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        <p className="mb-1">This will permanently remove the flow chart and its nodes.</p>
        <p className="text-muted small mb-0">You cannot undo this action.</p>
      </Modal>

      <Modal
        open={chartViewerOpen}
        title={chart?.title || "Flow Chart Preview"}
        onClose={() => setChartViewerOpen(false)}
        size="lg"
        footer={
          <div className="d-flex justify-content-end w-100">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setChartViewerOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div style={{ height: '70vh', minHeight: '500px', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <ReactFlowProvider>
            <ReactFlow
              className="daylytics-flow-canvas"
              style={{ width: '100%', height: '100%' }}
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
              connectionLineStyle={EDGE_LINE_STYLE}
              connectionLineType="default"
              fitView
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
            >
              <Background gap={16} size={1} color={BACKGROUND_DOT_COLOR} />
              <MiniMap
                nodeColor={(node) => (node?.data?.variant === "danger" ? "#dc3545" : EDGE_COLOR)}
                nodeStrokeColor={() => EDGE_COLOR}
              />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </Modal>
    </div>
  );
};

const FlowChartEditor = (props) => (
  <ReactFlowProvider>
    <FlowChartEditorInner {...props} />
  </ReactFlowProvider>
);

export default FlowChartEditor;
