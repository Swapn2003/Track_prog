import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../utils/api';
import './Topics.css';

const Topics = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddTopic, setShowAddTopic] = useState(false);
    const [newTopic, setNewTopic] = useState('');
    const [topicSearchTerm, setTopicSearchTerm] = useState('');
    const [problemSearchTerm, setProblemSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    useEffect(() => {
        const searchProblems = async () => {
            if (!problemSearchTerm.trim()) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const data = await get(`/api/entries/search?query=${encodeURIComponent(problemSearchTerm)}`);
                setSearchResults(data);
            } catch (err) {
                console.error('Error searching problems:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(searchProblems, 300);
        return () => clearTimeout(debounceTimer);
    }, [problemSearchTerm]);

    const fetchTopics = async () => {
        try {
            const data = await get('/api/topics');
            setTopics(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleAddTopic = async () => {
        if (!newTopic.trim() || topics.includes(newTopic.trim())) {
            return;
        }

        try {
            await post('/api/topics', { topic: newTopic.trim() });
            await fetchTopics(); // Refresh topics list
            setNewTopic('');
            setShowAddTopic(false);
        } catch (err) {
            setError('Failed to add topic: ' + err.message);
        }
    };

    const filteredTopics = topics.filter(topic =>
        topic.toLowerCase().includes(topicSearchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Loading topics...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="topics-container">
            <div className="topics-header">
                <h1>DSA Topics</h1>
                <button 
                    className="add-topic-button"
                    onClick={() => setShowAddTopic(true)}
                >
                    Add New Topic
                </button>
            </div>

            <div className="search-section">
                <div className="search-row">
                    <div className="search-column">
                        <label className="search-label">Search Topics</label>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Enter topic name..."
                            value={topicSearchTerm}
                            onChange={(e) => setTopicSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="search-column">
                        <label className="search-label">Search All Problems</label>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by title, description, or topic..."
                            value={problemSearchTerm}
                            onChange={(e) => setProblemSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {problemSearchTerm && (
                    <div className="search-results">
                        {isSearching ? (
                            <div className="no-results">Searching problems...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="no-results">No problems found matching "{problemSearchTerm}"</div>
                        ) : (
                            <>
                                <div className="no-results" style={{ textAlign: 'left', padding: '0.75rem 1.25rem' }}>
                                    Found {searchResults.length} problem{searchResults.length === 1 ? '' : 's'}
                                </div>
                                {searchResults.map(result => (
                                    <div key={result._id} className="search-result-item">
                                        <div className="result-topic">
                                            Topic: {result.topic}
                                            {result.isBasic && <span className="badge basic">Basic</span>}
                                            {result.isStarred && <span className="badge star">Starred</span>}
                                        </div>
                                        <div className="result-title">{result.title}</div>
                                        <div className="result-description">{result.description}</div>
                                        <div className="result-actions">
                                            <Link 
                                                to={`/topic/${encodeURIComponent(result.topic)}`} 
                                                className="result-link"
                                            >
                                                View Details →
                                            </Link>
                                            <a 
                                                href={result.problemLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="result-link"
                                                style={{ color: '#3498db' }}
                                            >
                                                Solve Problem →
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {showAddTopic && (
                <div className="add-topic-form">
                    <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Enter new topic name"
                        className="topic-input"
                    />
                    <div className="topic-form-buttons">
                        <button 
                            className="save-topic-button"
                            onClick={handleAddTopic}
                        >
                            Save Topic
                        </button>
                        <button 
                            className="cancel-topic-button"
                            onClick={() => {
                                setShowAddTopic(false);
                                setNewTopic('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="topics-grid">
                {filteredTopics.map((topic, index) => (
                    <Link to={`/topic/${encodeURIComponent(topic)}`} key={index} className="topic-tile">
                        <div className="topic-content">
                            <h2>{topic}</h2>
                        </div>
                    </Link>
                ))}
            </div>

            <Link to="/add" className="add-problem-fab">
                + <span>Add Problem</span>
            </Link>
        </div>
    );
};

export default Topics; 