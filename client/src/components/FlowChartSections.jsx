import React from "react";

const SectionCard = ({ title, subtitle, actions, children, className = "" }) => (
  <section className={`flowchart-section card shadow-sm ${className}`.trim()}>
    <div className="card-body">
      <div className="flowchart-section__head">
        <div>
          <h3 className="mb-1">{title}</h3>
          {subtitle ? <small className="text-muted d-block">{subtitle}</small> : null}
        </div>
        {actions ? <div className="flowchart-section__actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  </section>
);

const mergeClassName = (baseClass, extraClass = "") =>
  [baseClass, extraClass].filter(Boolean).join(" ");

export const FlowChartLibraryCard = ({ className = "", ...rest }) => (
  <SectionCard {...rest} className={mergeClassName("flowchart-section--library", className)} />
);

export const FlowChartDesignerCard = ({ className = "", ...rest }) => (
  <SectionCard {...rest} className={mergeClassName("flowchart-section--designer", className)} />
);

export default SectionCard;
