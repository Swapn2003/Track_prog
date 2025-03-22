import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get } from '../utils/api';
import './AllProblems.css';

const AllProblems = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [topicEntries, setTopicEntries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopics, setExpandedTopics] = useState({});

  // Function to check if an entry is new (less than 7 days old)
  const isNew = (dateString) => {
    const entryDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - entryDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // First fetch all topics
        const topicsData = await get('/api/topics');
        setTopics(topicsData);

        // Then fetch entries for each topic
        const entriesMap = {};
        for (const topic of topicsData) {
          const topicEntries = await get(`/api/entries/topic/${encodeURIComponent(topic)}`);
          entriesMap[topic] = topicEntries;
        }
        
        setTopicEntries(entriesMap);
        
        // Initially expand all topics
        const initialExpanded = {};
        topicsData.forEach(topic => {
          initialExpanded[topic] = true;
        });
        setExpandedTopics(initialExpanded);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const toggleTopicExpand = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTopics = topics.filter(topic => {
    // If we have a search term, check if topic matches or any entries match
    if (searchTerm) {
      const entriesForTopic = topicEntries[topic] || [];
      
      // Check if topic name matches
      if (topic.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      
      // Check if any entries match by title or description
      return entriesForTopic.some(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.subtopics && entry.subtopics.some(subtopic => 
          subtopic.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }
    
    // If no search term, include all topics
    return true;
  });

  if (loading) return <div className="loading">Loading problems...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="all-problems-container">
      <div className="all-problems-header">
        <h1>All Problems</h1>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="Search problems by title, description, or topic..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      <div className="topics-list">
        {filteredTopics.length === 0 ? (
          <div className="no-results">No topics or problems match your search.</div>
        ) : (
          filteredTopics.map(topic => {
            const entriesForTopic = topicEntries[topic] || [];
            
            // If searching, only show entries that match the search
            const filteredEntries = searchTerm 
              ? entriesForTopic.filter(entry => 
                  entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (entry.subtopics && entry.subtopics.some(subtopic => 
                    subtopic.toLowerCase().includes(searchTerm.toLowerCase())
                  ))
                )
              : entriesForTopic;

            // Sort entries: starred first, then basic, then alphabetically
            const sortedEntries = [...filteredEntries].sort((a, b) => {
              // Starred items first
              if (a.isStarred && !b.isStarred) return -1;
              if (!a.isStarred && b.isStarred) return 1;
              
              // Then basic items
              if (a.isBasic && !b.isBasic) return -1;
              if (!a.isBasic && b.isBasic) return 1;
              
              // Alphabetical by title
              return a.title.localeCompare(b.title);
            });
            
            // Don't display topics with no matching entries when searching
            if (searchTerm && sortedEntries.length === 0 && !topic.toLowerCase().includes(searchTerm.toLowerCase())) {
              return null;
            }
            
            return (
              <div key={topic} className="topic-section">
                <div className="topic-header-row">
                  <Link to={`/topic/${encodeURIComponent(topic)}`} className="topic-name">
                    {topic} <span className="count-badge">{sortedEntries.length}</span>
                  </Link>
                  <button 
                    className="expand-toggle"
                    onClick={() => toggleTopicExpand(topic)}
                  >
                    {expandedTopics[topic] ? '▼' : '►'}
                  </button>
                </div>
                
                {expandedTopics[topic] && (
                  <div className="topic-entries">
                    {sortedEntries.length === 0 ? (
                      <div className="no-entries">No problems added for this topic yet.</div>
                    ) : (
                      sortedEntries.map(entry => (
                        <div key={entry._id} className="entry-item">
                          <div className="entry-header">
                            <div className="entry-badges">
                              {entry.isStarred && <span className="badge star">★</span>}
                              {entry.isBasic && <span className="badge basic">Basic</span>}
                              {entry.createdAt && isNew(entry.createdAt) && 
                                <span className="badge new">New</span>
                              }
                            </div>
                            <h3 className="entry-title">{entry.title}</h3>
                          </div>
                          
                          {entry.subtopics && entry.subtopics.length > 0 && (
                            <div className="entry-subtopics">
                              {entry.subtopics.map(subtopic => (
                                <span key={subtopic} className="subtopic-tag">
                                  {subtopic}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="entry-actions">
                            <a 
                              href={entry.problemLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="solve-link"
                            >
                              Solve →
                            </a>
                            <Link 
                              to={`/topic/${encodeURIComponent(topic)}`}
                              state={{ selectedEntryId: entry._id }}
                              className="view-details"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AllProblems; 