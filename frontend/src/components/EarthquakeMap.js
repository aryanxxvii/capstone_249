import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const mapStyle = {
  height: '400px',
  width: '100%',
  borderRadius: '4px'
};

function EarthquakeMap({ predictions }) {
  if (typeof window === 'undefined') return null;

  return (
    <MapContainer 
      center={[30.4, 78.6]} 
      zoom={8} 
      style={mapStyle}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {predictions?.map((pred, index) => (
        <Marker 
          key={index}
          position={[pred.latitude, pred.longitude]}
        >
          <Popup>
            <div>
              <strong>Time Step:</strong> {pred.time_step}<br/>
              <strong>Predicted:</strong> {pred.predicted.toFixed(2)}<br/>
              <strong>Actual:</strong> {pred.actual.toFixed(2)}<br/>
              <strong>Error:</strong> {pred.absolute_error.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default EarthquakeMap; 