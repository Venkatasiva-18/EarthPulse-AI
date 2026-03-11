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
      map.flyTo(e.latlng, 12);
    },
  });

  useEffect(() => {
    map.locate();
    const handleFlyTo = (e) => {
      setPos(e.detail);
      map.flyTo(e.detail, 12);
    };
    window.addEventListener('map-fly-to', handleFlyTo);
    return () => window.removeEventListener('map-fly-to', handleFlyTo);
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
    role: 'CITIZEN',
    department: '',
    designation: '',
    profilePicture: ''
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Form
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', { email: formData.email, otp });
      alert('Email verified successfully! You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/resend-otp', { email: formData.email });
      alert('OTP resent successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log("Submitting registration data:", formData);
    try {
      await axios.post('http://localhost:8080/api/auth/register', formData);
      setShowOtp(true);
      setTimeout(() => {
        alert('Registration successful! Please check your email for the verification code.');
      }, 100);
    } catch (err) {
      console.error("DEBUG: Registration error details:", err.response?.data);
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(`Registration failed: ${msg}`);
    }
  };

  const handleLocationChange = async (latlng) => {
    const { lat, lng } = latlng;
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
      if (response.data && response.data.address) {
        const addr = response.data.address;
        console.log("Nominatim Address Object:", addr);
        
        // Logical mapping for Indian administrative levels
        // 1. District: Use the largest administrative unit below State
        const districtCandidate = addr.state_district || addr.district || addr.county || addr.city || '';
        
        // 2. Mandal (Sub-district): Use sub-administrative units
        const mandalCandidate = addr.subdistrict || addr.tehsil || addr.taluka || addr.municipality || addr.town || '';
        
        // 3. Village/Locality: Use most specific local names
        const villageCandidate = addr.village || addr.hamlet || addr.locality || addr.suburb || addr.neighbourhood || '';

        setFormData(prev => {
          let finalDistrict = districtCandidate;
          let finalMandal = mandalCandidate;
          let finalVillage = villageCandidate;

          // If Mandal is missing, try using City if it wasn't used for District
          if (!finalMandal) {
            if (addr.city && addr.city !== finalDistrict) {
              finalMandal = addr.city;
            } else if (addr.town && addr.town !== finalDistrict) {
              finalMandal = addr.town;
            } else if (addr.suburb) {
              finalMandal = addr.suburb;
            }
          }

          // If Mandal is still same as District, try to find something more specific
          if (finalMandal === finalDistrict) {
            finalMandal = addr.subdistrict || addr.tehsil || addr.taluka || addr.town || addr.suburb || '';
          }

          // Ensure Mandal is NOT the same as District if possible
          if (finalMandal === finalDistrict && (addr.subdistrict || addr.tehsil || addr.taluka)) {
             finalMandal = addr.subdistrict || addr.tehsil || addr.taluka;
          }

          // Final fallback for Mandal: if it's still empty but we have a display_name, 
          // sometimes the 3rd or 4th component of display_name is the mandal
          if (!finalMandal && response.data.display_name) {
            const parts = response.data.display_name.split(',').map(p => p.trim());
            if (parts.length > 3) {
              finalMandal = parts[2]; // Usually [Village, Mandal, District, State, Country]
            }
          }

          return {
            ...prev,
            latitude: lat,
            longitude: lng,
            country: addr.country || '',
            state: addr.state || '',
            district: finalDistrict,
            mandal: finalMandal || districtCandidate, // Last resort: use district if mandal still unknown
            village: finalVillage || finalMandal || '',
            address: response.data.display_name
          };
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  if (showOtp) {
    return (
      <div className="auth-container full-page">
        <div className="auth-card">
          <h2>Verify Your Email</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
            Enter the 6-digit verification code sent to <strong>{formData.email}</strong>
          </p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="6-digit OTP" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                maxLength="6"
              />
            </div>
            <button type="submit" className="btn full-width">Verify Email</button>
          </form>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button onClick={handleResendOtp} className="btn-link" style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer' }}>
              Resend OTP
            </button>
          </div>
          <p className="auth-footer">
            <button onClick={() => setShowOtp(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
              Back to Registration
            </button>
          </p>
        </div>
      </div>
    );
  }

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
            <div className="form-group">
              <label style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', display: 'block' }}>Profile Photo (Optional)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="map-label" style={{ margin: 0 }}>Select your location on the map:</label>
              <button 
                type="button" 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                      handleLocationChange(latlng);
                      window.dispatchEvent(new CustomEvent('map-fly-to', { detail: latlng }));
                    });
                  }
                }}
                className="btn"
                style={{ padding: '5px 15px', fontSize: '0.8rem', background: '#2196f3' }}
              >
                📍 Use My Current Location
              </button>
            </div>
            <div className="map-wrapper">
              <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker setPosition={handleLocationChange} />
              </MapContainer>
            </div>
            <div className="coords-display" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📍 Selected Coords: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}</span>
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Tip: Location fields auto-fill when you click the map</span>
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
