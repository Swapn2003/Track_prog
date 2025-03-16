import React, { useState, useEffect } from 'react';
import { get, post, patch } from '../utils/api';
import './SubtopicManager.css';

const SubtopicManager = ({ topic, entryId, initialSubtopics = [], onUpdate }) => {
  const [subtopics, setSubtopics] = useState(initialSubtopics);
  const [availableSubtopics, setAvailableSubtopics] = useState([]);
  const [newSubtopic, setNewSubtopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available subtopics for this topic
  useEffect(() => {
    const fetchSubtopics = async () => {
      try {
        setIsLoading(true);
        const response = await get(`/api/topics/${encodeURIComponent(topic)}/subtopics`);
        setAvailableSubtopics(response);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching subtopics:', err);
        setError('Failed to load subtopics');
        setIsLoading(false);
      }
    };

    if (topic) {
      fetchSubtopics();
    }
  }, [topic]);

  // Add a subtopic to the entry
  const handleAddSubtopic = async (subtopic) => {
    // If it's already in the list, don't add it again
    if (subtopics.includes(subtopic)) return;

    try {
      const updatedSubtopics = [...subtopics, subtopic];
      
      // Update the entry with the new subtopics
      if (entryId) {
        await patch(`/api/entries/${entryId}`, { subtopics: updatedSubtopics });
      }
      
      setSubtopics(updatedSubtopics);
      
      // If this is a new subtopic, add it to the available list
      if (!availableSubtopics.includes(subtopic)) {
        setAvailableSubtopics([...availableSubtopics, subtopic]);
      }
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(updatedSubtopics);
      }
      
      setNewSubtopic('');
    } catch (err) {
      console.error('Error adding subtopic:', err);
      setError('Failed to add subtopic');
    }
  };

  // Remove a subtopic from the entry
  const handleRemoveSubtopic = async (subtopicToRemove) => {
    try {
      const updatedSubtopics = subtopics.filter(s => s !== subtopicToRemove);
      
      // Update the entry with the new subtopics
      if (entryId) {
        await patch(`/api/entries/${entryId}`, { subtopics: updatedSubtopics });
      }
      
      setSubtopics(updatedSubtopics);
      
      // Notify parent component
      if (onUpdate) {
        onUpdate(updatedSubtopics);
      }
    } catch (err) {
      console.error('Error removing subtopic:', err);
      setError('Failed to remove subtopic');
    }
  };

  // Handle form submission for adding a new subtopic
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newSubtopic.trim()) {
      handleAddSubtopic(newSubtopic.trim());
    }
  };

  return (
    <div className="subtopic-manager">
      <h4>Subtopics</h4>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="subtopics-list">
        {subtopics.length > 0 ? (
          subtopics.map(subtopic => (
            <div key={subtopic} className="subtopic-tag">
              <span>{subtopic}</span>
              <button 
                className="remove-subtopic" 
                onClick={() => handleRemoveSubtopic(subtopic)}
                aria-label={`Remove ${subtopic}`}
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="no-subtopics">No subtopics added</div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="add-subtopic-form">
        <div className="input-with-suggestions">
          <input
            type="text"
            value={newSubtopic}
            onChange={(e) => setNewSubtopic(e.target.value)}
            placeholder="Add a subtopic..."
            className="subtopic-input"
          />
          
          {newSubtopic && availableSubtopics.length > 0 && (
            <div className="suggestions">
              {availableSubtopics
                .filter(s => s.toLowerCase().includes(newSubtopic.toLowerCase()) && !subtopics.includes(s))
                .slice(0, 5)
                .map(suggestion => (
                  <div 
                    key={suggestion} 
                    className="suggestion-item"
                    onClick={() => handleAddSubtopic(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
            </div>
          )}
        </div>
        
        <button type="submit" className="add-subtopic-button">Add</button>
      </form>
      
      {availableSubtopics.length > 0 && (
        <div className="available-subtopics">
          <h5>Available Subtopics</h5>
          <div className="subtopics-grid">
            {availableSubtopics
              .filter(s => !subtopics.includes(s))
              .map(subtopic => (
                <div 
                  key={subtopic} 
                  className="available-subtopic"
                  onClick={() => handleAddSubtopic(subtopic)}
                >
                  {subtopic}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtopicManager; 