import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, AlertCircle, CheckCircle, Clock, MapPin, MessageSquare, ShieldCheck } from 'lucide-react';

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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Incident Details</th>
                <th>Location Details</th>
                <th>Status & AI Analysis</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: '#1a237e' }}>{report.pollutionType}</span>
                      <small style={{ color: '#888' }}>
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        {new Date(report.timestamp).toLocaleString()}
                      </small>
                      <div className={`severity-badge severity-${report.severity.toLowerCase()}`} style={{ 
                        display: 'inline-block', width: 'fit-content', fontSize: '0.7rem', 
                        padding: '2px 6px', borderRadius: '4px', marginTop: '5px',
                        background: report.severity === 'HIGH' ? '#ffebee' : report.severity === 'MEDIUM' ? '#fff3e0' : '#e8f5e9',
                        color: report.severity === 'HIGH' ? '#c62828' : report.severity === 'MEDIUM' ? '#e65100' : '#2e7d32'
                      }}>
                        {report.severity}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} color="#666" /> <strong>{report.address}</strong>
                      </div>
                      <span>{report.village}, {report.mandal}</span>
                      <span style={{ fontWeight: 600 }}>{report.district}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span className={`status-badge status-${report.status}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                      <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheck size={14} color={report.confidenceScore > 70 ? '#2e7d32' : '#f57c00'} />
                        AI Confidence: <strong>{report.confidenceScore}%</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <select 
                        className="form-control"
                        defaultValue={report.status}
                        onChange={(e) => {
                          const remarks = prompt('Enter authority remarks:');
                          handleUpdateStatus(report.id, e.target.value, remarks);
                        }}
                        style={{ padding: '4px', fontSize: '0.85rem', borderRadius: '4px' }}
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="ACTION_TAKEN">Action Taken</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <button 
                        onClick={() => alert(`Full Description: ${report.description}\n\nRemarks: ${report.authorityRemarks || 'None'}`)}
                        className="btn" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#455a64' }}
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReports.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <FileText size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
              <p>No reports found for the selected filter.</p>
            </div>
          )}
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
