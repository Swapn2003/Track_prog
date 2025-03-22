import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { inDSASection } = useAppContext();
  const isAuthenticated = localStorage.getItem('token') !== null;
  const user = JSON.parse(localStorage.getItem('user'));
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  
  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-brand">
        <Link to="/">Progress Tracker</Link>
      </div>
      
      {isAuthenticated && (
        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
      )}
      
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {isAuthenticated ? (
          <>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            {inDSASection && (
              <>
                <Link to="/topics" className={`nav-link ${isActive('/topics') ? 'active' : ''}`}>Topics</Link>
                <Link to="/all-problems" className={`nav-link ${isActive('/all-problems') ? 'active' : ''}`}>All Problems</Link>
                <Link to="/add" className={`nav-link ${isActive('/add') ? 'active' : ''}`}>Add Problem</Link>
              </>
            )}
            <div className="nav-section">
              <Link to="/companies" className={`nav-link ${isActive('/companies-new') ? 'active' : ''}`}>Companies</Link>
            </div>
            <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>Settings</Link>
            <span className="nav-user">{user?.email || user?.username}</span>
            <button onClick={handleLogout} className="nav-button">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>Login</Link>
            <Link to="/signup" className={`nav-link ${isActive('/signup') ? 'active' : ''}`}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 