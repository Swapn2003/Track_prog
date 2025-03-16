import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { get } from '../utils/api';
import './SubtopicFilter.css';

const SubtopicFilter = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubtopics = async () => {
      try {
        setLoading(true);
        const data = await get(`/api/topics/${encodeURIComponent(topic)}/subtopics`);
        setSubtopics(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subtopics:', err);
        setError('Failed to load subtopics');
        setLoading(false);
      }
    };

    if (topic) {
      fetchSubtopics();
    }
  }, [topic]);

  const handleSubtopicClick = (subtopic) => {
    navigate(`/topic/${encodeURIComponent(topic)}/subtopic/${encodeURIComponent(subtopic)}`);
  };

  if (loading) return <div className="subtopic-filter-loading">Loading subtopics...</div>;
  if (error) return <div className="subtopic-filter-error">{error}</div>;
  if (subtopics.length === 0) return null;

  return (
    <div className="subtopic-filter-container">
      <h3>Subtopics</h3>
      <div className="subtopics-list">
        {subtopics.map(subtopic => (
          <div 
            key={subtopic} 
            className="subtopic-item"
            onClick={() => handleSubtopicClick(subtopic)}
          >
            {subtopic}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubtopicFilter; 