import React, { useState, useEffect } from 'react';
const translations = require('../translations');
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { Line } from 'react-chartjs-2';
import { AlertTriangle, Info, CheckCircle, Droplets, Factory, MapPin, AlertCircle } from 'lucide-react';
import WaterQualityAnalyzer from './WaterQualityAnalyzer';
import IndustrialRiskAnalyzer from './IndustrialRiskAnalyzer';
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
  const heatLayerRef = React.useRef(null);

  useEffect(() => {
    if (!map) return;

    const createLayer = () => {
      // Cleanup existing layer
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      // Validate map size to prevent Canvas width=0 errors
      const size = map.getSize();
      if (size.x <= 0 || size.y <= 0) {
        console.warn('Map size is 0, skipping heatmap layer creation');
        map.invalidateSize();
        return;
      }

      if (!points || points.length === 0) return;

      try {
        heatLayerRef.current = L.heatLayer(points, { 
          radius: 35, 
          blur: 20, 
          maxZoom: 10,
          max: 1.0,
          gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
        }).addTo(map);
      } catch (err) {
        console.error('Heatmap error:', err);
      }
    };

    // Delay slightly to ensure DOM is ready and map container has dimensions
    const timer = setTimeout(() => {
      requestAnimationFrame(createLayer);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
};

const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 12);
    }
  }, [center, map]);
  return null;
};

const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const Dashboard = ({ token }) => {
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang];
  const [reports, setReports] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [filterType, setFilterType] = useState('BOTH');
  const [hotspots, setHotspots] = useState(null);
  const [mapData, setMapData] = useState([]);
  const [globalData, setGlobalData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [localPollution, setLocalPollution] = useState(null);
  const [localSummary, setLocalSummary] = useState(null);
  const [currentSelectionMode, setCurrentSelectionMode] = useState('NONE'); // 'NONE', 'POLLUTION', 'WATER', 'INDUSTRIAL'
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [showPollutants, setShowPollutants] = useState(false);
  const [formData, setFormData] = useState({
    pollutionType: '',
    severity: 'LOW',
    address: '',
    district: '',
    state: '',
    mandal: '',
    village: '',
    country: '',
    description: '',
    latitude: 20.5937,
    longitude: 78.9629,
    anonymous: false
  });

  const [stats, setStats] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState({ waterSamples: [], predictions: [] });

  const handleLocationSelect = async (latlng) => {
    if (currentSelectionMode === 'NONE') return;
    const { lat, lng } = latlng;
    
    // Refresh local status data for the new location
    fetchLocalPollution(lat, lng);
    fetchLocalSummary(lat, lng);
    
    // Update coordinates for all relevant states or current mode
    if (currentSelectionMode === 'POLLUTION') {
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
    
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`);
      if (response.data && response.data.address) {
        const addr = response.data.address;
        
        // Logical mapping for Indian administrative levels
        const districtCandidate = addr.state_district || addr.district || addr.county || addr.city || '';
        const mandalCandidate = addr.subdistrict || addr.tehsil || addr.taluka || addr.municipality || addr.town || '';
        const villageCandidate = addr.village || addr.hamlet || addr.locality || addr.suburb || addr.neighbourhood || '';
        
        const display_name = response.data.display_name;

        if (currentSelectionMode === 'POLLUTION') {
          setFormData(prev => {
            let finalDistrict = districtCandidate;
            let finalMandal = mandalCandidate;
            let finalVillage = villageCandidate;

            if (!finalMandal) {
              if (addr.city && addr.city !== finalDistrict) finalMandal = addr.city;
              else if (addr.town && addr.town !== finalDistrict) finalMandal = addr.town;
              else if (addr.suburb) finalMandal = addr.suburb;
            }

            if (finalMandal === finalDistrict) {
              finalMandal = addr.subdistrict || addr.tehsil || addr.taluka || addr.town || addr.suburb || '';
            }

            if (!finalMandal && display_name) {
              const parts = display_name.split(',').map(p => p.trim());
              if (parts.length > 3) finalMandal = parts[2];
            }

            return {
              ...prev,
              latitude: lat,
              longitude: lng,
              address: display_name,
              district: finalDistrict,
              state: addr.state || '',
              country: addr.country || '',
              mandal: finalMandal || districtCandidate,
              village: finalVillage || finalMandal || ''
            };
          });
        } else if (currentSelectionMode === 'WATER') {
          // Find the water analyzer's setter if we had one, 
          // but better to just use a global or pass a callback
          window.dispatchEvent(new CustomEvent('map-location-selected', { 
            detail: { lat, lng, district: districtCandidate, mode: 'WATER' } 
          }));
        } else if (currentSelectionMode === 'INDUSTRIAL') {
          window.dispatchEvent(new CustomEvent('map-location-selected', { 
            detail: { lat, lng, district: districtCandidate, mode: 'INDUSTRIAL' } 
          }));
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = [latitude, longitude];
          setMapCenter(newCenter);
          handleLocationSelect({ lat: latitude, lng: longitude });
        },
        (error) => {
          alert('Could not get your location. Please check browser permissions.');
        }
      );
    }
  };

  useEffect(() => {
    fetchReports();
    fetchStats();
    fetchHotspots();
    fetchUserRecommendations();
    fetchMapData();
    fetchHistoricalData('Local Area');
    fetchEnvironmentalData();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCenter = [latitude, longitude];
          setMapCenter(newCenter);
          setFormData(prev => ({ ...prev, latitude, longitude }));
          fetchLocalPollution(latitude, longitude);
          fetchLocalSummary(latitude, longitude);
          fetchGlobalPollutionData(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          fetchLocalPollution(20.5937, 78.9629);
          fetchLocalSummary(20.5937, 78.9629);
          fetchGlobalPollutionData(20.5937, 78.9629);
        }
      );
    }
  }, [token]);

  const fetchLocalSummary = async (lat, lon) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`http://localhost:8080/api/pollution/summary?lat=${lat}&lon=${lon}`, config);
      setLocalSummary(response.data);
    } catch (error) {
      console.error('Error fetching local summary:', error);
    }
  };

  const fetchLocalPollution = async (lat, lon) => {
    try {
      const response = await axios.get(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=demo`);
      if (response.data && response.data.status === 'ok') {
        setLocalPollution(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching local pollution:', error);
    }
  };

  const fetchHistoricalData = async (location) => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`http://localhost:8080/api/historical/trends?location=${location}`, config);
      setHistoricalData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchGlobalPollutionData = async (lat, lon) => {
    try {
      // Use search location to define bounds if provided, otherwise default to India
      let bounds;
      if (lat && lon) {
        const offset = 5;
        bounds = `${lat - offset},${lon - offset},${lat + offset},${lon + offset}`;
      } else {
        bounds = "5,60,40,100"; // Covering India region
      }
      
      const response = await axios.get(`https://api.waqi.info/map/bounds/?latlng=${bounds}&token=demo`);
      if (response.data && response.data.status === 'ok') {
        setGlobalData(response.data.data.map(station => ({
          latitude: station.lat,
          longitude: station.lon,
          aqi: parseInt(station.aqi),
          name: station.station.name
        })));
      }
    } catch (error) {
      console.error('Error fetching global pollution data:', error);
    }
  };

  const fetchMapData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://localhost:8080/api/pollution/map-data', config);
      if (response.data && response.data.hotspots) {
        setMapData(response.data.hotspots);
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
    }
  };

  const fetchEnvironmentalData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://localhost:8080/api/pollution/environmental-data', config);
      setEnvironmentalData(response.data);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://localhost:8080/api/reports/stats/by-date', config);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHotspots = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`http://localhost:8080/api/pollution/hotspots?filterType=${filterType}`, config);
      setHotspots(response.data);
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    }
  };

  const fetchUserRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:8080/api/pollution/recommendations/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecommendations(response.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchTrendAnalysis = async (location) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/pollution/trend/forecast/${location}`);
      setTrendAnalysis(response.data);
    } catch (error) {
      console.error('Error fetching trend analysis:', error);
    }
  };

  const getAqiColor = (aqi) => {
    if (aqi <= 50) return '#4caf50'; // Good - Green
    if (aqi <= 100) return '#ffeb3b'; // Moderate - Yellow
    if (aqi <= 200) return '#ff9800'; // Poor - Orange
    return '#f44336'; // Severe - Red
  };

  const POLLUTION_COLORS = {
    'TRAFFIC': '#2196f3',      // Blue
    'INDUSTRIAL': '#9c27b0',   // Purple
    'CONSTRUCTION': '#ff9800', // Orange
    'AGRICULTURAL': '#4caf50', // Green
    'DUST': '#795548',         // Brown
    'SMOKE': '#607d8b',        // Grey
    'WATER': '#00bcd4',        // Cyan
    'SOIL': '#8bc34a',         // Light Green
    'NOISE': '#ffc107',        // Amber
    'WASTE': '#e91e63',        // Pink
    'AIR': '#f44336'           // Red for generic Air Pollution
  };

  const getPollutionColor = (type) => {
    if (!type) return '#000000';
    const normalized = type.toUpperCase().trim();
    // Support partial match for custom types
    for (const [key, color] of Object.entries(POLLUTION_COLORS)) {
        if (normalized.includes(key)) return color;
    }
    return '#000000'; // Default black for unknown
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

  const historicalChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [2023, 2024, 2025].map(year => {
      const yearData = historicalData.filter(d => d.year === year).sort((a, b) => a.month - b.month);
      const colors = { 2023: '#2196f3', 2024: '#ff9800', 2025: '#f44336' };
      return {
        label: `AQI ${year}`,
        data: yearData.map(d => d.avgAqi),
        borderColor: colors[year],
        backgroundColor: colors[year],
        fill: false,
        tension: 0.1
      };
    })
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get('http://localhost:8080/api/reports', config);
      const newReports = response.data;
      
      // Check for new high severity reports to alert
      const highSeverity = newReports.filter(r => r.severity === 'HIGH' && !reports.find(old => old.id === r.id));
      if (highSeverity.length > 0) {
        const newAlerts = highSeverity.map(r => ({
          id: Date.now() + Math.random(),
          message: `CRITICAL: ${r.pollutionType} reported at ${r.district}!`,
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
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post('http://localhost:8080/api/reports', {
        ...formData,
        timestamp: new Date().toISOString()
      }, { headers });
      alert('Report submitted successfully!');
      setFormData({
        pollutionType: '',
        severity: 'LOW',
        address: '',
        district: '',
        state: '',
        mandal: '',
        village: '',
        country: '',
        description: '',
        latitude: 20.5937,
        longitude: 78.9629,
        anonymous: false
      });
      fetchReports();
      fetchUserRecommendations();
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

  const handleSearch = async (e) => {
    e.preventDefault();
    const query = e.target.search.value;
    if (!query) return;
    
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        const newCenter = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        fetchLocalPollution(lat, lon);
        fetchLocalSummary(lat, lon);
        fetchGlobalPollutionData(parseFloat(lat), parseFloat(lon));
        setFormData(prev => ({ 
          ...prev, 
          latitude: parseFloat(lat), 
          longitude: parseFloat(lon), 
          district: display_name.split(',')[0] 
        }));
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const generatePrediction = async (location) => {
    setLoading(true);
    try {
      const { latitude, longitude } = formData;
      const hour = new Date().getHours();
      const day = new Date().getDay();
      const severity = formData.severity === 'HIGH' ? 3 : formData.severity === 'MEDIUM' ? 2 : 1;
      
      const token = localStorage.getItem('token');
      const config = {
        params: {
          location,
          hour,
          day,
          severity,
          lat: latitude,
          lon: longitude
        }
      };
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.post(`http://localhost:8080/api/predictions/generate`, null, config);
      if (response.data) {
        setPrediction(response.data);
        fetchTrendAnalysis(location);
        setShowPollutants(true);
      } else {
        alert('Could not generate forecast. Please check if the ML service is running.');
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
      alert('Failed to connect to AI Service. Please try again later.');
    }
    setLoading(false);
  };

  const handleFilterChange = (newFilterType) => {
    setFilterType(newFilterType);
    setTimeout(() => {
      axios.get(`http://localhost:8080/api/pollution/hotspots?filterType=${newFilterType}`)
        .then(response => {
          if (response.data && response.data.hotspots) {
            setMapData(response.data.hotspots);
          }
        })
        .catch(error => console.error('Error fetching hotspots:', error));
    }, 0);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Type', 'Severity', 'Address', 'District', 'State', 'Country', 'Status', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...(reports || []).map(r => [
        r.id,
        r.pollutionType,
        r.severity,
        `"${r.address}"`,
        r.district,
        r.state,
        r.country,
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

  const mapPoints = [
    ...(reports || []).filter(r => r && r.latitude && r.longitude && r.status !== 'CLOSED' && r.status !== 'RESOLVED').map(r => [r.latitude, r.longitude, (r.severity || 'LOW') === 'HIGH' ? 1.0 : (r.severity || 'LOW') === 'MEDIUM' ? 0.6 : 0.3]),
    ...(mapData || []).filter(p => p && p.latitude && p.longitude).map(p => [p.latitude, p.longitude, Math.min(1.0, (p.aqiValue || 0) / 200)]),
    ...(globalData || []).filter(g => g && g.latitude && g.longitude && !isNaN(g.aqi)).map(g => [g.latitude, g.longitude, Math.min(1.0, (g.aqi || 0) / 300)])
  ];

  return (
    <div className="main">
      {alerts.length > 0 && (
        <div className="alerts-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
        {localSummary && (
          <div className="prediction-box" style={{ background: '#f3e5f5', borderLeft: '4px solid #9c27b0', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#7b1fa2', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={20} /> Local Environmental Status
              </div>
              <span style={{ 
                fontSize: '0.65rem', 
                padding: '2px 6px', 
                borderRadius: '10px', 
                background: localSummary.surroundingsPrecision === 'IMMEDIATE' ? '#e8f5e9' : localSummary.surroundingsPrecision === 'WIDER_AREA' ? '#fff3e0' : '#ffebee',
                color: localSummary.surroundingsPrecision === 'IMMEDIATE' ? '#2e7d32' : localSummary.surroundingsPrecision === 'WIDER_AREA' ? '#ef6c00' : '#c62828',
                border: '1px solid currentColor'
              }}>
                {localSummary.surroundingsPrecision === 'IMMEDIATE' ? '📍 Surrounding' : localSummary.surroundingsPrecision === 'WIDER_AREA' ? '🔍 Wider Area' : '❓ No Data'}
              </span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Health Score</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: localSummary.overallHealthScore > 70 ? '#4caf50' : '#f44336' }}>
                  {Number(localSummary.overallHealthScore).toFixed(0)}/100
                </div>
              </div>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Air Quality</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {localSummary.airQuality ? localSummary.airQuality.aqiRange : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Water Safety</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: localSummary.waterQuality && localSummary.waterQuality.potable ? '#4caf50' : '#f44336' }}>
                  {localSummary.waterQuality ? (localSummary.waterQuality.potable ? 'Safe' : 'Unsafe') : 'Unknown'}
                </div>
              </div>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Industrial Risk</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {localSummary.industrialIncidentCount > 0 ? 'High' : 'Low'}
                </div>
              </div>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Noise Level</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: localSummary.noiseStatus === 'LOW' ? '#4caf50' : localSummary.noiseStatus === 'HIGH' ? '#f44336' : '#ff9800' }}>
                  {localSummary.noiseLevel ? `${Number(localSummary.noiseLevel).toFixed(0)}dB` : 'N/A'}
                </div>
              </div>
              <div style={{ background: 'white', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>Soil Quality</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: localSummary.soilStatus === 'GOOD' ? '#4caf50' : localSummary.soilStatus === 'CRITICAL' ? '#f44336' : '#ff9800' }}>
                  {localSummary.soilStatus || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <h2>{t.reportPollution}</h2>
        <div className="report-form-container" style={{ marginBottom: '30px' }}>
          <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              type="button" 
              onClick={useMyLocation}
              className="btn"
              style={{ background: '#2196f3', fontSize: '0.85rem', padding: '8px' }}
            >
              📍 Use My Current Location
            </button>
            <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
              Tip: Click on the map to manually select the incident location.
            </p>
          </div>
          {!localStorage.getItem('token') && (
            <div className="guest-notice" style={{ 
              padding: '10px 15px', background: '#e3f2fd', borderRadius: '8px', 
              marginBottom: '15px', borderLeft: '4px solid #2196f3', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px', color: '#0d47a1'
            }}>
              <Info size={16} />
              <span>You are reporting as a <strong>Guest</strong>. <a href="/login" style={{ color: '#1565c0', fontWeight: 'bold' }}>Login</a> for credibility points.</span>
            </div>
          )}
          <form onSubmit={handleSubmitReport} className="pollution-report-form">
            <div className="form-group">
                <input type="text" placeholder={t.pollutionType + " (e.g. Chemical Leak, Smog)"} value={formData.pollutionType} onChange={e => setFormData({...formData, pollutionType: e.target.value})} required />
            </div>
            <div className="form-group">
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '2px solid #f0f0f0', background: formData.severity === 'HIGH' ? '#ffebee' : formData.severity === 'MEDIUM' ? '#fff3e0' : '#e8f5e9' }}>
                    <option value="LOW">Low Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="HIGH">High Severity</option>
                </select>
            </div>
            
            <div className="form-group" style={{ display: 'flex', gap: '5px' }}>
                <input type="text" placeholder="Address / Landmark" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required style={{ flex: 1 }} />
                <button 
                  type="button" 
                  onClick={() => setCurrentSelectionMode('POLLUTION')}
                  className="btn"
                  style={{ padding: '8px', background: currentSelectionMode === 'POLLUTION' ? '#4caf50' : '#78909c', fontSize: '0.8rem' }}
                  title="Click to select location on map"
                >
                  <MapPin size={16} />
                </button>
            </div>
            
            <div className="form-row">
                <input type="text" placeholder="Village" value={formData.village} onChange={e => setFormData({...formData, village: e.target.value})} required />
                <input type="text" placeholder="Mandal" value={formData.mandal} onChange={e => setFormData({...formData, mandal: e.target.value})} />
            </div>
            
            <div className="form-row">
                <input type="text" placeholder="District" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} required />
                <input type="text" placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
            </div>
            
            <div className="form-group">
                <input type="text" placeholder="Country" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} required />
            </div>

            <div className="form-group">
                <textarea placeholder="Describe the incident details, visible impact, etc..." rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#555' }}>
                    <input type="checkbox" checked={formData.anonymous} onChange={e => setFormData({...formData, anonymous: e.target.checked})} />
                    Report Anonymously
                </label>
            </div>
            
            <button type="submit" className="btn full-width" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <AlertCircle size={20} />
                {t.submitReport}
            </button>
          </form>
        </div>
        
        <hr />
        
        <h2>{t.aqiPredictions}</h2>
        {prediction ? (
          <div className="prediction-box">
            <h3>AQI: {prediction.aqiValue} ({prediction.aqiRange})</h3>
            <p>Confidence: {prediction.confidencePercentage}%</p>
            {showPollutants && prediction.pollutantLevels && (
              <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '0.85rem' }}>
                <strong>Pollutant Levels (µg/m³):</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {Object.entries(prediction.pollutantLevels).map(([pollutant, value]) => (
                    <li key={pollutant}>{pollutant}: {Number(value).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="chart-container">
                <Line data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
            <button className="btn" onClick={() => generatePrediction('Local Area')} disabled={loading} style={{ width: '100%', marginTop: '10px', fontSize: '0.9rem' }}>
              {loading ? 'Updating...' : 'Refresh Forecast'}
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => generatePrediction('Local Area')} disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Analyzing Data...' : 'Generate AI Forecast'}
          </button>
        )}

        <hr />
        <WaterQualityAnalyzer onSelectOnMap={() => setCurrentSelectionMode('WATER')} isSelecting={currentSelectionMode === 'WATER'} />
        <hr />
        <IndustrialRiskAnalyzer onSelectOnMap={() => setCurrentSelectionMode('INDUSTRIAL')} isSelecting={currentSelectionMode === 'INDUSTRIAL'} />
        <hr />

        <h2>Historical Comparison</h2>
        <div className="prediction-box" style={{ background: '#fff' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>AQI Trends (2023-2025)</h4>
          <div style={{ height: '200px' }}>
            <Line data={historicalChartData} options={{ 
              maintainAspectRatio: false,
              plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } },
              scales: { y: { beginAtZero: false, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 9 } } } }
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px' }}>
            Comparing average monthly AQI across the last 3 years.
          </p>
        </div>

        <hr />

        <div style={{ marginBottom: '20px' }}>
            <button className="btn" onClick={exportToCSV} style={{ width: '100%', background: '#455a64' }}>
                Export Data to CSV
            </button>
        </div>

        <hr />

        <h2>Pollution Hotspots & Trends</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Filter Hotspots By:</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className="btn" 
              onClick={() => handleFilterChange('BOTH')}
              style={{ flex: 1, background: filterType === 'BOTH' ? '#4caf50' : '#ccc', fontSize: '0.85rem', padding: '6px' }}>
              All Hotspots
            </button>
            <button 
              className="btn" 
              onClick={() => handleFilterChange('LOCATION')}
              style={{ flex: 1, background: filterType === 'LOCATION' ? '#4caf50' : '#ccc', fontSize: '0.85rem', padding: '6px' }}>
              By Location
            </button>
            <button 
              className="btn" 
              onClick={() => handleFilterChange('POLLUTANT')}
              style={{ flex: 1, background: filterType === 'POLLUTANT' ? '#4caf50' : '#ccc', fontSize: '0.85rem', padding: '6px' }}>
              By Pollutant
            </button>
          </div>
        </div>

        {trendAnalysis && (
          <div className="prediction-box" style={{ background: '#f0f4c3', borderLeft: '4px solid #fbc02d', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f57f17' }}>📈 Trend Analysis</h4>
            <p style={{ margin: '5px 0', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{trendAnalysis}</p>
          </div>
        )}

        <hr />

        <h2>Recommendations For You</h2>
        {recommendations.length > 0 ? (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {recommendations.map(rec => (
              <div key={rec.id} className="prediction-box" style={{ background: '#e8f5e9', borderLeft: '4px solid #4caf50', marginBottom: '12px', padding: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '0.95rem' }}>
                  {rec.pollutionType} - Impact Score: {rec.impactScore}
                </h4>
                <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                  <p style={{ margin: '5px 0' }}><strong>Recommended Actions:</strong> {rec.recommendedActions}</p>
                  <p style={{ margin: '5px 0' }}><strong>Behavioral Changes:</strong> {rec.behavioralChanges}</p>
                  <p style={{ margin: '5px 0', color: '#d32f2f' }}><strong>⚠️ Immediate:</strong> {rec.immediateActions}</p>
                </div>
                <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>Valid until: {new Date(rec.validUntil).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', fontSize: '0.9rem' }}>No specific recommendations yet. Submit a pollution report to get personalized advice.</p>
        )}

        <hr />
        
        <h2>Live Reports</h2>
        {[...reports].sort((a, b) => {
          // 1. Proximity sorting if user location is available
          if (mapCenter && mapCenter[0] && mapCenter[1]) {
            const distA = Math.sqrt(Math.pow(a.latitude - mapCenter[0], 2) + Math.pow(a.longitude - mapCenter[1], 2));
            const distB = Math.sqrt(Math.pow(b.latitude - mapCenter[0], 2) + Math.pow(b.longitude - mapCenter[1], 2));
            
            // Define "Nearby" as within ~50km (0.5 degrees)
            const isNearA = distA < 0.5;
            const isNearB = distB < 0.5;
            
            // If one is nearby and the other isn't, nearby comes first
            if (isNearA !== isNearB) {
              return isNearA ? -1 : 1;
            }
            
            // If both are nearby, sort by latest timestamp first
            if (isNearA && isNearB) {
                const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
                if (timeDiff !== 0) return timeDiff;
                return distA - distB; // Ties broken by distance
            }
          }
          
          // 2. Default: Latest submission first
          return new Date(b.timestamp) - new Date(a.timestamp);
        }).map(report => (
          <div key={report.id} className={`report-card severity-${(report.severity || 'LOW').toLowerCase()}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{report.pollutionType}</strong>
                    <span className={`status-badge status-${report.status || 'SUBMITTED'}`} style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: '4px', width: 'fit-content' }}>
                        {(report.status || 'SUBMITTED').replace('_', ' ')}
                    </span>
                </div>
                {report.verified && <span className="badge verified-badge">Verified</span>}
            </div>
            <p style={{ margin: '10px 0 5px 0', fontSize: '0.85rem', color: '#444' }}>
                <MapPin size={12} style={{ marginRight: '4px' }} />
                {report.address || ''}{report.village ? `, ${report.village}` : ''}{report.mandal ? `, ${report.mandal}` : ''}{report.district ? `, ${report.district}` : ''}{report.state ? `, ${report.state}` : ''}{report.country ? `, ${report.country}` : ''}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(report.timestamp).toLocaleString()}</small>
                <div className="upvote-section">
                    <button onClick={() => handleUpvote(report.id)} style={{ 
                        cursor: 'pointer', border: '1px solid #e0e0e0', background: '#f8f9fa', 
                        borderRadius: '20px', padding: '3px 10px', fontSize: '0.75rem',
                        display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.background = '#e9ecef'} onMouseOut={e => e.currentTarget.style.background = '#f8f9fa'}>
                        ▲ {report.upvotes}
                    </button>
                </div>
            </div>
          </div>
        ))}
      </aside>
      <div className="map-container" style={{ position: 'relative' }}>
        <div style={{ 
          position: 'absolute', top: '80px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 1000, width: '80%', maxWidth: '500px' 
        }}>
          {currentSelectionMode !== 'NONE' && (
            <div style={{ 
              background: '#4caf50', color: 'white', padding: '10px', borderRadius: '8px', 
              marginBottom: '10px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                📍 Selecting location for {currentSelectionMode === 'WATER' ? 'Water Analysis' : currentSelectionMode === 'INDUSTRIAL' ? 'Industrial Profiler' : 'Pollution Report'}...
              </span>
              <button 
                onClick={() => setCurrentSelectionMode('NONE')}
                style={{ background: 'white', color: '#4caf50', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Done
              </button>
            </div>
          )}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '5px' }}>
            <input 
              name="search"
              type="text" 
              placeholder="Search district or location for pollution levels..." 
              style={{ 
                flex: 1, padding: '12px 20px', borderRadius: '30px', border: 'none', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontSize: '0.95rem', outline: 'none'
              }} 
            />
            <button type="submit" style={{ 
              padding: '10px 20px', borderRadius: '30px', border: 'none', 
              background: '#4caf50', color: 'white', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>Search</button>
          </form>
        </div>

        <div className="map-legend" style={{
          position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000,
          background: 'white', padding: '10px', borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)', fontSize: '0.75rem',
          maxHeight: '200px', overflowY: 'auto'
        }}>
          <strong style={{ display: 'block', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '3px' }}>Pollution Types</strong>
          {Object.entries(POLLUTION_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: '1px solid #fff', boxShadow: '0 0 2px rgba(0,0,0,0.3)' }}></div>
              <span style={{ color: '#444' }}>{type}</span>
            </div>
          ))}
        </div>

        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <MapController center={mapCenter} />
          <MapEvents onLocationSelect={handleLocationSelect} />
          <HeatmapLayer points={mapPoints} />
          {formData.latitude && formData.longitude && (
            <Marker position={[formData.latitude, formData.longitude]}>
              <Popup>Selected Location for Report</Popup>
            </Marker>
          )}
          {(globalData || []).filter(g => g && g.latitude && g.longitude).map((g, idx) => (
            <CircleMarker 
              key={`global-${idx}`} 
              center={[g.latitude, g.longitude]} 
              radius={6}
              pathOptions={{ 
                color: getAqiColor(g.aqi), 
                fillColor: getAqiColor(g.aqi), 
                fillOpacity: 0.8,
                weight: 1
              }}
            >
              <Popup>
                <strong>Global Station: {g.name}</strong><br />
                AQI: {g.aqi}
              </Popup>
            </CircleMarker>
          ))}
          {(mapData || []).filter(p => p && p.latitude && p.longitude).map((pred, idx) => (
            <CircleMarker 
              key={`pred-${idx}`} 
              center={[pred.latitude, pred.longitude]} 
              radius={10 + ((pred.aqiValue || 0) / 20)}
              pathOptions={{ 
                color: getAqiColor(pred.aqiValue), 
                fillColor: getAqiColor(pred.aqiValue), 
                fillOpacity: 0.5,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ minWidth: '150px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>Hotspot: {pred.name}</h3>
                  <div style={{ padding: '5px', background: getAqiColor(pred.aqiValue), color: (pred.aqiValue || 0) > 100 ? 'white' : 'black', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>
                    AQI: {pred.aqiValue} ({pred.aqiRange})
                  </div>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>Trend:</strong> {pred.trend}</p>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>Confidence:</strong> {pred.confidence}%</p>
                  {pred.pollutants && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                      <strong style={{ fontSize: '0.8rem' }}>Pollutants:</strong>
                      <ul style={{ margin: '3px 0', paddingLeft: '15px', fontSize: '0.75rem' }}>
                        {Object.entries(pred.pollutants).map(([key, val]) => (
                          <li key={key}>{key}: {val}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {environmentalData.waterSamples.filter(s => s && s.latitude && s.longitude).map((sample, idx) => (
            <CircleMarker 
              key={`water-${idx}`} 
              center={[sample.latitude, sample.longitude]} 
              radius={8}
              pathOptions={{ 
                color: '#2196f3', 
                fillColor: sample.potable ? '#4caf50' : '#f44336', 
                fillOpacity: 0.9,
                weight: 2
              }}
            >
              <Popup>
                <strong>Water Quality: {sample.district || sample.address}</strong><br />
                Potability Score: {sample.potabilityScore}<br />
                Status: {sample.potable ? 'Safe' : 'Unsafe'}<br />
                pH: {sample.ph}, Turbidity: {sample.turbidity}
              </Popup>
            </CircleMarker>
          ))}
          {reports.filter(r => r && r.latitude && r.longitude && r.status !== 'CLOSED' && r.status !== 'RESOLVED').map((report, idx) => (
            <CircleMarker 
              key={`report-${report.id || idx}`} 
              center={[report.latitude, report.longitude]} 
              radius={10}
              pathOptions={{ 
                color: '#ffffff', 
                fillColor: getPollutionColor(report.pollutionType), 
                fillOpacity: 1.0,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ minWidth: '150px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: getPollutionColor(report.pollutionType) }}>{report.pollutionType}</h3>
                  <div style={{ 
                    padding: '3px 8px', 
                    background: getPollutionColor(report.pollutionType), 
                    color: 'white', 
                    borderRadius: '4px', 
                    display: 'inline-block', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    marginBottom: '8px' 
                  }}>
                    Severity: {report.severity || 'LOW'}
                  </div>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>Location:</strong> {report.district || report.address}</p>
                  <p style={{ margin: '2px 0', fontSize: '0.85rem' }}><strong>Status:</strong> {report.status || 'SUBMITTED'}</p>
                  <small style={{ color: '#888', display: 'block', margin: '5px 0' }}>{new Date(report.timestamp).toLocaleString()}</small>
                  {report.description && <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', fontStyle: 'italic', borderTop: '1px solid #eee', paddingTop: '5px' }}>{report.description}</p>}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;
