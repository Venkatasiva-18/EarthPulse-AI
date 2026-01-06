import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuthorityDashboard = () => {
  const [reports, setReports] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('REPORTS');

  useEffect(() => {
    fetchReports();
    fetchGrievances();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchGrievances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/grievances/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrievances(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching grievances:', error);
      setLoading(false);
    }
  };

  const handleUpdateGrievance = async (id, status, resolution) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/grievances/${id}/status?status=${status}&resolution=${resolution || ''}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Grievance updated!');
      fetchGrievances();
    } catch (error) {
      console.error('Error updating grievance:', error);
    }
  };

  const handleUpdateStatus = async (id, status, remarks) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/reports/${id}/status?status=${status}&remarks=${remarks || ''}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Status updated successfully!');
      fetchReports();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const filteredReports = filter === 'ALL' 
    ? reports 
    : reports.filter(r => r.status === filter);

  if (loading) return <div className="container" style={{padding:'2rem'}}>Loading Dashboard...</div>;

  return (
    <div className="container" style={{ padding: '2rem', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Authority Control Center</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setActiveTab('REPORTS')} className={`btn ${activeTab === 'REPORTS' ? '' : 'btn-outline'}`} style={{ background: activeTab === 'REPORTS' ? '#007bff' : '#6c757d' }}>Reports</button>
          <button onClick={() => setActiveTab('GRIEVANCES')} className={`btn ${activeTab === 'GRIEVANCES' ? '' : 'btn-outline'}`} style={{ background: activeTab === 'GRIEVANCES' ? '#007bff' : '#6c757d' }}>Grievances</button>
        </div>
        {activeTab === 'REPORTS' && (
          <div className="form-group" style={{ flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
            <label>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '5px' }}>
              <option value="ALL">All Reports</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ACTION_TAKEN">Action Taken</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'REPORTS' ? (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredReports.map(report => (
          <div key={report.id} className={`report-card severity-${report.severity.toLowerCase()}`} style={{ height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <strong>{report.pollutionType}</strong>
              <span className={`badge ${report.verified ? 'verified-badge' : ''}`}>{report.status}</span>
            </div>
            <p><strong>Location:</strong> {report.address}, {report.city}</p>
            <p><strong>Reported:</strong> {new Date(report.timestamp).toLocaleString()}</p>
            <p><strong>Description:</strong> {report.description}</p>
            <p><strong>Confidence:</strong> {report.confidenceScore}%</p>
            
            <hr />
            
            <div className="action-section" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label style={{fontSize:'0.8rem'}}>Update Status:</label>
                <select 
                  defaultValue={report.status} 
                  onChange={(e) => {
                    const remarks = prompt('Enter authority remarks:');
                    handleUpdateStatus(report.id, e.target.value, remarks);
                  }}
                  style={{ width: '100%', padding: '5px' }}
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACTION_TAKEN">Action Taken</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              {report.authorityRemarks && (
                <div style={{ marginTop: '10px', fontSize: '0.85rem', background: '#f0f0f0', padding: '5px', borderRadius: '4px' }}>
                  <strong>Remarks:</strong> {report.authorityRemarks}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {grievances.map(g => (
          <div key={g.id} className="report-card" style={{ height: 'fit-content' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{g.title}</strong>
                <span className="badge">{g.status}</span>
             </div>
             <p style={{margin:'10px 0'}}>{g.description}</p>
             <hr />
             <div className="action-section" style={{ marginTop: '1rem' }}>
                <label style={{fontSize:'0.8rem'}}>Update Status:</label>
                <select 
                  defaultValue={g.status}
                  onChange={(e) => {
                    const res = prompt('Enter resolution remarks:');
                    handleUpdateGrievance(g.id, e.target.value, res);
                  }}
                  style={{ width: '100%', padding: '5px' }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
             </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
};

export default AuthorityDashboard;
