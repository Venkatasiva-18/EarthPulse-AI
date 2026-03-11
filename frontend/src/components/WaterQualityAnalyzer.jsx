import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplets, ShieldCheck, AlertTriangle, MapPin } from 'lucide-react';

const WaterQualityAnalyzer = ({ onSelectOnMap, isSelecting }) => {
  const [data, setData] = useState({
    district: '',
    latitude: null,
    longitude: null,
    ph: 7.0,
    hardness: 150.0,
    solids: 500.0,
    chloramines: 2.0,
    sulfate: 100.0,
    conductivity: 400.0,
    organicCarbon: 10.0,
    trihalomethanes: 50.0,
    turbidity: 2.5
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleMapLocation = (e) => {
      if (e.detail.mode === 'WATER') {
        setData(prev => ({ 
          ...prev, 
          district: e.detail.district,
          latitude: e.detail.lat,
          longitude: e.detail.lng
        }));
      }
    };
    window.addEventListener('map-location-selected', handleMapLocation);
    return () => window.removeEventListener('map-location-selected', handleMapLocation);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Only send Authorization header if token is present and looks valid (not the string "null")
      const headers = (token && token !== 'null' && token !== 'undefined') 
        ? { Authorization: `Bearer ${token}` } 
        : {};
      
      const response = await axios.post('http://localhost:8080/api/water-quality/analyze', data, { headers });
      setResult(response.data);
    } catch (error) {
      console.error('Error analyzing water quality:', error);
      alert('Failed to analyze water quality.');
    }
    setLoading(false);
  };

  const getStatusColor = (status, score) => {
    if (status === 'EXCELLENT' || score >= 90) return { bg: '#e8f5e9', text: '#2e7d32' };
    if (status === 'GOOD' || score >= 75) return { bg: '#f1f8e9', text: '#558b2f' };
    if (status === 'ACCEPTABLE' || score >= 60) return { bg: '#fff9c4', text: '#f57f17' };
    if (status === 'POOR' || score >= 40) return { bg: '#fff3e0', text: '#ef6c00' };
    if (status === 'UNSAFE' || score >= 36) return { bg: '#ffebee', text: '#c62828' };
    return { bg: '#212121', text: '#ff5252' }; // Darker/Serious for Critical
  };

  const getStatusLabel = (status, score) => {
    if (status) {
        if (status === 'ACCEPTABLE') return 'ACCEPTABLE (TREATMENT RECOMMENDED)';
        if (status === 'CRITICAL') return 'CRITICAL HAZARD!';
        return status;
    }
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'ACCEPTABLE (TREATMENT RECOMMENDED)';
    if (score >= 40) return 'POOR';
    if (score >= 36) return 'UNSAFE / NOT POTABLE';
    return 'CRITICAL HAZARD / TOXIC';
  };

  return (
    <div className="prediction-box" style={{ background: '#f0f7ff', borderLeft: '4px solid #2196f3' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1565c0' }}>
        <Droplets size={24} /> Water Potability Analyzer
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>Enter water parameters to check potability (inspired by WHO standards).</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
        <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: '5px' }}>
          <input type="text" placeholder="District" value={data.district} onChange={e => setData({...data, district: e.target.value})} required style={{ flex: 1, padding: '8px' }} />
          <button 
            type="button" 
            onClick={onSelectOnMap}
            className="btn"
            style={{ padding: '8px', background: isSelecting ? '#4caf50' : '#78909c', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            title="Click to select location on map"
          >
            <MapPin size={16} />
          </button>
        </div>
        {data.latitude && (
          <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: '#1976d2', background: '#e3f2fd', padding: '4px 8px', borderRadius: '4px' }}>
            📍 Selected: {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
          </div>
        )}
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>pH Level (0-14)</label>
          <input type="number" step="0.1" value={data.ph} onChange={e => setData({...data, ph: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Hardness (mg/L)</label>
          <input type="number" value={data.hardness} onChange={e => setData({...data, hardness: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Solids (ppm)</label>
          <input type="number" value={data.solids} onChange={e => setData({...data, solids: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Chloramines (ppm)</label>
          <input type="number" step="0.1" value={data.chloramines} onChange={e => setData({...data, chloramines: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Sulfate (mg/L)</label>
          <input type="number" value={data.sulfate} onChange={e => setData({...data, sulfate: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Conductivity (μS/cm)</label>
          <input type="number" value={data.conductivity} onChange={e => setData({...data, conductivity: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Organic Carbon (ppm)</label>
          <input type="number" step="0.1" value={data.organicCarbon} onChange={e => setData({...data, organicCarbon: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Trihalomethanes (μg/L)</label>
          <input type="number" step="0.1" value={data.trihalomethanes} onChange={e => setData({...data, trihalomethanes: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Turbidity (NTU)</label>
          <input type="number" step="0.1" value={data.turbidity} onChange={e => setData({...data, turbidity: parseFloat(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
        </div>
        <button type="submit" className="btn" disabled={loading} style={{ gridColumn: 'span 2', background: '#1976d2' }}>
          {loading ? 'Analyzing...' : 'Analyze Potability'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Analysis Result:</span>
            <span style={{ 
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 'bold',
              background: getStatusColor(result.status, result.potabilityScore).bg,
              color: getStatusColor(result.status, result.potabilityScore).text,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              {result.potabilityScore >= 60 ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              {getStatusLabel(result.status, result.potabilityScore)}
            </span>
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.85rem' }}>
            <p><strong>Potability Score:</strong> {Number(result.potabilityScore).toFixed(1)}% ({result.potable ? 'Potable' : 'Not Potable'})</p>
            <div style={{ width: '100%', background: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${result.potabilityScore}%`, background: result.potabilityScore >= 90 ? '#4caf50' : result.potabilityScore >= 60 ? '#8bc34a' : '#f44336', height: '100%' }}></div>
            </div>
            
            <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', borderLeft: `3px solid ${getStatusColor(result.status, result.potabilityScore).text}` }}>
                <strong>Recommendation:</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem' }}>
                    {result.potabilityScore >= 90 ? "Excellent quality. Safe for direct consumption." :
                     result.potabilityScore >= 75 ? "Good quality. Safe for drinking, basic filtration optional." :
                     result.potabilityScore >= 60 ? "Acceptable quality but treatment (boiling/active carbon filtration) is recommended before drinking." :
                     result.potabilityScore >= 40 ? "Poor quality. Not safe for direct consumption. Heavy treatment required." :
                     result.potabilityScore >= 36 ? "Unsafe for direct consumption. Heavy multi-stage treatment required." :
                     "CRITICAL HAZARD / TOXIC. Do not consume. This source contains parameters far beyond safety limits."}
                </p>
            </div>

            <p style={{ marginTop: '10px', fontSize: '0.75rem', fontStyle: 'italic', color: '#888' }}>
              *This analysis is based on provided parameters and generic WHO/BIS guidelines. Always use certified testing for drinking water.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityAnalyzer;
