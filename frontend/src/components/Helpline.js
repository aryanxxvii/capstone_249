import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const helplineNumbers = [
  { 
    name: "Emergency Number", 
    number: "112",
    description: "National Emergency Response"
  },
  { 
    name: "NDRF", 
    number: "011-24363260",
    description: "Disaster Response Force"
  },
  { 
    name: "NDMA Control Room", 
    number: "011-26701728",
    description: "Disaster Management Authority"
  },
  { 
    name: "Police", 
    number: "100",
    description: "Emergency Police"
  },
  { 
    name: "Ambulance", 
    number: "108",
    description: "Medical Services"
  },
  { 
    name: "Fire", 
    number: "101",
    description: "Fire Emergency Services"
  },
  { 
    name: "IMD Earthquake", 
    number: "011-24619943",
    description: "Seismology Information"
  },
  { 
    name: "GSI Helpline", 
    number: "033-22861693",
    description: "Geological Survey of India"
  }
];

function Helpline() {
  const handleCopy = (number) => {
    navigator.clipboard.writeText(number);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Emergency Helpline
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quick access emergency numbers for earthquake-related situations
        </Typography>
      </Box>

      <Grid 
        container 
        spacing={1} 
        sx={{ 
          flex: 1,
          overflowY: 'auto',
          pr: 1,
          mr: -1,
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        {helplineNumbers.map((helpline, index) => (
          <Grid item xs={12} key={index}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1.5,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'background.paper',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon 
                    color="primary" 
                    sx={{ 
                      mr: 1.5, 
                      fontSize: '1.2rem',
                      opacity: 0.9
                    }} 
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {helpline.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {helpline.description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label={helpline.number} 
                    size="small"
                    color="primary" 
                    variant="outlined"
                    sx={{ 
                      mr: 0.5,
                      '& .MuiChip-label': {
                        fontWeight: 500
                      }
                    }}
                  />
                  <Tooltip title="Copy number">
                    <IconButton 
                      size="small" 
                      onClick={() => handleCopy(helpline.number)}
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'primary.main',
                          bgcolor: 'primary.lighter'
                        }
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

export default Helpline; 