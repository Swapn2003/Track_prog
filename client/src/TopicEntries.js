import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, post, put } from '../utils/api';
import SubtopicFilter from './SubtopicFilter';
import SubtopicManager from './SubtopicManager';
import './TopicEntries.css';

const TopicEntries = () => {
  const { topic } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [availableSubtopics, setAvailableSubtopics] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [editingSubtopics, setEditingSubtopics] = useState(null);

  // Memoize fetchEntries to prevent recreation on each render
  const fetchEntries = useCallback(async () => {
    // Create an abort controller for cleanup
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      setLoading(true);
      
      let endpoint = `/api/entries/topic/${topic}`;
      if (selectedSubtopic) {
        endpoint = `/api/entries/topic/${topic}/subtopic/${selectedSubtopic}`;
      }
      
      const response = await get(endpoint, { signal });
      
      // Handle response data safely
      if (response && Array.isArray(response)) {
        setEntries(response);
      } else if (response && Array.isArray(response.data)) {
        setEntries(response.data);
      } else {
        setEntries([]);
      }
      
      setError(null);
    } catch (err) {
      if (!signal.aborted) {
        console.error('Error fetching entries:', err);
        setError('Failed to load entries. Please try again.');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
    
    return () => controller.abort();
  }, [topic, selectedSubtopic]);

  // Memoize fetchSubtopics to prevent recreation on each render
  const fetchSubtopics = useCallback(async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    try {
      const response = await get(`/api/topics/${topic}/subtopics`, { signal });
      
      if (response && Array.isArray(response)) {
        setAvailableSubtopics(response);
      } else if (response && Array.isArray(response.data)) {
        setAvailableSubtopics(response.data);
      } else {
        setAvailableSubtopics([]);
      }
    } catch (err) {
      if (!signal.aborted) {
        console.error('Error fetching subtopics:', err);
      }
    }
    
    return () => controller.abort();
  }, [topic]);

  useEffect(() => {
    const abortFetchEntries = fetchEntries();
    const abortFetchSubtopics = fetchSubtopics();
    
    return () => {
      abortFetchEntries();
      abortFetchSubtopics();
    };
  }, [fetchEntries, fetchSubtopics]);

  const handleToggleExpand = useCallback((id) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleToggleStarred = useCallback(async (id, isCurrentlyStarred) => {
    try {
      await put(`/api/entries/${id}`, { isStarred: !isCurrentlyStarred });
      
      // Use functional update to avoid stale closures
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry._id === id ? { ...entry, isStarred: !isCurrentlyStarred } : entry
        )
      );
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  }, []);

  const handleToggleBasic = useCallback(async (id, isCurrentlyBasic) => {
    try {
      await put(`/api/entries/${id}`, { isBasic: !isCurrentlyBasic });
      
      // Use functional update to avoid stale closures
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry._id === id ? { ...entry, isBasic: !isCurrentlyBasic } : entry
        )
      );
    } catch (err) {
      console.error('Error toggling basic:', err);
    }
  }, []);

  const handleEditSubtopics = useCallback((entry) => {
    setEditingSubtopics(entry);
  }, []);

  const handleSaveSubtopics = useCallback(async (subtopics) => {
    if (!editingSubtopics) return;
    
    try {
      const response = await put(`/api/entries/${editingSubtopics._id}`, { 
        subtopics: subtopics 
      });
      
      if (response) {
        // Use functional update to avoid stale closures
        setEntries(prevEntries => 
          prevEntries.map(entry => 
            entry._id === editingSubtopics._id ? { ...entry, subtopics } : entry
          )
        );
      }
      
      setEditingSubtopics(null);
    } catch (err) {
      console.error('Error saving subtopics:', err);
    }
  }, [editingSubtopics]);

  const handleCancelEditSubtopics = useCallback(() => {
    setEditingSubtopics(null);
  }, []);

  // Filter entries based on tab and search term
  const filteredEntries = useMemo(() => {
    // First filter by tab
    let filtered = [...entries];
    
    if (activeTab === 'starred') {
      filtered = filtered.filter(entry => entry.isStarred);
    } else if (activeTab === 'basic') {
      filtered = filtered.filter(entry => entry.isBasic);
    }
    
    // Then filter by search term if present
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(entry => {
        return (
          entry.title.toLowerCase().includes(searchLower) ||
          (entry.description && entry.description.toLowerCase().includes(searchLower))
        );
      });
    }
    
    return filtered;
  }, [entries, activeTab, searchTerm]);

  // Rest of component remains the same
} 