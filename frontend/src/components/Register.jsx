import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const LocationMarker = ({ setPosition }) => {
  const [pos, setPos] = useState(null);
  const map = useMapEvents({
    click(e) {
      setPos(e.latlng);
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      setPos(e.latlng);
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return pos === null ? null : (
    <Marker position={pos}></Marker>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    password: '',
    email: '',
    mobile: '',
    country: '',
    state: '',
    district: '',
    mandal: '',
    village: '',
    address: '',
    latitude: 20.5937,
    longitude: 78.9629,
    role: 'CITIZEN'
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting registration data:", formData);
    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', formData);
      console.log("Registration response:", response.data);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(`Registration failed: ${msg}`);
    }
  };

  const handleLocationChange = (latlng) => {
    setFormData({ ...formData, latitude: latlng.lat, longitude: latlng.lng });
  };

  if (step === 1) {
    return (
      <div className="auth-container full-page">
        <div className="role-selection-card">
          <h2>Register as...</h2>
          <div className="role-options">
            <div className="role-card-option" onClick={() => { setFormData({...formData, role: 'CITIZEN'}); setStep(2); }}>
              <div className="icon">👤</div>
              <h3>Citizen</h3>
              <p>Report pollution in your area and track AQI</p>
            </div>
            <div className="role-card-option" onClick={() => { setFormData({...formData, role: 'AUTHORITY'}); setStep(2); }}>
              <div className="icon">🛡️</div>
              <h3>Pollution Control Officer</h3>
              <p>Manage reports and take actions on pollution incidents</p>
            </div>
          </div>
          <p className="auth-footer">Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card wide-card">
        <button onClick={() => setStep(1)} className="back-btn">← Back</button>
        <h2>Registration: {formData.role === 'CITIZEN' ? 'Citizen' : 'Pollution Control Employee'}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="multi-col-form">
          <div className="form-section">
            <div className="form-group">
              <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="Username" 
                value={formData.username} 
                onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\s/g, '') })} 
                required 
              />
            </div>
            <div className="form-group">
              <input type="email" placeholder="Email ID" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="text" placeholder="Phone Number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required />
            </div>
          </div>

          <div className="form-section">
            <div className="form-row">
              <input type="text" placeholder="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} required />
              <input type="text" placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
            </div>
            <div className="form-row">
              <input type="text" placeholder="District" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} required />
              <input type="text" placeholder="Mandal" value={formData.mandal} onChange={(e) => setFormData({ ...formData, mandal: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="text" placeholder="Village" value={formData.village} onChange={(e) => setFormData({ ...formData, village: e.target.value })} required />
            </div>
            <div className="form-group">
              <input type="text" placeholder="Detailed Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>

          <div className="form-section full-width">
            <label className="map-label">Select your current location on the map:</label>
            <div className="map-wrapper">
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker setPosition={handleLocationChange} />
              </MapContainer>
            </div>
            <div className="coords-display">
              📍 Selected Coords: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </div>
          </div>

          <button type="submit" className="btn full-width">Complete Registration</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
};

export default Register;
