import React from 'react'

const Modal = ({ open, title, children, footer, onClose }) => {
  if (!open) return null
  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        <div className="modal-header">
          <h5 className="mb-0">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal
