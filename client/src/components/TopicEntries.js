import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { get, patch } from '../utils/api';
import SubtopicManager from './SubtopicManager';
import SubtopicFilter from './SubtopicFilter';
import ReferenceMaterials from './ReferenceMaterials';
import './TopicEntries.css';

const TopicEntries = () => {
    const { topic } = useParams();
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEntries, setExpandedEntries] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [availableSubtopics, setAvailableSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState('');
    const [editingSubtopics, setEditingSubtopics] = useState(null);

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const data = await get(`/api/entries/topic/${encodeURIComponent(topic)}`);
                setEntries(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        const fetchSubtopics = async () => {
            try {
                const data = await get(`/api/topics/${encodeURIComponent(topic)}/subtopics`);
                setAvailableSubtopics(data);
            } catch (err) {
                console.error('Error fetching subtopics:', err);
            }
        };

        fetchEntries();
        fetchSubtopics();
    }, [topic]);

    const toggleExpand = (entryId, level) => {
        setExpandedEntries(prev => ({
            ...prev,
            [entryId]: {
                ...prev[entryId],
                [level]: !prev[entryId]?.[level]
            }
        }));
    };

    const handleAddProblem = () => {
        navigate('/add', { state: { preselectedTopic: topic } });
    };

    const toggleStar = async (entryId) => {
        try {
            const entry = entries.find(e => e._id === entryId);
            const updatedEntry = { ...entry, isStarred: !entry.isStarred };
            
            await patch(`/api/entries/${entryId}`, { isStarred: updatedEntry.isStarred });

            setEntries(entries.map(e => 
                e._id === entryId ? updatedEntry : e
            ));
        } catch (err) {
            console.error('Error updating entry:', err);
        }
    };

    const toggleBasic = async (entryId) => {
        try {
            const entry = entries.find(e => e._id === entryId);
            const updatedEntry = { ...entry, isBasic: !entry.isBasic };
            
            await patch(`/api/entries/${entryId}`, { isBasic: updatedEntry.isBasic });

            setEntries(entries.map(e => 
                e._id === entryId ? updatedEntry : e
            ));
        } catch (err) {
            console.error('Error updating entry:', err);
        }
    };

    const handleSubtopicsUpdate = (updatedSubtopics) => {
        if (!editingSubtopics) return;
        
        // Update the entry in the local state
        setEntries(entries.map(e => 
            e._id === editingSubtopics ? { ...e, subtopics: updatedSubtopics } : e
        ));
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;

        // Filter by subtopic if one is selected
        if (selectedSubtopic && (!entry.subtopics || !entry.subtopics.includes(selectedSubtopic))) {
            return false;
        }

        switch (activeTab) {
            case 'starred':
                return entry.isStarred;
            case 'basics':
                return entry.isBasic;
            default:
                return true;
        }
    });

    if (loading) return <div className="loading">Loading entries...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="topic-entries-container">
            <div className="topic-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="back-button">
                        ← Back
                    </button>
                    <h1>{topic}</h1>
                </div>
                <button onClick={handleAddProblem} className="add-entry-button">
                    + Add Problem
                </button>
            </div>
            
            <SubtopicFilter />
            
            <div className="search-section">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search problems by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                {availableSubtopics.length > 0 && (
                    <div className="subtopic-filter">
                        <select 
                            value={selectedSubtopic} 
                            onChange={(e) => setSelectedSubtopic(e.target.value)}
                            className="subtopic-select"
                        >
                            <option value="">All Subtopics</option>
                            {availableSubtopics.map(subtopic => (
                                <option key={subtopic} value={subtopic}>{subtopic}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="tabs-container">
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Problems
                    </button>
                    <button 
                        className={`tab ${activeTab === 'basics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basics')}
                    >
                        Basics
                    </button>
                    <button 
                        className={`tab ${activeTab === 'starred' ? 'active' : ''}`}
                        onClick={() => setActiveTab('starred')}
                    >
                        Starred
                    </button>
                    <button 
                        className={`tab ${activeTab === 'references' ? 'active' : ''}`}
                        onClick={() => setActiveTab('references')}
                    >
                        References
                    </button>
                </div>
            </div>
            
            {activeTab === 'references' ? (
                <ReferenceMaterials topic={topic} />
            ) : (
                <>
                    {filteredEntries.length === 0 ? (
                        <div className="no-entries">
                            {searchTerm ? (
                                <p>No problems found matching your search.</p>
                            ) : (
                                <>
                                    <p>No problems added yet for this topic.</p>
                                    <button onClick={handleAddProblem}>Add Your First Problem</button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="entries-list">
                            {filteredEntries.map(entry => (
                                <div key={entry._id} className="entry-card">
                                    <div className="entry-header">
                                        <div className="problem-badge">
                                            {entry.isStarred && <span className="badge star">Starred</span>}
                                            {entry.isBasic && <span className="badge basic">Basic</span>}
                                        </div>
                                        <h2>{entry.title}</h2>
                                        <p className="description">{entry.description}</p>
                                        
                                        {/* Display subtopics */}
                                        {entry.subtopics && entry.subtopics.length > 0 && (
                                            <div className="entry-subtopics">
                                                {entry.subtopics.map(subtopic => (
                                                    <span key={subtopic} className="subtopic-tag-display">
                                                        {subtopic}
                                                    </span>
                                                ))}
                                                <button 
                                                    className="edit-subtopics-button"
                                                    onClick={() => setEditingSubtopics(entry._id)}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Edit subtopics */}
                                        {editingSubtopics === entry._id && (
                                            <div className="edit-subtopics-container">
                                                <SubtopicManager 
                                                    topic={topic}
                                                    entryId={entry._id}
                                                    initialSubtopics={entry.subtopics || []}
                                                    onUpdate={handleSubtopicsUpdate}
                                                />
                                                <button 
                                                    className="close-subtopics-button"
                                                    onClick={() => setEditingSubtopics(null)}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* If no subtopics, show add button */}
                                        {(!entry.subtopics || entry.subtopics.length === 0) && editingSubtopics !== entry._id && (
                                            <button 
                                                className="add-subtopics-button"
                                                onClick={() => setEditingSubtopics(entry._id)}
                                            >
                                                + Add Subtopics
                                            </button>
                                        )}
                                        
                                        <a href={entry.problemLink} target="_blank" rel="noopener noreferrer" className="problem-link">
                                            Solve Problem →
                                        </a>
                                        <div className="problem-actions">
                                            <button 
                                                className={`star-button ${entry.isStarred ? 'active' : ''}`}
                                                onClick={() => toggleStar(entry._id)}
                                            >
                                                {entry.isStarred ? '★ Starred' : '☆ Star'}
                                            </button>
                                            <button 
                                                className={`basic-button ${entry.isBasic ? 'active' : ''}`}
                                                onClick={() => toggleBasic(entry._id)}
                                            >
                                                {entry.isBasic ? '✓ Basic' : '○ Mark as Basic'}
                                            </button>
                                        </div>
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
                </>
            )}
        </div>
    );
};

export default TopicEntries; 