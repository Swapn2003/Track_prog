import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../utils/api';
import './TopicEntries.css'; // Reuse the same styles

const SubtopicEntries = () => {
    const { topic, subtopic } = useParams();
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEntries, setExpandedEntries] = useState({});

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                setLoading(true);
                const data = await get(`/api/entries/topic/${encodeURIComponent(topic)}/subtopic/${encodeURIComponent(subtopic)}`);
                setEntries(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchEntries();
    }, [topic, subtopic]);

    const toggleExpand = (entryId, level) => {
        setExpandedEntries(prev => ({
            ...prev,
            [entryId]: {
                ...prev[entryId],
                [level]: !prev[entryId]?.[level]
            }
        }));
    };

    const handleBackToTopic = () => {
        navigate(`/topic/${encodeURIComponent(topic)}`);
    };

    if (loading) return <div className="loading">Loading entries...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="topic-entries-container">
            <div className="topic-header">
                <div className="header-left">
                    <button onClick={handleBackToTopic} className="back-button">
                        ← Back to {topic}
                    </button>
                    <h1>{topic}: {subtopic}</h1>
                </div>
            </div>
            
            {entries.length === 0 ? (
                <div className="no-entries">
                    <p>No problems found for subtopic "{subtopic}".</p>
                    <button onClick={handleBackToTopic}>Back to {topic}</button>
                </div>
            ) : (
                <div className="entries-list">
                    {entries.map(entry => (
                        <div key={entry._id} className="entry-card">
                            <div className="entry-header">
                                <div className="problem-badge">
                                    {entry.isStarred && <span className="badge star">Starred</span>}
                                    {entry.isBasic && <span className="badge basic">Basic</span>}
                                </div>
                                <h2>{entry.title}</h2>
                                <p className="description">{entry.description}</p>
                                
                                <a href={entry.problemLink} target="_blank" rel="noopener noreferrer" className="problem-link">
                                    Solve Problem →
                                </a>
                            </div>
                            
                            <div className="entry-details">
                                <button 
                                    className="expand-button"
                                    onClick={() => toggleExpand(entry._id, 'approach')}
                                >
                                    {expandedEntries[entry._id]?.approach ? 'Hide Approach' : 'Show Approach'}
                                </button>
                                
                                {expandedEntries[entry._id]?.approach && (
                                    <div className="approach-section">
                                        <h3>Approach</h3>
                                        <p>{entry.approach}</p>
                                        <div className="complexity">
                                            <p>Time Complexity: {entry.timeComplexity}</p>
                                            <p>Space Complexity: {entry.spaceComplexity}</p>
                                        </div>
                                        
                                        <button 
                                            className="expand-button"
                                            onClick={() => toggleExpand(entry._id, 'code')}
                                        >
                                            {expandedEntries[entry._id]?.code ? 'Hide Code' : 'Show Code'}
                                        </button>
                                        
                                        {expandedEntries[entry._id]?.code && (
                                            <div className="code-section">
                                                <h3>Solution</h3>
                                                <pre><code>{entry.code}</code></pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubtopicEntries; 