import config from '../config';

const isProduction = process.env.REACT_APP_NODE_ENV  === 'production';
const BASE_URL = isProduction ? config.API_URL : '';

const fetchWithAuth = async (url, options = {}) => {
    console.log('BAse', BASE_URL);
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    // In development, use relative URLs (proxy will handle it)
    // In production, use full URLs with the production API URL
    const fullUrl = isProduction ? `${BASE_URL}${url}` : url;

    console.log('Environment:', process.env.REACT_APP_NODE_ENV );
    console.log('Making API request to:', fullUrl);
    console.log('Is Production:', isProduction);
    console.log('Base URL:', BASE_URL);

    const response = await fetch(fullUrl, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
};

export const get = (url) => fetchWithAuth(url);

export const post = (url, body) => fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(body)
});

export const patch = (url, body) => fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(body)
});

export const del = (url) => fetchWithAuth(url, {
    method: 'DELETE'
}); 