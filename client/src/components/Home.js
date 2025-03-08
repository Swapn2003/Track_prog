import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { setInDSASection } = useAppContext();

  useEffect(() => {
    setInDSASection(false);
  }, [setInDSASection]);

  const handleTileClick = () => {
    setInDSASection(true);
    navigate('/topics');
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Progress Tracker</h1>
      <div className="tiles-container">
        <div className="tile" onClick={handleTileClick}>
          <div className="tile-content">
            <h2>DSA Prep</h2>
            <p>Track your Data Structures and Algorithms progress</p>
            <div className="tile-footer">
              <span className="tile-stats">Click to view topics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 