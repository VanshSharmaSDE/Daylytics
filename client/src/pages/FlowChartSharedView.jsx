import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Handle,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../api';

const EDGE_COLOR = '#0d6efd';
const EDGE_LINE_STYLE = {
  stroke: EDGE_COLOR,
  strokeWidth: 2.2,
  strokeDasharray: '14 10',
};
const DEFAULT_EDGE_OPTIONS = {
  type: 'default',
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: EDGE_COLOR,
    width: 26,
    height: 26,
  },
  style: EDGE_LINE_STYLE,
};
const BACKGROUND_DOT_COLOR = 'rgba(108,117,125,0.35)';

const HANDLE_BASE_STYLE = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '1px solid #ffffff',
  background: EDGE_COLOR,
  cursor: 'crosshair',
};

const HANDLE_CONFIG = [
  { id: 'target-top', type: 'target', position: 'top', style: { left: '30%', transform: 'translate(-50%, -50%)' } },
  { id: 'source-top', type: 'source', position: 'top', style: { left: '70%', transform: 'translate(-50%, -50%)' } },
  { id: 'target-right', type: 'target', position: 'right', style: { top: '30%', transform: 'translate(50%, -50%)' } },
  { id: 'source-right', type: 'source', position: 'right', style: { top: '70%', transform: 'translate(50%, -50%)' } },
  { id: 'target-bottom', type: 'target', position: 'bottom', style: { left: '30%', transform: 'translate(-50%, 50%)' } },
  { id: 'source-bottom', type: 'source', position: 'bottom', style: { left: '70%', transform: 'translate(-50%, 50%)' } },
  { id: 'target-left', type: 'target', position: 'left', style: { top: '30%', transform: 'translate(-50%, -50%)' } },
  { id: 'source-left', type: 'source', position: 'left', style: { top: '70%', transform: 'translate(-50%, -50%)' } },
];

const FlowNode = ({ data }) => (
  <div
    className="flow-node"
    style={{
      minWidth: 160,
      padding: '12px 16px',
      borderRadius: 12,
      border: '2px solid rgba(13,110,253,0.4)',
      background: 'var(--panel)',
      boxShadow: '0 4px 14px rgba(13,110,253,0.08)',
      position: 'relative',
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
    <strong className="d-block">{data.label || 'Step'}</strong>
    {data.description ? <small className="text-muted d-block mt-1">{data.description}</small> : null}
  </div>
);

const nodeTypes = {
  smartNode: FlowNode,
};

const FlowChartSharedView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);

  useEffect(() => {
    fetchSharedContent();
  }, [token]);

  const fetchSharedContent = async () => {
    try {
      setLoading(true);
      // Use axios without auth for public route
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseURL}/api/flowchart-shares/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to load shared content');
      }
      
      setShareData(data);
    } catch (err) {
      setError(err.message || 'Failed to load shared content');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4>Loading shared flowcharts...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-danger mb-4" style={{ fontSize: '5rem' }}></i>
          <h2 className="mb-3">{error}</h2>
          <p className="text-muted mb-4">
            {error.includes('expired') || error.includes('no longer active')
              ? 'This share link has expired or is no longer active.'
              : 'This link may have been removed or you may not have permission to access it.'}
          </p>
          <div className="alert alert-warning d-inline-block" role="alert">
            <i className="ri-information-line me-2"></i>
            Please contact the person who shared this link for a new one.
          </div>
        </div>
      </div>
    );
  }

  if (selectedChart) {
    const nodes = selectedChart.nodes || [];
    const edges = (selectedChart.edges || []).map((edge, index) => ({
      ...edge,
      id: String(edge.id || `edge-${index}`),
      type: DEFAULT_EDGE_OPTIONS.type,
      markerEnd: { ...DEFAULT_EDGE_OPTIONS.markerEnd },
      style: { ...EDGE_LINE_STYLE },
    }));

    return (
      <div className="container-fluid shared-view p-4" style={{ height: '100vh' }}>
        <div className="mb-3">
          <button className="btn btn-outline-secondary mb-3" onClick={() => setSelectedChart(null)}>
            <i className="ri-arrow-left-line me-2"></i>Back to List
          </button>
          <h2>{selectedChart.title}</h2>
        </div>
        <div className="card shadow-sm" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="card-body p-0">
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
                  nodeColor={(node) => (node?.data?.variant === 'danger' ? '#dc3545' : EDGE_COLOR)}
                  nodeStrokeColor={() => EDGE_COLOR}
                />
                <Controls showInteractive={false} />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid shared-view p-4">
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <i className="ri-share-line text-primary" style={{ fontSize: '2.5rem' }}></i>
          <div>
            <h1 className="mb-1">{shareData.name}</h1>
            <div className="d-flex flex-wrap gap-3 text-muted">
              <small>
                <i className="ri-git-branch-line me-1"></i>
                {shareData.flowcharts?.length || 0} flowchart{shareData.flowcharts?.length !== 1 ? 's' : ''}
              </small>
              <small>
                <i className="ri-eye-line me-1"></i>
                {shareData.accessCount} view{shareData.accessCount !== 1 ? 's' : ''}
                {shareData.maxAccessCount && ` / ${shareData.maxAccessCount}`}
              </small>
              {shareData.expiresAt && (
                <small className={new Date(shareData.expiresAt) < new Date() ? 'text-danger' : 'text-warning'}>
                  <i className="ri-time-line me-1"></i>
                  {getTimeRemaining(shareData.expiresAt)}
                </small>
              )}
              {!shareData.expiresAt && (
                <small className="text-success">
                  <i className="ri-infinity-line me-1"></i>
                  No expiration
                </small>
              )}
            </div>
          </div>
        </div>

        {shareData.expiresAt && (
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <i className="ri-information-line me-2"></i>
            This share will expire on <strong className="ms-1">{formatDate(shareData.expiresAt)}</strong>
          </div>
        )}
      </div>

      <div className="row g-3">
        {shareData.flowcharts?.map((chart) => {
          const nodeTotal = Array.isArray(chart?.nodes) ? chart.nodes.length : 0;
          const edgeTotal = Array.isArray(chart?.edges) ? chart.edges.length : 0;
          const updatedLabel = chart.updatedAt
            ? `Updated ${new Date(chart.updatedAt).toLocaleDateString()}`
            : 'Never saved';

          return (
            <div key={chart._id} className="col-12 col-md-6 col-lg-4">
              <div
                className="card h-100 file-card flowchart-card"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedChart(chart)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="flowchart-card-icon">
                        <i className="ri-git-branch-line"></i>
                      </div>
                      <div>
                        <h5 className="mb-1 text-truncate">{chart.title}</h5>
                        <small className="text-muted">{updatedLabel}</small>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <div className="d-flex flex-column small text-muted">
                      <span>{nodeTotal} nodes</span>
                      <span>{edgeTotal} connections</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChart(chart);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlowChartSharedView;
