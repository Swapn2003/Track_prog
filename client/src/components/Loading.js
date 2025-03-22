import React from 'react';

// Memory-efficient loading component that uses CSS for animation
// instead of JavaScript timers
const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading</span>
        </div>
        <p className="loading-text">{message}</p>
      </div>
      <style jsx>{`
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }
        
        .spinner {
          text-align: center;
        }
        
        .loading-text {
          margin-top: 10px;
          color: #6c757d;
        }
        
        .spinner-border {
          color: #007bff;
          width: 3rem;
          height: 3rem;
        }
      `}</style>
    </div>
  );
};

export default React.memo(Loading); 