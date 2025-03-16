import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { get, post } from '../utils/api';
import SubtopicManager from './SubtopicManager';
import './AddEntry.css';

const AddEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedTopic = location.state?.preselectedTopic || '';

    const [topics, setTopics] = useState([]);
    const [formData, setFormData] = useState({
        topic: preselectedTopic,
        title: '',
        description: '',
        problemLink: '',
        approach: '',
        code: '',
        timeComplexity: '',
        spaceComplexity: '',
        subtopics: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch existing topics for the dropdown
        const fetchTopics = async () => {
            try {
                const data = await get('/api/topics');
                setTopics(data);
            } catch (err) {
                console.error('Error fetching topics:', err);
            }
        };

        fetchTopics();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubtopicsUpdate = (updatedSubtopics) => {
        setFormData(prev => ({
            ...prev,
            subtopics: updatedSubtopics
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await post('/api/entries', formData);
            navigate(`/topic/${encodeURIComponent(formData.topic)}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="add-entry-container">
            <div className="add-entry-header">
                <h1>Add New Problem</h1>
                <button type="button" onClick={() => navigate(-1)} className="back-button">
                    ← Back
                </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="entry-form">
                <div className="form-group">
                    <label htmlFor="topic">Topic</label>
                    <input
                        type="text"
                        id="topic"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        required
                        placeholder="Enter or select a topic"
                        list="topics-list"
                    />
                    <datalist id="topics-list">
                        {topics.map((topic, index) => (
                            <option key={index} value={topic} />
                        ))}
                    </datalist>
                </div>

                {formData.topic && (
                    <div className="form-group subtopic-container">
                        <SubtopicManager 
                            topic={formData.topic}
                            initialSubtopics={formData.subtopics}
                            onUpdate={handleSubtopicsUpdate}
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Problem title"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Brief description of the problem"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="problemLink">Problem Link</label>
                    <input
                        type="url"
                        id="problemLink"
                        name="problemLink"
                        value={formData.problemLink}
                        onChange={handleChange}
                        required
                        placeholder="Link to the problem"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="approach">Approach</label>
                    <textarea
                        id="approach"
                        name="approach"
                        value={formData.approach}
                        onChange={handleChange}
                        required
                        placeholder="Explain your approach to solving the problem"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="code">Solution Code</label>
                    <textarea
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        placeholder="Paste your solution code here"
                        className="code-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="timeComplexity">Time Complexity</label>
                    <input
                        type="text"
                        id="timeComplexity"
                        name="timeComplexity"
                        value={formData.timeComplexity}
                        onChange={handleChange}
                        required
                        placeholder="e.g., O(n)"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="spaceComplexity">Space Complexity</label>
                    <input
                        type="text"
                        id="spaceComplexity"
                        name="spaceComplexity"
                        value={formData.spaceComplexity}
                        onChange={handleChange}
                        required
                        placeholder="e.g., O(n)"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Adding Problem...' : 'Add Problem'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEntry; 