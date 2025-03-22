import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './components/App';
import 'bootstrap/dist/css/bootstrap.min.css';

// Function to clean up memory leaks in the event listeners
const cleanupEventListeners = () => {
  // Clean up any global event listeners that might cause memory leaks
  const elementsToClear = document.querySelectorAll(
    '[data-event-cleanup="true"]'
  );
  elementsToClear.forEach((element) => {
    element.parentNode?.removeChild(element);
  });
};

// Reduce the interval frequency to reduce memory pressure
const MEMORY_CHECK_INTERVAL = 60000; // 1 minute (up from 30 seconds)

// Memory optimization: Only add memory monitoring in development
if (process.env.NODE_ENV === 'development' && 'performance' in window && 'memory' in window.performance) {
  setInterval(() => {
    try {
      const { usedJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
      const usedMemoryPercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
      
      // If memory usage is getting high (over 80%), trigger cleanup
      if (usedMemoryPercentage > 80) {
        console.warn('Memory usage is high, cleaning up...');
        cleanupEventListeners();
        
        // Force garbage collection if possible (only works in some browsers)
        if (global.gc) {
          global.gc();
        }
      }
    } catch (e) {
      // Catch any errors in memory monitoring to prevent crashes
      console.warn('Error monitoring memory:', e);
    }
  }, MEMORY_CHECK_INTERVAL);
}

// Initialize app with minimal overhead
const container = document.getElementById('root');
const root = createRoot(container);

// Only use StrictMode in development
if (process.env.NODE_ENV === 'development') {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // In production, skip StrictMode to avoid double rendering
  root.render(<App />);
}

// Add helper functions for debugging memory issues only in development
if (process.env.NODE_ENV === 'development') {
  window.memoryCheck = () => {
    if ('performance' in window && 'memory' in window.performance) {
      const { usedJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
      console.log('Memory usage:', {
        used: Math.round(usedJSHeapSize / (1024 * 1024)) + 'MB',
        total: Math.round(jsHeapSizeLimit / (1024 * 1024)) + 'MB',
        percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100) + '%'
      });
    } else {
      console.log('Memory API not available in this browser');
    }
  };
} 