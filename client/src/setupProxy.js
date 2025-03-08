const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Only apply proxy in development
  if (process.env.NODE_ENV === 'development') {
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        onError: (err, req, res) => {
          console.error('Proxy Error:', err);
          res.status(500).send('Proxy Error');
        }
      })
    );
  }
}; 