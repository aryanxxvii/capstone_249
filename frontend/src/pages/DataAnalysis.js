import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import Alert from '@mui/material/Alert';

function DataAnalysis() {
  const [notebookHtml, setNotebookHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        const response = await fetch('http://localhost:5000/get-notebook');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setNotebookHtml(data.html);
        setError(null);
      } catch (error) {
        console.error('Error loading notebook:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotebook();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Analysis
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading notebook: {error}
        </Alert>
      )}

      {notebookHtml && (
        <Box 
          sx={{ 
            width: '100%',
            '& .notebook-content': {
              maxWidth: 'none !important',
              width: '100% !important'
            }
          }}
          dangerouslySetInnerHTML={{ __html: notebookHtml }} 
        />
      )}
    </Box>
  );
}

export default DataAnalysis; 