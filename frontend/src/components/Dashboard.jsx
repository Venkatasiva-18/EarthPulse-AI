import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { Line } from 'react-chartjs-2';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
const { translations } = require('../translations');
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !points.length) return;
    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);
    return () => map.removeLayer(heat);
  }, [map, points]);
  return null;
};

const Dashboard = () => {
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang];
  const [reports, setReports] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [formData, setFormData] = useState({
    pollutionType: '',
    severity: 'LOW',
    address: '',
    city: '',
    state: '',
    village: '',
    description: '',
    latitude: 20.5937,
    longitude: 78.9629,
    anonymous: false
  });

  const [stats, setStats] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/reports/stats/by-date');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const chartData = {
    labels: stats.map(s => s[0]),
    datasets: [
      {
        label: 'Pollution Reports Over Time',
        data: stats.map(s => s[1]),
        fill: false,
        backgroundColor: '#4caf50',
        borderColor: '#4caf50',
      },
    ],
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/reports');
      const newReports = response.data;
      
      // Check for new high severity reports to alert
      const highSeverity = newReports.filter(r => r.severity === 'HIGH' && !reports.find(old => old.id === r.id));
      if (highSeverity.length > 0) {
        const newAlerts = highSeverity.map(r => ({
          id: Date.now() + Math.random(),
          message: `CRITICAL: ${r.pollutionType} reported at ${r.city}!`,
          type: 'HIGH'
        }));
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 5));
      }
      
      setReports(newReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/reports', {
        ...formData,
        timestamp: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Report submitted successfully!');
      setFormData({
        pollutionType: '',
        severity: 'LOW',
        address: '',
        city: '',
        state: '',
        village: '',
        description: '',
        latitude: 20.5937,
        longitude: 78.9629,
        anonymous: false
      });
      fetchReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please check your connection or login.');
    }
  };

  const handleUpvote = async (id) => {
    try {
      await axios.post(`http://localhost:8080/api/reports/${id}/upvote`);
      fetchReports();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const generatePrediction = async (location) => {
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:8080/api/predictions/generate?location=${location}&hour=12&day=1&severity=2&temp=25&humidity=50`);
      if (response.data) {
        setPrediction(response.data);
      } else {
        alert('Could not generate forecast. Please check if the ML service is running.');
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
      alert('Failed to connect to AI Service. Please try again later.');
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Severity', 'Address', 'City', 'State', 'Status', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...reports.map(r => [
        r.id,
        r.pollutionType,
        r.severity,
        `"${r.address}"`,
        r.city,
        r.state,
        r.status,
        r.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pollution_reports_earthpulse.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mapPoints = reports.map(r => [r.latitude, r.longitude, r.severity === 'HIGH' ? 1.0 : r.severity === 'MEDIUM' ? 0.6 : 0.3]);

  return (
    <div className="main">
      {alerts.length > 0 && (
        <div className="alerts-container" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="alert-item" style={{ 
              background: '#d32f2f', color: 'white', padding: '12px 20px', borderRadius: '8px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <AlertTriangle size={20} />
              <span>{alert.message}</span>
              <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '10px' }}>×</button>
            </div>
          ))}
        </div>
      )}
      <aside className="sidebar">
        <h2>{t.reportPollution}</h2>
        {localStorage.getItem('token') ? (
          <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div className="form-group">
                <input type="text" placeholder={t.pollutionType} value={formData.pollutionType} onChange={e => setFormData({...formData, pollutionType: e.target.value})} required />
            </div>
            <div className="form-group">
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}>
                    <option value="LOW">Low Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="HIGH">High Severity</option>
                </select>
            </div>
            <div className="form-group">
                <input type="text" placeholder="Address / Landmark" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
                <input type="text" placeholder="City" style={{flex:1, padding:'8px'}} value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                <input type="text" placeholder="State" style={{flex:1, padding:'8px'}} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
            </div>
            <div className="form-group">
                <textarea placeholder="Description of the incident..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input type="checkbox" checked={formData.anonymous} onChange={e => setFormData({...formData, anonymous: e.target.checked})} />
                Report Anonymously
            </label>
            <button type="submit" className="btn">{t.submitReport}</button>
          </form>
        ) : (
          <div className="login-prompt" style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid #ff9800' }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Please <a href="/login" style={{ color: '#e65100', fontWeight: 'bold' }}>Login</a> to submit a pollution report and help your community.</p>
          </div>
        )}
        
        <hr />
        
        <h2>{t.aqiPredictions}</h2>
        {prediction ? (
          <div className="prediction-box">
            <h3>AQI: {prediction.aqiValue} ({prediction.aqiRange})</h3>
            <p>Confidence: {prediction.confidencePercentage}%</p>
            <div className="chart-container">
                <Line data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        ) : (
          <button className="btn" onClick={() => generatePrediction('Local Area')} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Analyzing Data...' : 'Generate AI Forecast'}
          </button>
        )}

        <hr />

        <div style={{ marginBottom: '20px' }}>
            <button className="btn" onClick={exportToCSV} style={{ width: '100%', background: '#455a64' }}>
                Export Data to CSV
            </button>
        </div>

        <hr />
        
        <h2>Live Reports</h2>
        {reports.map(report => (
          <div key={report.id} className={`report-card severity-${report.severity.toLowerCase()}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{report.pollutionType}</strong>
                {report.verified && <span className="badge verified-badge">Verified</span>}
            </div>
            <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{report.address}, {report.city}</p>
            <small style={{ color: '#888' }}>{new Date(report.timestamp).toLocaleString()}</small>
            <div className="upvote-section">
                <button onClick={() => handleUpvote(report.id)} style={{ cursor: 'pointer', border: '1px solid #ccc', background: 'none', borderRadius: '4px', padding: '2px 8px' }}>
                    ▲ Upvote ({report.upvotes})
                </button>
            </div>
          </div>
        ))}
      </aside>
      <div className="map-container">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <HeatmapLayer points={mapPoints} />
          {reports.map(report => (
            <Marker key={report.id} position={[report.latitude, report.longitude]}>
              <Popup>
                <strong>{report.pollutionType}</strong><br />
                {report.description}<br />
                Severity: {report.severity}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;
