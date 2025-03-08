const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.NODE_ENV === 'production'
  ? 'https://track-prog-backend.onrender.com'
  : 'http://localhost:3001';

module.exports = function(app) {
  // Proxy API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
      }
    })
  );

  // Proxy favicon and other static requests
  app.use(
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
      }
    })
  );
}; 