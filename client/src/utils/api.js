import config from '../config';

const BASE_URL = config.API_URL;

const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${BASE_URL}${url}`, {
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