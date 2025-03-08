const PRODUCTION_API_URL = 'https://track-prog-backend.onrender.com';

const config = {
    // In production, use the full URL
    // In development, this won't be used as we use the proxy
    API_URL: process.env.REACT_APP_NODE_ENV  === 'production' 
        ? PRODUCTION_API_URL
        : ''
};

console.log('Config loaded:', {
    nodeEnv: process.env.REACT_APP_NODE_ENV ,
    apiUrl: config.API_URL
});

export default config; 