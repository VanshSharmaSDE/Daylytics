import React from 'react'

const Loader = ({ message = 'Loading...' }) => (
  <div className="overlay-loader">
    <div className="overlay-backdrop" />
    <div className="overlay-content">
      <div className="spinner-border text-primary" role="status" />
      <p className="mt-3 mb-0 text-muted">{message}</p>
    </div>
  </div>
)

export default Loader
