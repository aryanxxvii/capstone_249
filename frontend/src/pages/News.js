import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  Link,
  Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('http://localhost:5000/get_news');
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data.articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: '#fff3f3' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)', 
      backgroundColor: 'background.default',
      py: 4 
    }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom>
          Latest Earthquake News
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Stay informed about recent seismic activities and related news
        </Typography>

        <Grid container spacing={3}>
          {news.map((article, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card 
                elevation={0}
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                {article.urlToImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.urlToImage}
                    alt={article.title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      size="small" 
                      label={article.source.name}
                      sx={{ mr: 1, bgcolor: 'primary.main', color: 'white' }}
                    />
                    <Chip
                      size="small"
                      icon={<AccessTimeIcon sx={{ fontSize: '0.875rem !important' }} />}
                      label={new Date(article.publishedAt).toLocaleDateString()}
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {article.description}
                  </Typography>
                  <Link 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Read more →
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default News; 