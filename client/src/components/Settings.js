import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patch } from '../utils/api';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [folderId, setFolderId] = useState(user.folderId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await patch('/api/auth/update-folder', { folderId });
            
            // Update local storage with new token and user data
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            setSuccess('Folder ID updated successfully!');
        } catch (err) {
            setError(err.message || 'Failed to update folder ID');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-card">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <button onClick={() => navigate(-1)} className="back-button">
                        ← Back
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="folderId">Google Drive Folder ID</label>
                        <input
                            type="text"
                            id="folderId"
                            value={folderId}
                            onChange={(e) => setFolderId(e.target.value)}
                            required
                            placeholder="Enter your Google Drive folder ID"
                        />
                        <small className="help-text">
                            This is where your spreadsheets will be stored. You can find the folder ID in the URL when you open your Google Drive folder.
                        </small>
                    </div>

                    <button type="submit" className="save-button" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Folder ID'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings; 