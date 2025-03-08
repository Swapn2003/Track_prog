const config = {
    API_URL: process.env.NODE_ENV === 'production' 
        ? 'https://track-prog-backend.onrender.com'
        : 'http://localhost:3001'
};

export default config; 