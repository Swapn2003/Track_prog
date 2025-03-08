const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Request failed');
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