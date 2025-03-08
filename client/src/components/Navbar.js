import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { inDSASection } = useAppContext();
  const isAuthenticated = localStorage.getItem('token') !== null;
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">Progress Tracker</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/" className="nav-link">Home</Link>
            {inDSASection && (
              <>
                <Link to="/topics" className="nav-link">Topics</Link>
                <Link to="/add" className="nav-link">Add Problem</Link>
              </>
            )}
            <Link to="/settings" className="nav-link">Settings</Link>
            <span className="nav-user">{user?.email || user?.username}</span>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 