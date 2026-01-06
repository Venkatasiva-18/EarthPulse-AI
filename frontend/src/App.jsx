import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AuthorityDashboard from './components/AuthorityDashboard';
import Notifications from './components/Notifications';
import Grievances from './components/Grievances';
const { translations } = require('./translations');

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = translations[lang];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="container">
        <header className="header">
          <div className="nav-container" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="logo-icon" style={{ background: 'var(--accent)', padding: '5px', borderRadius: '50%' }}>🌍</div>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t.title}</h1>
            </Link>
            
            <nav className="nav-links" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <Link to="/" className="nav-item">{t.home}</Link>
              {!token && <Link to="/register" className="nav-item">{t.register}</Link>}
              {!token && <Link to="/login" className="nav-item">{t.login}</Link>}
              <Link to="/contact" className="nav-item">{t.contactUs}</Link>
              {token && <Link to="/grievances" className="nav-item">{t.grievances}</Link>}
            </nav>

            <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <select 
                value={lang} 
                onChange={(e) => {
                  setLang(e.target.value);
                  localStorage.setItem('lang', e.target.value);
                }}
                className="lang-select"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
              </select>
              
              {token && <Notifications />}
              
              {token ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {user?.role === 'AUTHORITY' && <Link to="/authority" className="badge verified-badge" style={{ background: '#ff9800', color: 'white' }}>{t.authorityPanel}</Link>}
                  <span className="user-badge">{user?.name || user?.username}</span>
                  <button onClick={handleLogout} className="btn-logout">{t.logout}</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/grievances" element={token ? <Grievances /> : <Navigate to="/login" />} />
          <Route path="/authority" element={token ? <AuthorityDashboard /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
