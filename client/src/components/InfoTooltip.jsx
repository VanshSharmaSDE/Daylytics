import React, { useState, useRef, useEffect } from 'react';

const InfoTooltip = ({ content, className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const toggle = (e) => {
    e.preventDefault();
    setOpen((s) => !s);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((s) => !s);
    }
  };

  return (
    <div ref={rootRef} className={`info-tooltip ${open ? 'open' : ''} ${className}`}>
      <button
        className="info-btn"
        type="button"
        aria-label="More information"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
      >
        <i className="ri-information-line" aria-hidden="true"></i>
      </button>
      <div className="info-content" role="tooltip" aria-hidden={!open}>
        {content}
      </div>
    </div>
  );
};

export default InfoTooltip;

