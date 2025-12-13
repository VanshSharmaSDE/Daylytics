import React, { useCallback, useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../components/ToastProvider";
import FlowChartEditor from "./FlowChartEditor";
import Modal from "../components/Modal";
import FlowChartShareManager from "../components/FlowChartShareManager";
import { FlowChartLoader } from "../components/LoadingStates";

const FlowChartTab = () => {
  const { addToast } = useToast();
  const [flowcharts, setFlowcharts] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [viewMode, setViewMode] = useState("library");
  const [namingModal, setNamingModal] = useState({
    open: false,
    mode: null,
    chart: null,
  });
  const [chartNameInput, setChartNameInput] = useState("");
  const [nameModalError, setNameModalError] = useState("");
  const [renamingChartId, setRenamingChartId] = useState(null);
  const [showShareManager, setShowShareManager] = useState(false);

  const fetchFlowcharts = useCallback(async () => {
    setLoadingCharts(true);
    try {
      const response = await api.get("/api/flowcharts");
      setFlowcharts(response.data || []);
    } catch (error) {
      console.error("Failed to load flow charts", error);
      addToast("error", "Unable to load flow charts");
    } finally {
      setLoadingCharts(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFlowcharts();
  }, [fetchFlowcharts]);

  const openNameModal = useCallback((mode, chart = null) => {
    setNamingModal({ open: true, mode, chart });
    setChartNameInput(chart?.title || "");
    setNameModalError("");
  }, []);

  const closeNameModal = useCallback(() => {
    setNamingModal({ open: false, mode: null, chart: null });
    setChartNameInput("");
    setNameModalError("");
  }, []);

  const handleNewChartTrigger = useCallback(() => {
    openNameModal("create");
  }, [openNameModal]);

  const handleSelectChart = useCallback((chart) => {
    setSelectedChart(chart);
    setViewMode("editor");
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setViewMode("library");
    setSelectedChart(null);
    fetchFlowcharts();
  }, [fetchFlowcharts]);

  const handleShareChart = useCallback(() => {
    setShowShareManager(true);
  }, []);

  const handleRenameRequest = useCallback(
    (chart) => {
      if (!chart?._id) {
        return;
      }
      openNameModal("rename", chart);
    },
    [openNameModal]
  );

  const handleNameModalSubmit = useCallback(async () => {
    const trimmed = chartNameInput.trim();

    if (!trimmed) {
      setNameModalError("Give this chart a name.");
      return;
    }

    if (trimmed.length > 120) {
      setNameModalError("Keep the title under 120 characters.");
      return;
    }

    if (namingModal.mode === "create") {
      closeNameModal();
      try {
        const response = await api.post("/api/flowcharts", {
          title: trimmed,
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        });
        setFlowcharts((current) => [response.data, ...current]);
        setSelectedChart(response.data);
        setViewMode("editor");
        addToast("success", "Flow chart created.");
      } catch (error) {
        console.error("Failed to create chart", error);
        addToast("error", "Failed to create chart.");
      }
      return;
    }

    if (namingModal.mode === "rename" && namingModal.chart?._id) {
      setRenamingChartId(namingModal.chart._id);
      try {
        const response = await api.get(
          `/api/flowcharts/${namingModal.chart._id}`
        );
        const referenceChart = response.data;

        const payload = {
          title: trimmed,
          nodes: referenceChart.nodes || [],
          edges: referenceChart.edges || [],
          viewport: referenceChart.viewport || { x: 0, y: 0, zoom: 1 },
        };

        const updateResponse = await api.put(
          `/api/flowcharts/${referenceChart._id}`,
          payload
        );

        setFlowcharts((current) =>
          current.map((chart) =>
            chart._id === updateResponse.data._id ? updateResponse.data : chart
          )
        );

        if (selectedChart?._id === updateResponse.data._id) {
          setSelectedChart(updateResponse.data);
        }

        addToast("success", "Chart renamed.");
        closeNameModal();
      } catch (error) {
        console.error("Failed to rename chart", error);
        const message =
          error.response?.data?.message ||
          error.message ||
          "Unable to rename chart.";
        setNameModalError(message);
      } finally {
        setRenamingChartId(null);
      }
    }
  }, [
    addToast,
    chartNameInput,
    closeNameModal,
    namingModal,
    selectedChart,
    setFlowcharts,
  ]);

  const handleChartUpdate = useCallback((updatedChart) => {
    setFlowcharts((current) =>
      current.map((chart) =>
        chart._id === updatedChart._id ? updatedChart : chart
      )
    );
    setSelectedChart(updatedChart);
  }, []);

  const handleChartDelete = useCallback(
    (deletedId) => {
      setFlowcharts((current) =>
        current.filter((chart) => chart._id !== deletedId)
      );
      handleBackToLibrary();
    },
    [handleBackToLibrary]
  );

  const renderNameModal = () => {
    if (!namingModal.open) {
      return null;
    }

    const modalTitle =
      namingModal.mode === "rename" ? "Rename chart" : "Name your chart";
    const confirmLabel =
      namingModal.mode === "rename"
        ? renamingChartId
          ? "Renaming..."
          : "Rename"
        : "Continue";

    return (
      <div className="chart-name-modal" role="dialog" aria-modal="true">
        <div
          className="chart-name-modal__backdrop"
          onClick={renamingChartId ? undefined : closeNameModal}
        ></div>
        <div className="chart-name-modal__dialog">
          <h5 className="mb-2">{modalTitle}</h5>
          <p className="text-muted small mb-3">
            {namingModal.mode === "rename"
              ? "Update how this chart appears in your library."
              : "Give this flow a name before jumping into the canvas."}
          </p>
          <input
            type="text"
            className="form-control"
            placeholder="Flow name"
            value={chartNameInput}
            onChange={(event) => {
              setChartNameInput(event.target.value);
              if (nameModalError) {
                setNameModalError("");
              }
            }}
            maxLength={120}
            autoFocus
            disabled={Boolean(renamingChartId)}
          />
          {nameModalError ? (
            <div className="text-danger small mt-2">{nameModalError}</div>
          ) : null}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={closeNameModal}
              disabled={Boolean(renamingChartId)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNameModalSubmit}
              disabled={Boolean(renamingChartId)}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === "library") {
    const chartCountLabel =
      flowcharts.length === 1
        ? "1 saved chart"
        : `${flowcharts.length} saved charts`;
    const librarySubtitle = flowcharts.length
      ? chartCountLabel
      : "Store every workflow like a folder and jump back in anytime.";
    return (
      <>
        <div className="flowchart-tab h-100">
          {loadingCharts ? (
            <FlowChartLoader />
          ) : flowcharts.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <i className="ri-folder-add-line display-5 text-primary d-block mb-3"></i>
                <p className="text-muted mb-3">
                  No charts yet. Name your first flow to get started.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleNewChartTrigger}
                >
                  Name a chart
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="mb-1">Flow Charts</h2>
                  <p className="text-muted mb-0">{librarySubtitle}</p>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={fetchFlowcharts}
                    disabled={loadingCharts}
                    title="Reload charts"
                  >
                    <i className="ri-refresh-line"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={handleShareChart}
                  >
                    <i className="ri-share-line me-sm-2"></i>
                    <span className="d-none d-sm-inline">Share</span>
                  </button>
                  <button
                    className="btn btn-primary d-flex align-items-center"
                    onClick={handleNewChartTrigger}
                  >
                    <i className="ri-add-line me-sm-2"></i>
                    <span className="d-none d-sm-inline">New Chart</span>
                  </button>
                </div>
              </div>
              <div className="row g-3">
                {flowcharts.map((chart) => {
                  const nodeTotal = Array.isArray(chart?.nodes)
                    ? chart.nodes.length
                    : Array.isArray(chart?.steps)
                    ? chart.steps.length
                    : 0;
                  const edgeTotal = Array.isArray(chart?.edges)
                    ? chart.edges.length
                    : 0;
                  const updatedLabel = chart.updatedAt
                    ? `Updated ${new Date(
                        chart.updatedAt
                      ).toLocaleDateString()}`
                    : "Never saved";

                  return (
                    <div key={chart._id} className="col-12 col-md-6 col-lg-4">
                      <div
                        className="card h-100 file-card flowchart-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectChart(chart)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleSelectChart(chart);
                          }
                        }}
                      >
                        <div className="card-body d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-3">
                              <div className="flowchart-card-icon">
                                <i className="ri-git-branch-line"></i>
                              </div>
                              <div>
                                <h5 className="mb-1 text-truncate">
                                  {chart.title}
                                </h5>
                                <small className="text-muted">
                                  {updatedLabel}
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="file-pin-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRenameRequest(chart);
                              }}
                              disabled={renamingChartId === chart._id}
                              title="Rename chart"
                              aria-label="Rename chart"
                            >
                              {renamingChartId === chart._id ? (
                                <div
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                />
                              ) : (
                                <i className="ri-edit-line"></i>
                              )}
                            </button>
                          </div>
                          <div className="mt-auto d-flex justify-content-between align-items-center">
                            <div className="d-flex flex-column small text-muted">
                              <span>{nodeTotal} nodes</span>
                              <span>{edgeTotal} connections</span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSelectChart(chart);
                              }}
                            >
                              Open
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {renderNameModal()}

        {showShareManager && (
          <FlowChartShareManager
            flowcharts={flowcharts}
            onClose={() => setShowShareManager(false)}
          />
        )}
      </>
    );
  }

  if (viewMode === "editor" && selectedChart) {
    return (
      <FlowChartEditor
        initialChart={selectedChart}
        onBack={handleBackToLibrary}
        onUpdate={handleChartUpdate}
        onDelete={handleChartDelete}
      />
    );
  }

  return null;
};

export default FlowChartTab;
