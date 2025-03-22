import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companiesRes, targetCompaniesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/companies'),
          axios.get('http://localhost:5000/api/targetCompanies')
        ]);
        setCompanies(companiesRes.data);
        setTargetCompanies(targetCompaniesRes.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTargetCompany = async () => {
    if (!newCompany.trim()) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/targetCompanies', { name: newCompany });
      setTargetCompanies([...targetCompanies, response.data]);
      setNewCompany('');
    } catch (err) {
      setError('Failed to add company');
      console.error(err);
    }
  };

  const handleRemoveTargetCompany = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/targetCompanies/${id}`);
      setTargetCompanies(targetCompanies.filter(company => company._id !== id));
    } catch (err) {
      setError('Failed to remove company');
      console.error(err);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTargetCompanies = targetCompanies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

                {filteredTargetCompanies.length === 0 ? (
                  <div className="text-center py-5 empty-state">
                    <FaStar size={40} className="mb-3 text-muted" />
                    <h5>No target companies yet</h5>
                    <p className="text-muted">Add companies you're targeting for interviews</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {filteredTargetCompanies.map((company) => (
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
                {filteredCompanies.length === 0 ? (
                  <div className="text-center py-5 empty-state">
                    <FaRegStar size={40} className="mb-3 text-muted" />
                    <h5>No companies found</h5>
                    <p className="text-muted">Try a different search term</p>
                  </div>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-4">
                    {filteredCompanies.map((company) => (
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