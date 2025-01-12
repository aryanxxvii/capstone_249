import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function Navbar() {
  const location = useLocation();

  return (
    <AppBar 
      position="static" 
      color="default" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/"
          sx={{ 
            textDecoration: 'none', 
            color: 'text.primary',
            fontWeight: 700,
          }}
        >
          Earthquake ML
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[
            { path: '/', label: 'Home' },
            { path: '/analysis', label: 'Data Analysis' },
            { path: '/news', label: 'News' },
            { path: '/chat', label: 'Safety Chat' },
          ].map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              sx={{
                color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === item.path ? 700 : 500,
                '&:hover': {
                  backgroundColor: 'rgba(37, 99, 235, 0.04)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 