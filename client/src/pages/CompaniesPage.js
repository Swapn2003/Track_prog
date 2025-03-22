import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Tab, Nav, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaStar, FaPlus, FaTrash, FaRegStar } from 'react-icons/fa';
import './CompaniesPage.css';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [targetCompanies, setTargetCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Use useCallback to memoize the fetchData function
  const fetchData = useCallback(async () => {
    // Create a cancel token source
    const source = axios.CancelToken.source();

    try {
      setLoading(true);
      const [companiesRes, targetCompaniesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/companies', { cancelToken: source.token }),
        axios.get('http://localhost:5000/api/targetCompanies', { cancelToken: source.token })
      ]);
      
      // Only update state if we have valid data
      if (companiesRes.data && Array.isArray(companiesRes.data)) {
        setCompanies(companiesRes.data);
      }
      
      if (targetCompaniesRes.data && Array.isArray(targetCompaniesRes.data)) {
        setTargetCompanies(targetCompaniesRes.data);
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError('Failed to fetch data');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }

    // Return the cancel function
    return () => {
      source.cancel('Component unmounted');
    };
  }, []);

  useEffect(() => {
    const cancelFetch = fetchData();
    
    // Cleanup function to cancel any pending requests when component unmounts
    return () => {
      if (cancelFetch) cancelFetch();
    };
  }, [fetchData]);

  const handleAddTargetCompany = async () => {
    if (!newCompany.trim()) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/targetCompanies', { name: newCompany });
      if (response.data) {
        // Use functional update to avoid stale closures
        setTargetCompanies(prev => [...prev, response.data]);
        setNewCompany('');
      }
    } catch (err) {
      setError('Failed to add company');
      console.error(err);
    }
  };

  const handleRemoveTargetCompany = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/targetCompanies/${id}`);
      // Use functional update to avoid stale closures
      setTargetCompanies(prev => prev.filter(company => company._id !== id));
    } catch (err) {
      setError('Failed to remove company');
      console.error(err);
    }
  };

  // Memoize filtering operations to reduce re-calculations
  const filteredCompanies = useCallback(() => {
    return companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const filteredTargetCompanies = useCallback(() => {
    return targetCompanies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [targetCompanies, searchTerm]);

  // Get the filtered values
  const computedFilteredCompanies = filteredCompanies();
  const computedFilteredTargetCompanies = filteredTargetCompanies();

  if (loading) return <div className="text-center mt-5">Loading companies data...</div>;
  if (error) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <Container className="py-4">
      <div className="page-header mb-4">
        <h1 className="companies-title">Companies</h1>
        <p className="text-muted">Track your target companies and prepare for their interviews</p>
      </div>

      <InputGroup className="mb-4 search-box">
        <InputGroup.Text>
          <FaSearch />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      <Tab.Container id="companies-tabs" defaultActiveKey="target">
        <Row>
          <Col sm={12}>
            <Nav className="company-tabs mb-4">
              <Nav.Item>
                <Nav.Link eventKey="target">Target Companies</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="all">All Companies</Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col sm={12}>
            <Tab.Content>
              <Tab.Pane eventKey="target">
                <div className="mb-4">
                  <h4>Add Target Company</h4>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Enter company name"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                    />
                    <Button variant="primary" onClick={handleAddTargetCompany}>
                      <FaPlus /> Add
                    </Button>
                  </InputGroup>
                </div>

                {computedFilteredTargetCompanies.length === 0 ? (
                  <div className="text-center py-5 empty-state">
                    <FaStar size={40} className="mb-3 text-muted" />
                    <h5>No target companies yet</h5>
                    <p className="text-muted">Add companies you're targeting for interviews</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {computedFilteredTargetCompanies.map((company) => (
                      <Col key={company._id}>
                        <Card className="company-card target-company">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center">
                              <h5 className="company-name">{company.name}</h5>
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleRemoveTargetCompany(company._id)}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Tab.Pane>
              <Tab.Pane eventKey="all">
                {computedFilteredCompanies.length === 0 ? (
                  <div className="text-center py-5 empty-state">
                    <FaRegStar size={40} className="mb-3 text-muted" />
                    <h5>No companies found</h5>
                    <p className="text-muted">Try a different search term</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {computedFilteredCompanies.map((company) => (
                      <Col key={company._id}>
                        <Card className="company-card">
                          <Card.Body>
                            <h5 className="company-name">{company.name}</h5>
                            <div className="company-details">
                              <span className="badge bg-info">{company.problems?.length || 0} Problems</span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default CompaniesPage; 