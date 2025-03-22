import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './HomePage.css';

// Lazy loading images and limiting DOM size
const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const observerRef = useRef(null);
  const imageRefs = useRef([]);

  // Function to initialize Intersection Observer for lazy loading
  const setupObserver = useCallback(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc) {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            observerRef.current.unobserve(img);
          }
        }
      });
    }, { rootMargin: '200px 0px' });

    // Observe all images with data-src
    imageRefs.current.forEach(img => {
      if (img) observerRef.current.observe(img);
    });
  }, []);

  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Setup lazy loading after content is loaded
      setTimeout(() => {
        setupObserver();
      }, 0);
    }, 500);

    return () => {
      clearTimeout(timer);
      // Clean up observer when component unmounts
      if (observerRef.current) {
        imageRefs.current.forEach(img => {
          if (img) observerRef.current.unobserve(img);
        });
      }
    };
  }, [setupObserver]);

  const addToImageRefs = useCallback((el) => {
    if (el && !imageRefs.current.includes(el)) {
      imageRefs.current.push(el);
    }
  }, []);

  // Use windowing/virtualization for large lists (simplified example)
  const features = [
    { title: 'DSA Problems', description: 'Track and organize your DSA practice', icon: '📝', path: '/topics' },
    { title: 'Company Questions', description: 'Company-specific interview questions', icon: '🏢', path: '/companies-new' },
    { title: 'Problem Tracking', description: 'Keep track of your solved problems', icon: '✅', path: '/topics' },
    { title: 'Notes & Solutions', description: 'Save your notes and solutions', icon: '📘', path: '/topics' }
  ];

  if (loading) {
    return (
      <Container className="home-container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="home-container py-5">
      <Row className="mb-5">
        <Col md={12} className="text-center">
          <h1 className="display-4 mb-4">Track Your Programming Journey</h1>
          <p className="lead">
            Organize your DSA practice, track company questions, and improve your interview preparation
          </p>
        </Col>
      </Row>

      <Row className="features-section">
        {features.map((feature, index) => (
          <Col md={6} lg={3} key={index} className="mb-4">
            <Link to={feature.path} className="text-decoration-none">
              <Card className="feature-card h-100">
                <Card.Body className="text-center">
                  <div className="feature-icon mb-3">{feature.icon}</div>
                  <Card.Title>{feature.title}</Card.Title>
                  <Card.Text>{feature.description}</Card.Text>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Row className="mt-5">
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              <Card.Text>
                Your recent activity will appear here as you use the application.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Quick Stats</Card.Title>
              <Card.Text>
                Your solved problems stats and progress will appear here.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={12}>
          <img 
            ref={addToImageRefs}
            className="img-fluid rounded" 
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 300'%3E%3Crect width='1200' height='300' fill='%23f8f9fa'/%3E%3C/svg%3E"
            data-src="https://via.placeholder.com/1200x300?text=Track+Your+Programming+Journey" 
            alt="Programming Journey" 
          />
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage; 