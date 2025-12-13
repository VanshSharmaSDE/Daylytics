import React, { useEffect, useRef } from "react";

const Modal = ({ open, title, children, footer, onClose, size }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const panelEl = panelRef.current;
    if (!panelEl) return;

    const target = panelEl.querySelector('[data-autofocus]') ||
      panelEl.querySelector("input, textarea, select, button, [tabindex]:not([tabindex='-1'])");

    if (target && typeof target.focus === "function") {
      requestAnimationFrame(() => target.focus());
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal-panel${size ? ` modal-panel--${size}` : ''}`} ref={panelRef}>
        <div className="modal-header">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
