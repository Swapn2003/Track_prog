import config from '../config';

const isDevelopment = process.env.NODE_ENV === 'development';
const BASE_URL = isDevelopment ? '' : config.API_URL;

const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    // In development, use relative URLs (proxy will handle it)
    // In production, use full URLs
    const fullUrl = isDevelopment ? url : `${BASE_URL}${url}`;

    console.log('Making API request to:', fullUrl);
    console.log('Environment:', process.env.NODE_ENV);

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