import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

const Grievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/grievances', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrievances(response.data);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/grievances', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Grievance submitted successfully!');
      setFormData({ title: '', description: '' });
      setShowForm(false);
      fetchGrievances();
    } catch (error) {
      console.error('Error submitting grievance:', error);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>My Grievances & Feedback</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn">
          {showForm ? 'Close Form' : 'New Grievance'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Title" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginTop: '10px' }}>
            <textarea 
              placeholder="Describe your issue or feedback..." 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              required
              rows="4"
            ></textarea>
          </div>
          <button type="submit" className="btn" style={{ marginTop: '10px' }}>Submit</button>
        </form>
      )}

      <div className="grievance-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {grievances.length === 0 ? (
          <p>No grievances submitted yet.</p>
        ) : (
          grievances.map(g => (
            <div key={g.id} className="report-card" style={{ borderLeft: `5px solid ${g.status === 'RESOLVED' ? '#4caf50' : g.status === 'IN_PROGRESS' ? '#ff9800' : '#f44336'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{g.title}</strong>
                <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: '#eee' }}>{g.status}</span>
              </div>
              <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>{g.description}</p>
              {g.resolution && (
                <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '4px', fontSize: '0.85rem' }}>
                  <strong>Resolution:</strong> {g.resolution}
                </div>
              )}
              <small style={{ color: '#888' }}>{new Date(g.timestamp).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Grievances;
