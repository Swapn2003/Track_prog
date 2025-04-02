import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { get, post, put, del } from '../utils/api';
import './Companies.css';
import { useNavigate } from 'react-router-dom';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyQuestions, setCompanyQuestions] = useState({});
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionDescription, setQuestionDescription] = useState('');
  const [questionLoading, setQuestionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCompany, setEditingCompany] = useState(null);
  const [newTargetCompany, setNewTargetCompany] = useState({
    name: '',
    status: 'Planning',
    priority: 'Medium',
    notes: '',
    targetDate: '',
    questions: []
  });
  const navigate = useNavigate();

  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch LeetCode data
        const response = await axios.get(
          'https://raw.githubusercontent.com/ssavi-ict/LeetCode-Which-Company/main/data/company_info.json'
        );
        
        const data = response.data;
        const processedCompanies = {};
        const uniqueCompanies = new Set();
        
        Object.entries(data).forEach(([url, details]) => {
          const [questionName, companyName] = details;
          uniqueCompanies.add(companyName);
          
          if (!processedCompanies[companyName]) {
            processedCompanies[companyName] = [];
          }
          
          processedCompanies[companyName].push({
            name: questionName,
            url: url
          });
        });
        
        const companyList = Array.from(uniqueCompanies).map((name, index) => ({
          id: index + 1,
          name: name,
          description: `${name} is a company with ${processedCompanies[name].length} LeetCode questions.`,
          location: 'Various Locations',
          industry: 'Technology',
        }));
        
        setCompanies(companyList);
        setCompanyQuestions(processedCompanies);

        // Fetch target companies
        console.log('Fetching target companies...');
        try {
          const targetResponse = await get('/api/target-companies');
          console.log('Target companies response:', targetResponse);
          
          // The response might be the data array directly or in a data property
          if (Array.isArray(targetResponse)) {
            console.log('Target companies loaded (direct array):', targetResponse.length);
            setTargetCompanies(targetResponse);
          } else if (targetResponse && Array.isArray(targetResponse.data)) {
            console.log('Target companies loaded (in data property):', targetResponse.data.length);
            setTargetCompanies(targetResponse.data);
          } else {
            console.log('No valid target companies data in response:', targetResponse);
            setTargetCompanies([]);
          }
        } catch (targetErr) {
          console.error('Error fetching target companies:', targetErr);
          setTargetCompanies([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setSelectedQuestion(null);
    setQuestionDescription('');
  };

  const handleTargetCompanyClick = (company) => {
    navigate(`/target-company/${company._id}`);
  };

  const handleQuestionClick = async (question) => {
    setSelectedQuestion(question);
    setQuestionLoading(true);
    
    try {
      setQuestionDescription(`This would fetch the description from: ${question.url}
      
In a production environment, you would need:
1. A server-side proxy to fetch the content from LeetCode
2. HTML parsing to extract the question description
3. Proper error handling for cases where the question is premium/locked

For now, this is a placeholder. The actual implementation would require a backend service to fetch and parse the LeetCode question content.`);
    } catch (err) {
      setQuestionDescription('Failed to load question description');
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleAddTargetCompany = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting new target company:', newTargetCompany);
      const response = await post('/api/target-companies', newTargetCompany);
      console.log('Server response:', response);
      
      // Check if we have a response object
      if (response) {
        // Get the company data from the response
        const newCompany = response;
        
        // Ensure the company has the required fields
        if (newCompany && newCompany.name) {
          // Make sure questions is an array
          if (!newCompany.questions) {
            newCompany.questions = [];
          }
          
          // Add to state
          setTargetCompanies(prevCompanies => [...prevCompanies, newCompany]);
          setShowAddForm(false);
          setError(''); // Clear any existing errors
          
          // Reset form
          setNewTargetCompany({
            name: '',
            status: 'Planning',
            priority: 'Medium',
            notes: '',
            targetDate: '',
            questions: []
          });
          
          // Force refresh the component
          forceRefresh();
          
          // Force refresh the target companies tab
          setActiveTab('target');
        } else {
          throw new Error('Incomplete company data received from server');
        }
      } else {
        throw new Error('No response received from server');
      }
    } catch (err) {
      console.error('Error adding target company:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add target company. Please try again.');
    }
  };

  const handleUpdateTargetCompany = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating target company:', editingCompany);
      const response = await put(`/api/target-companies/${editingCompany._id}`, editingCompany);
      console.log('Server response:', response);
      
      if (response) {
        // Update the company in the state
        setTargetCompanies(prevCompanies => 
          prevCompanies.map(company => 
            company._id === editingCompany._id ? response : company
          )
        );
        
        // Reset form and editing state
        setEditingCompany(null);
        setError('');
        
        // Force refresh
        forceRefresh();
      } else {
        throw new Error('No response received from server');
      }
    } catch (err) {
      console.error('Error updating target company:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update target company. Please try again.');
    }
  };

  const handleDeleteTargetCompany = async (id) => {
    try {
      await del(`/api/target-companies/${id}`);
      setTargetCompanies(targetCompanies.filter(company => company._id !== id));
    } catch (err) {
      console.error('Error deleting target company:', err);
      setError('Failed to delete target company');
    }
  };

  const handleStartEdit = (company) => {
    // Create a copy of the company for editing
    setEditingCompany({
      ...company,
      // Format the date for the input field (YYYY-MM-DD)
      targetDate: company.targetDate ? new Date(company.targetDate).toISOString().split('T')[0] : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
  };

  const filteredCompanies = companies.filter(company =>
    company && company.name && company.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="loading-container">
      <div>
        <div className="loading-spinner">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
            <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" />
            <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#007bff" strokeWidth="4" />
          </svg>
        </div>
        <div>Loading data...</div>
      </div>
    </div>
  );
  
  if (error) return <div className="error-message">{error}</div>;

  // Ensure arrays are initialized
  const safeCompanies = companies || [];
  const safeTargetCompanies = targetCompanies || [];
  const safeCompanyQuestions = companyQuestions || {};

  return (
    <div className="companies-container">
      <h1 className="page-title">LeetCode Questions by Company</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Companies
        </button>
        <button 
          className={`tab ${activeTab === 'target' ? 'active' : ''}`}
          onClick={() => setActiveTab('target')}
        >
          Target Companies
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="content-grid">
          <div className="companies-sidebar">
            <div className="sidebar-top">
              <h2 className="sidebar-header">
                Companies
                <span className="company-count">({filteredCompanies?.length || 0})</span>
              </h2>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="companies-list">
              {filteredCompanies?.map((company) => (
                <div
                  key={company?.id}
                  className={`company-card ${selectedCompany && selectedCompany.id === company?.id ? 'selected' : ''}`}
                  onClick={() => handleCompanyClick(company)}
                >
                  <h3 className={`company-name ${selectedCompany && selectedCompany.id === company?.id ? 'selected' : ''}`}>
                    {company?.name}
                  </h3>
                  <p className="company-description">{company?.description}</p>
                  <div className="company-meta">
                    <span>{company?.industry}</span>
                    <span>{company?.location}</span>
                  </div>
                </div>
              ))}
              {(filteredCompanies?.length || 0) === 0 && (
                <div className="no-results">
                  No companies found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
          
          <div className="content-area">
            {selectedCompany ? (
              <div>
                <div className="company-header">
                  <h2 className="company-title">{selectedCompany.name}</h2>
                  <div className="questions-count">
                    {safeCompanyQuestions[selectedCompany.name]?.length || 0} Questions
                  </div>
                </div>
                
                <div className="questions-grid">
                  <div className="questions-list">
                    <h3 className="questions-list-title">LeetCode Questions</h3>
                    {safeCompanyQuestions[selectedCompany.name]?.length > 0 ? (
                      <div>
                        {safeCompanyQuestions[selectedCompany.name]?.map((question, index) => (
                          <div
                            key={index}
                            className={`question-item ${selectedQuestion && selectedQuestion.name === question?.name ? 'selected' : ''}`}
                            onClick={() => handleQuestionClick(question)}
                          >
                            <div className={`question-name ${selectedQuestion && selectedQuestion.name === question?.name ? 'selected' : ''}`}>
                              {question?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-questions">
                        No questions available for this company
                      </div>
                    )}
                  </div>
                  
                  <div className="question-description">
                    {selectedQuestion ? (
                      <div>
                        <div className="question-header">
                          <h3 className="question-title">{selectedQuestion.name}</h3>
                          <a
                            href={selectedQuestion.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="leetcode-link"
                          >
                            View on LeetCode
                          </a>
                        </div>
                        
                        {questionLoading ? (
                          <div className="loading-container">
                            <div>
                              <div className="loading-spinner">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
                                  <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" />
                                  <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#2196f3" strokeWidth="4" />
                                </svg>
                              </div>
                              <div>Loading question description...</div>
                            </div>
                          </div>
                        ) : (
                          <div className="question-content">
                            {questionDescription}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <h3 className="empty-state-title">No Question Selected</h3>
                        <p className="empty-state-message">
                          Select a question from the list to view its details
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h2 className="empty-state-title">Select a Company</h2>
                <p className="empty-state-message">
                  Choose a company from the list to view their LeetCode questions
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="target-companies">
          <div className="target-companies-header">
            <h2>Target Companies</h2>
            <button 
              className="add-company-button"
              onClick={() => setShowAddForm(true)}
            >
              Add Company
            </button>
          </div>

          {showAddForm && (
            <div className="add-target-form">
              <h3>Add Target Company</h3>
              <form onSubmit={handleAddTargetCompany}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={newTargetCompany.name}
                    onChange={(e) => setNewTargetCompany({
                      ...newTargetCompany,
                      name: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newTargetCompany.status}
                    onChange={(e) => setNewTargetCompany({
                      ...newTargetCompany,
                      status: e.target.value
                    })}
                  >
                    <option value="Planning">Planning</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTargetCompany.priority}
                    onChange={(e) => setNewTargetCompany({
                      ...newTargetCompany,
                      priority: e.target.value
                    })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    value={newTargetCompany.targetDate}
                    onChange={(e) => setNewTargetCompany({
                      ...newTargetCompany,
                      targetDate: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={newTargetCompany.notes}
                    onChange={(e) => setNewTargetCompany({
                      ...newTargetCompany,
                      notes: e.target.value
                    })}
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">Add Company</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {editingCompany && (
            <div className="add-target-form edit-form">
              <h3>Edit Target Company</h3>
              <form onSubmit={handleUpdateTargetCompany}>
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={editingCompany.name}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      name: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editingCompany.status}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      status: e.target.value
                    })}
                  >
                    <option value="Planning">Planning</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={editingCompany.priority}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      priority: e.target.value
                    })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    value={editingCompany.targetDate}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      targetDate: e.target.value
                    })}
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={editingCompany.notes}
                    onChange={(e) => setEditingCompany({
                      ...editingCompany,
                      notes: e.target.value
                    })}
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="submit-button">Update Company</button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="target-companies-grid">
            {loading ? (
              <div className="loading-container">
                <div>
                  <div className="loading-spinner">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="spinner">
                      <circle cx="12" cy="12" r="10" stroke="#e0e0e0" strokeWidth="4" />
                      <path d="M12 2C6.48 2 2 6.48 2 12" stroke="#007bff" strokeWidth="4" />
                    </svg>
                  </div>
                  <div>Loading target companies...</div>
                </div>
              </div>
            ) : !safeTargetCompanies || safeTargetCompanies.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h2 className="empty-state-title">No Target Companies</h2>
                <p className="empty-state-message">
                  Add your first target company to start tracking your preparation
                </p>
              </div>
            ) : (
              safeTargetCompanies.map((company) => (
                <div key={company?._id || `temp-${Date.now()}-${Math.random()}`} className="target-company-card">
                  <div 
                    className="target-company-header"
                    onClick={() => handleTargetCompanyClick(company)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h3>{company?.name}</h3>
                    <div className="target-company-badges">
                      <span className={`status-badge ${company?.status?.toLowerCase() || 'planning'}`}>
                        {company?.status || 'Planning'}
                      </span>
                      <span className={`priority-badge ${company?.priority?.toLowerCase() || 'medium'}`}>
                        {company?.priority || 'Medium'}
                      </span>
                    </div>
                  </div>
                  <p className="target-company-notes">{company?.notes || ''}</p>
                  {company?.targetDate && (
                    <p className="target-date">
                      Target: {new Date(company.targetDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="target-company-questions">
                    <h4>Questions ({company?.questions?.length || 0})</h4>
                    <div className="questions-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${((company?.questions?.filter(q => q?.status === 'Completed')?.length || 0) / 
                              (company?.questions?.length || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="target-company-actions">
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTargetCompany(company?._id);
                    }}>
                      Delete
                    </button>
                    <button onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(company);
                    }}>
                      Edit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;