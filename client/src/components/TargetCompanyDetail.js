import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, put, post } from '../utils/api';
import './TargetCompanyDetail.css';

const TargetCompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notes');
  
  // Form states
  const [notes, setNotes] = useState('');
  const [tips, setTips] = useState('');
  const [newQuestion, setNewQuestion] = useState({ name: '', url: '', status: 'Not Started', notes: '' });
  const [newExperience, setNewExperience] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    round: '', 
    notes: '', 
    outcome: 'Waiting' 
  });
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await get(`/api/target-companies/${id}`);
        setCompany(response);
        setNotes(response.notes || '');
        setTips(response.tips || '');
      } catch (err) {
        console.error('Error fetching company details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load company details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompany();
  }, [id]);

  const handleSaveNotes = async () => {
    try {
      setIsEditing(true);
      const response = await put(`/api/target-companies/${id}`, { notes });
      setCompany(response);
      setEditMessage('Notes saved successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save notes');
    } finally {
      setIsEditing(false);
    }
  };

  const handleSaveTips = async () => {
    try {
      setIsEditing(true);
      const response = await put(`/api/target-companies/${id}`, { tips });
      setCompany(response);
      setEditMessage('Tips saved successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error saving tips:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save tips');
    } finally {
      setIsEditing(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      setIsEditing(true);
      const response = await post(`/api/target-companies/${id}/questions`, newQuestion);
      setCompany(response);
      setNewQuestion({ name: '', url: '', status: 'Not Started', notes: '' });
      setEditMessage('Question added successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding question:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add question');
    } finally {
      setIsEditing(false);
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      setIsEditing(true);
      
      // Create a copy of the current experiences array or initialize if it doesn't exist
      const experiences = company.interviewExperiences ? [...company.interviewExperiences] : [];
      experiences.push(newExperience);
      
      const response = await put(`/api/target-companies/${id}`, { interviewExperiences: experiences });
      setCompany(response);
      setNewExperience({ 
        date: new Date().toISOString().split('T')[0], 
        round: '', 
        notes: '', 
        outcome: 'Waiting' 
      });
      setEditMessage('Interview experience added successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error adding interview experience:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add interview experience');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteQuestion = async (index) => {
    try {
      if (!window.confirm('Are you sure you want to delete this question?')) return;
      
      setIsEditing(true);
      
      // Create a copy of the questions array and remove the question
      const questions = [...company.questions];
      questions.splice(index, 1);
      
      const response = await put(`/api/target-companies/${id}`, { questions });
      setCompany(response);
      setEditMessage('Question deleted successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete question');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteExperience = async (index) => {
    try {
      if (!window.confirm('Are you sure you want to delete this interview experience?')) return;
      
      setIsEditing(true);
      
      // Create a copy of the experiences array and remove the experience
      const experiences = [...company.interviewExperiences];
      experiences.splice(index, 1);
      
      const response = await put(`/api/target-companies/${id}`, { interviewExperiences: experiences });
      setCompany(response);
      setEditMessage('Interview experience deleted successfully!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting interview experience:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete interview experience');
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleUpdateQuestionStatus = async (index, newStatus) => {
    try {
      setIsEditing(true);
      
      // Create a copy of the questions array and update the status
      const questions = [...company.questions];
      questions[index].status = newStatus;
      
      const response = await put(`/api/target-companies/${id}`, { questions });
      setCompany(response);
      setEditMessage('Question status updated!');
      
      setTimeout(() => {
        setEditMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error updating question status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update question status');
    } finally {
      setIsEditing(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
          <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" />
          <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#007bff" strokeWidth="4" />
        </svg>
      </div>
      <div>Loading company details...</div>
    </div>
  );
  
  if (error) return <div className="error-message">{error}</div>;
  
  if (!company) return <div className="not-found">Company not found</div>;

  return (
    <div className="target-company-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/companies')}>
          ← Back to Companies
        </button>
        <h1>{company.name}</h1>
        <div className="company-status">
          <span className={`status-badge ${company.status.toLowerCase()}`}>
            {company.status}
          </span>
          <span className={`priority-badge ${company.priority.toLowerCase()}`}>
            {company.priority}
          </span>
          {company.targetDate && (
            <span className="target-date">
              Target: {new Date(company.targetDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      {editMessage && <div className="success-message">{editMessage}</div>}
      
      <div className="company-tabs">
        <button 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </button>
        <button 
          className={`tab ${activeTab === 'tips' ? 'active' : ''}`}
          onClick={() => setActiveTab('tips')}
        >
          Tips
        </button>
        <button 
          className={`tab ${activeTab === 'questions' ? 'active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions ({company.questions?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'experiences' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiences')}
        >
          Interview Experiences ({company.interviewExperiences?.length || 0})
        </button>
      </div>
      
      <div className="tab-content">
        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="notes-tab">
            <h2>Notes</h2>
            <p className="tab-description">Add general notes about the company, interview process, requirements, etc.</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes about this company here..."
              rows={10}
              className="notes-textarea"
            />
            <button 
              className="save-button" 
              onClick={handleSaveNotes}
              disabled={isEditing}
            >
              {isEditing ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        )}
        
        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="tips-tab">
            <h2>Tips</h2>
            <p className="tab-description">Add tips for interviewing with this company, common questions, or preparation advice.</p>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder="Add tips for interviewing with this company..."
              rows={10}
              className="tips-textarea"
            />
            <button 
              className="save-button" 
              onClick={handleSaveTips}
              disabled={isEditing}
            >
              {isEditing ? 'Saving...' : 'Save Tips'}
            </button>
          </div>
        )}
        
        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="questions-tab">
            <h2>Questions</h2>
            <p className="tab-description">Track questions related to this company's interview process.</p>
            
            <form onSubmit={handleAddQuestion} className="add-question-form">
              <h3>Add New Question</h3>
              <div className="form-group">
                <label>Question Name</label>
                <input
                  type="text"
                  value={newQuestion.name}
                  onChange={(e) => setNewQuestion({...newQuestion, name: e.target.value})}
                  placeholder="Enter question name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Question URL</label>
                <input
                  type="text"
                  value={newQuestion.url}
                  onChange={(e) => setNewQuestion({...newQuestion, url: e.target.value})}
                  placeholder="Enter question URL (optional)"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newQuestion.status}
                  onChange={(e) => setNewQuestion({...newQuestion, status: e.target.value})}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newQuestion.notes}
                  onChange={(e) => setNewQuestion({...newQuestion, notes: e.target.value})}
                  placeholder="Add notes about this question"
                  rows={3}
                />
              </div>
              <button 
                type="submit" 
                className="add-button"
                disabled={isEditing}
              >
                {isEditing ? 'Adding...' : 'Add Question'}
              </button>
            </form>
            
            <div className="questions-list">
              <h3>Company Questions</h3>
              {company.questions?.length > 0 ? (
                <div className="questions-grid">
                  {company.questions.map((question, index) => (
                    <div key={index} className="question-card">
                      <div className="question-header">
                        <h4>{question.name}</h4>
                        <span className={`status-badge ${question.status.replace(/\s+/g, '-').toLowerCase()}`}>
                          {question.status}
                        </span>
                      </div>
                      {question.url && (
                        <a href={question.url} target="_blank" rel="noopener noreferrer" className="question-link">
                          Open Problem
                        </a>
                      )}
                      {question.notes && (
                        <div className="question-notes">
                          <p>{question.notes}</p>
                        </div>
                      )}
                      <div className="question-actions">
                        <div className="status-buttons">
                          <button 
                            className={`status-button ${question.status === 'Not Started' ? 'active' : ''}`}
                            onClick={() => handleUpdateQuestionStatus(index, 'Not Started')}
                            disabled={isEditing}
                          >
                            Not Started
                          </button>
                          <button 
                            className={`status-button ${question.status === 'In Progress' ? 'active' : ''}`}
                            onClick={() => handleUpdateQuestionStatus(index, 'In Progress')}
                            disabled={isEditing}
                          >
                            In Progress
                          </button>
                          <button 
                            className={`status-button ${question.status === 'Completed' ? 'active' : ''}`}
                            onClick={() => handleUpdateQuestionStatus(index, 'Completed')}
                            disabled={isEditing}
                          >
                            Completed
                          </button>
                        </div>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteQuestion(index)}
                          disabled={isEditing}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-list">
                  <p>No questions added yet. Add your first question above.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Interview Experiences Tab */}
        {activeTab === 'experiences' && (
          <div className="experiences-tab">
            <h2>Interview Experiences</h2>
            <p className="tab-description">Track your interview experiences with this company.</p>
            
            <form onSubmit={handleAddExperience} className="add-experience-form">
              <h3>Add Interview Experience</h3>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newExperience.date}
                  onChange={(e) => setNewExperience({...newExperience, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Round</label>
                <input
                  type="text"
                  value={newExperience.round}
                  onChange={(e) => setNewExperience({...newExperience, round: e.target.value})}
                  placeholder="Technical Round 1, HR Interview, etc."
                  required
                />
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <select
                  value={newExperience.outcome}
                  onChange={(e) => setNewExperience({...newExperience, outcome: e.target.value})}
                >
                  <option value="Waiting">Waiting</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newExperience.notes}
                  onChange={(e) => setNewExperience({...newExperience, notes: e.target.value})}
                  placeholder="Add notes about your interview experience"
                  rows={5}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="add-button"
                disabled={isEditing}
              >
                {isEditing ? 'Adding...' : 'Add Experience'}
              </button>
            </form>
            
            <div className="experiences-list">
              <h3>Your Interview Experiences</h3>
              {company.interviewExperiences?.length > 0 ? (
                <div className="experiences-timeline">
                  {company.interviewExperiences.sort((a, b) => new Date(b.date) - new Date(a.date)).map((exp, index) => (
                    <div key={index} className="experience-card">
                      <div className="experience-header">
                        <div className="experience-meta">
                          <span className="experience-date">{new Date(exp.date).toLocaleDateString()}</span>
                          <span className="experience-round">{exp.round}</span>
                        </div>
                        <span className={`outcome-badge ${exp.outcome.toLowerCase()}`}>
                          {exp.outcome}
                        </span>
                      </div>
                      <div className="experience-notes">
                        <p>{exp.notes}</p>
                      </div>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteExperience(index)}
                        disabled={isEditing}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-list">
                  <p>No interview experiences added yet. Add your first experience above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TargetCompanyDetail; 