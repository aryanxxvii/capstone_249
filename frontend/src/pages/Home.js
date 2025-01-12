import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Grid, Button, Divider } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { divIcon } from 'leaflet';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Add this function to create custom markers with different colors
const createCustomMarker = (opacity) => {
  return divIcon({
    className: '',
    html: `
      <svg width="25" height="41" viewBox="0 0 25 41">
        <path
          fill="${`rgba(255, 0, 0, ${opacity})`}"
          stroke="#fff"
          stroke-width="1"
          d="M12.5 0C5.596 0 0 5.596 0 12.5c0 1.886.473 3.741 1.371 5.389l10.234 21.7c.17.36.54.589.895.589.355 0 .725-.229.895-.589l10.234-21.7A12.44 12.44 0 0025 12.5C25 5.596 19.404 0 12.5 0z"
        />
      </svg>
    `,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });
};

// Add this new component for map bounds
function MapBounds({ points }) {
  const map = useMap();
  
  useEffect(() => {
    if (points && points.length > 0) {
      // Create bounds from all points
      const bounds = L.latLngBounds(points.map(point => [point.latitude, point.longitude]));
      
      // Fit map to bounds with padding
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 10  // Limit maximum zoom level
      });
    }
  }, [map, points]);

  return null;
}

function Home() {
  const [predictionData, setPredictionData] = useState({
    prediction: null,
    actual: null,
    latitude: null,
    longitude: null,
    mae: null,
    predictions_data: []
  });
  const [isRunning, setIsRunning] = useState(true);

  const fetchPrediction = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/predict_data');
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      fetchPrediction();
      const interval = setInterval(fetchPrediction, 2000);
      return () => clearInterval(interval);
    }
  }, [isRunning, fetchPrediction]);

  const togglePrediction = () => {
    setIsRunning(!isRunning);
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)', 
      backgroundColor: 'background.default',
      overflow: 'hidden'
    }}>
      <Container maxWidth="xl" sx={{ height: '100%', py: 3 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3
        }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Real-time Earthquake Prediction
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              ML-powered earthquake magnitude predictions for the Himalayan region
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={togglePrediction}
            color={isRunning ? "error" : "success"}
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            sx={{ px: 3, py: 1 }}
          >
            {isRunning ? "Pause Predictions" : "Start Predictions"}
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ height: 'calc(100% - 100px)' }}>
          {/* Map Section */}
          <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Earthquake Locations
              </Typography>
              <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden' }}>
                <MapContainer 
                  center={[31.5, 77]}  // Center of the region
                  zoom={7}  // Initial zoom
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapBounds points={predictionData.predictions_data || []} />
                  {predictionData.predictions_data?.map((pred, index, array) => {
                    // Calculate opacity based on position (0.3 to 1)
                    const opacity = 0.3 + (0.7 * (index / (array.length - 1)));
                    
                    return (
                      <Marker 
                        key={index} 
                        position={[pred.latitude, pred.longitude]}
                        icon={createCustomMarker(opacity)}
                      >
                        <Popup>
                          <Typography variant="subtitle2">
                            Prediction Details
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">
                            Magnitude: {pred.predicted.toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            Actual: {pred.actual.toFixed(2)}
                          </Typography>
                          <Typography variant="body2">
                            Error: {pred.absolute_error.toFixed(4)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Time Step: {pred.time_step}
                          </Typography>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Stats Section */}
          <Grid item xs={12} lg={4} sx={{ height: '100%' }}>
            <Grid container spacing={3} sx={{ height: '100%' }}>
              {/* Current Prediction Card */}
              <Grid item xs={12}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: 'white'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Latest Prediction
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Predicted Magnitude
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {predictionData.prediction?.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Actual Magnitude
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                          {predictionData.actual?.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </Grid>

              {/* MAE Card with Table */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Model Performance
                  </Typography>
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Mean Absolute Error
                    </Typography>
                    <Typography variant="h4" color="secondary.main" sx={{ mt: 1 }}>
                      {predictionData.mae?.toFixed(4)}
                    </Typography>
                  </Box>

                  {/* Recent Predictions Table */}
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 2 }}>
                    Recent Predictions
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem' }}>Time</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem' }}>Pred.</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem' }}>Act.</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee', fontSize: '0.875rem' }}>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictionData.predictions_data?.slice(-4).map((pred, index) => (
                          <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f8fafc' : 'white' }}>
                            <td style={{ padding: '8px', fontSize: '0.875rem' }}>{pred.time_step}</td>
                            <td style={{ padding: '8px', fontSize: '0.875rem' }}>{pred.predicted.toFixed(2)}</td>
                            <td style={{ padding: '8px', fontSize: '0.875rem' }}>{pred.actual.toFixed(2)}</td>
                            <td style={{ padding: '8px', fontSize: '0.875rem' }}>{pred.absolute_error.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Home; 