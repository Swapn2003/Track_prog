import React, { useState, useEffect } from 'react';
import { get, post, put, del } from '../utils/api';
import './ReferenceMaterials.css';

const ReferenceMaterials = ({ topic }) => {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: ''
  });
  
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/reference/${topic}`);
        setReferences(response);
      } catch (err) {
        console.error('Error fetching reference materials:', err);
        setError('Failed to load reference materials');
      } finally {
        setLoading(false);
      }
    };
    
    if (topic) {
      fetchReferences();
    }
  }, [topic]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newReference = {
        ...formData,
        topic
      };
      
      const response = await post('/api/reference', newReference);
      setReferences([response, ...references]);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error('Error adding reference material:', err);
      setError('Failed to add reference material');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await put(`/api/reference/${editingId}`, formData);
      
      setReferences(references.map(ref => 
        ref._id === editingId ? response : ref
      ));
      
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error('Error updating reference material:', err);
      setError('Failed to update reference material');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reference material?')) {
      return;
    }
    
    try {
      setLoading(true);
      await del(`/api/reference/${id}`);
      setReferences(references.filter(ref => ref._id !== id));
    } catch (err) {
      console.error('Error deleting reference material:', err);
      setError('Failed to delete reference material');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (reference) => {
    setFormData({
      title: reference.title,
      content: reference.content,
      url: reference.url || ''
    });
    setEditingId(reference._id);
    setShowAddForm(true);
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      url: ''
    });
  };
  
  const handleCancel = () => {
    resetForm();
    setEditingId(null);
    setShowAddForm(false);
  };
  
  if (loading && references.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
            <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" />
            <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#007bff" strokeWidth="4" />
          </svg>
        </div>
        <div>Loading reference materials...</div>
      </div>
    );
  }
  
  return (
    <div className="reference-materials">
      <div className="reference-header">
        <h2>Reference Materials</h2>
        <button 
          className="add-reference-btn"
          onClick={() => {
            resetForm();
            setEditingId(null);
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Reference'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showAddForm && (
        <div className="reference-form-container">
          <form 
            className="reference-form" 
            onSubmit={editingId ? handleEditSubmit : handleAddSubmit}
          >
            <h3>{editingId ? 'Edit Reference Material' : 'Add Reference Material'}</h3>
            
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Title of the reference material"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Add notes, code snippets, explanations, etc."
                rows={10}
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="url">URL (Optional)</label>
              <input
                type="text"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="Link to the resource"
              />
            </div>
            
            <div className="form-buttons">
              <button type="button" className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {references.length === 0 && !loading ? (
        <div className="no-references">
          <div className="empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h3>No reference materials yet</h3>
          <p>Start adding your notes, code snippets, and reference materials for {topic}</p>
        </div>
      ) : (
        <div className="references-list">
          {references.map(reference => (
            <div key={reference._id} className="reference-card">
              <div className="reference-top">
                <h3>{reference.title}</h3>
                <div className="reference-actions">
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(reference)}
                    aria-label="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(reference._id)}
                    aria-label="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="reference-date">
                Added {new Date(reference.createdAt).toLocaleDateString()}
                {reference.createdAt !== reference.updatedAt && 
                  ` • Updated ${new Date(reference.updatedAt).toLocaleDateString()}`
                }
              </div>
              
              <div className="reference-content">
                <pre>{reference.content}</pre>
              </div>
              
              {reference.url && (
                <a 
                  href={reference.url.startsWith('http') ? reference.url : `https://${reference.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="reference-link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Visit Resource
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferenceMaterials; 