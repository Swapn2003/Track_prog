const { createProxyMiddleware } = require('http-proxy-middleware');

// This file is only used in development
// In production, it is completely ignored
module.exports = function(app) {
  // Double-check we are in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Setting up development proxy for /api routes to localhost:3001');
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        pathRewrite: {
          '^/api': '/api' // keep the /api prefix
        },
        onError: (err, req, res) => {
          console.error('Proxy Error:', err);
          res.status(500).send('Proxy Error');
        },
        logLevel: 'debug' // add more detailed logging
      })
    );
  } else {
    console.log('Production mode - proxy not enabled');
  }
}; 