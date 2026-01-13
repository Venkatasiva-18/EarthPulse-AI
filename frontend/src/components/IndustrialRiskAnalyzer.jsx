import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Factory, Activity, AlertCircle, MapPin } from 'lucide-react';

const IndustrialRiskAnalyzer = ({ onSelectOnMap, isSelecting }) => {
  const [type, setType] = useState('CHEMICAL');
  const [emission, setEmission] = useState(100);
  const [waterDist, setWaterDist] = useState(500);
  const [residentialDist, setResidentialDist] = useState(2000);
  const [compliance, setCompliance] = useState(90);
  const [district, setDistrict] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleMapLocation = (e) => {
      if (e.detail.mode === 'INDUSTRIAL') {
        setDistrict(e.detail.district);
      }
    };
    window.addEventListener('map-location-selected', handleMapLocation);
    return () => window.removeEventListener('map-location-selected', handleMapLocation);
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/pollution/industrial/risk-analysis?type=${type}&emission=${emission}&waterDist=${waterDist}&residentialDist=${residentialDist}&compliance=${compliance}`);
      setResult(response.data);
    } catch (error) {
      console.error('Error analyzing industrial risk:', error);
    }
    setLoading(false);
  };

  return (
    <div className="prediction-box" style={{ background: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e65100' }}>
        <Factory size={24} /> Industrial Risk Profiler
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>Analyze toxic release intensity and mitigation priority (inspired by EPA TRI).</p>
      
      <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="form-group" style={{ display: 'flex', gap: '5px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem' }}>Location / District</label>
            <input 
              type="text" 
              placeholder="Select on map..." 
              value={district} 
              onChange={e => setDistrict(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} 
            />
          </div>
          <button 
            type="button" 
            onClick={onSelectOnMap}
            className="btn"
            style={{ marginTop: '18px', padding: '8px', background: isSelecting ? '#4caf50' : '#78909c', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            title="Click to select location on map"
          >
            <MapPin size={16} />
          </button>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Industry Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px' }}>
            <option value="CHEMICAL">Chemical Manufacturing</option>
            <option value="METAL">Metal Processing</option>
            <option value="PETROLEUM">Petroleum Refinery</option>
            <option value="PHARMACEUTICAL">Pharmaceuticals</option>
            <option value="TEXTILE">Textile Industry</option>
          </select>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Emission Volume (Scale 1-500)</label>
          <input type="range" min="1" max="500" value={emission} onChange={e => setEmission(parseInt(e.target.value))} style={{ width: '100%' }} />
          <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>{emission} Units</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem' }}>Dist to Water (m)</label>
            <input type="number" value={waterDist} onChange={e => setWaterDist(parseInt(e.target.value))} style={{ width: '100%', padding: '5px' }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.75rem' }}>Dist to Residential (m)</label>
            <input type="number" value={residentialDist} onChange={e => setResidentialDist(parseInt(e.target.value))} style={{ width: '100%', padding: '5px' }} />
          </div>
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.75rem' }}>Compliance Score (0-100)</label>
          <input type="number" value={compliance} onChange={e => setCompliance(parseInt(e.target.value))} style={{ width: '100%', padding: '5px' }} />
        </div>
        <button onClick={handleAnalyze} className="btn" disabled={loading} style={{ background: '#f57c00' }}>
          {loading ? 'Calculating...' : 'Generate Risk Profile'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: `1px solid ${result.riskLevel === 'EXTREME' ? '#d32f2f' : '#ff9800'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Risk Assessment:</span>
            <span style={{ 
              color: result.riskLevel === 'EXTREME' || result.riskLevel === 'HIGH' ? '#d32f2f' : '#2e7d32',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}>{result.riskLevel}</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem' }}>
            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', marginBottom: '3px' }}>
                <Activity size={14} /> Risk Score
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{Number(result.riskScore).toFixed(1)}/100</div>
            </div>
            <div style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#666', marginBottom: '3px' }}>
                <AlertCircle size={14} /> Priority
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{result.mitigationPriority}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#666', lineHeight: '1.4' }}>
            <strong>Toxic Intensity Index:</strong> {Number(result.toxicReleaseIntensity).toFixed(1)}<br />
            *Based on simulated hazard factors for {type} industry.
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustrialRiskAnalyzer;
