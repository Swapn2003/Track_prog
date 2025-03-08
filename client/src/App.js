import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Topics from './components/Topics';
import TopicEntries from './components/TopicEntries';
import AddEntry from './components/AddEntry';
import Login from './components/Login';
import Signup from './components/Signup';
import Settings from './components/Settings';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { AppProvider } from './context/AppContext';
import './App.css';

function App() {
  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/topics" element={
              <ProtectedRoute>
                <Topics />
              </ProtectedRoute>
            } />
            <Route path="/topic/:topic" element={
              <ProtectedRoute>
                <TopicEntries />
              </ProtectedRoute>
            } />
            <Route path="/add" element={
              <ProtectedRoute>
                <AddEntry />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App; 