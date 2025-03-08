import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
} from '@mui/material';

function EntryList() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchEntries();
      } else {
        const error = await response.json();
        console.error('Error deleting entry:', error.message);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DSA Progress Entries
      </Typography>
      <Grid container spacing={3}>
        {entries.map((entry) => (
          <Grid item xs={12} key={entry._id}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {entry.topic}
                </Typography>
                <Typography variant="body1" paragraph>
                  {entry.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Button
                    href={entry.problemLink}
                    target="_blank"
                    variant="outlined"
                    color="primary"
                    sx={{ mr: 1 }}
                  >
                    View Problem
                  </Button>
                </Box>
                <Typography variant="h6" gutterBottom>
                  Approach:
                </Typography>
                <Typography variant="body1" paragraph>
                  {entry.approach}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Code:
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {entry.code}
                </Paper>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Chip
                    label={`Time: ${entry.timeComplexity}`}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`Space: ${entry.spaceComplexity}`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(entry._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default EntryList; 