import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Shield, Trash2, MapPin, Mail, Phone, Award, Building2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'ADMINISTRATOR';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/admin/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role.');
    }
  };

  const handleUpdateDesignation = async (userId, newDesignation) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/admin/users/${userId}/designation`, { designation: newDesignation }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Officer designation updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating designation:', error);
      alert('Failed to update designation.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    }
  };

  const filteredUsers = filter === 'ALL' 
    ? users 
    : users.filter(u => u.role === filter);

  if (loading) return <div className="container" style={{padding:'2rem'}}>Loading Admin Dashboard...</div>;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Shield size={28} color="#1a237e" /> {isAdmin ? 'User Management Portal' : 'User Directory'}
        </h2>
        <div className="form-group" style={{ flexDirection: 'row', gap: '10px', alignItems: 'center', marginBottom: 0, display: 'flex' }}>
          <label style={{ fontWeight: 600 }}>Filter by Role:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '150px' }}
          >
            <option value="ALL">All Users</option>
            <option value="CITIZEN">Citizens</option>
            <option value="AUTHORITY">Authorities</option>
            <option value="MODERATOR">Moderators</option>
            <option value="ADMINISTRATOR">Administrators</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Info</th>
              <th>Contact & Location</th>
              <th>Role & Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#eee', overflow: 'hidden', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Users size={20} color="#999" />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a237e' }}>{user.name}</span>
                      <span style={{ color: '#666', fontSize: '0.85rem' }}>@{user.username}</span>
                      <span style={{ marginTop: '4px' }}>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role}
                        </span>
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="#666" /> {user.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#666" /> {user.mobile}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#666" /> {user.village}, {user.district}, {user.state}
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontWeight: 600 }}>Role:</label>
                      {isAdmin ? (
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}
                        >
                          <option value="CITIZEN">Citizen</option>
                          <option value="AUTHORITY">Authority</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMINISTRATOR">Administrator</option>
                        </select>
                      ) : (
                        <span className={`role-badge role-${user.role}`} style={{ fontSize: '0.8rem' }}>{user.role}</span>
                      )}
                    </div>
                    {user.role === 'CITIZEN' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2e7d32' }}>
                        <Award size={14} /> <strong>Credibility:</strong> {user.credibilityScore}
                      </div>
                    )}
                    {user.role === 'AUTHORITY' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} /> <strong>Dept:</strong> {user.department || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Designation:</label>
                          {isAdmin ? (
                            <input
                              type="text"
                              value={user.designation || 'officer'}
                              onChange={(e) => {
                                const updatedUsers = users.map(u => 
                                  u.id === user.id ? { ...u, designation: e.target.value } : u
                                );
                                setUsers(updatedUsers);
                              }}
                              onBlur={() => handleUpdateDesignation(user.id, user.designation || 'officer')}
                              style={{ 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.85rem',
                                border: '1px solid #ddd',
                                minWidth: '120px'
                              }}
                              placeholder="officer"
                            />
                          ) : (
                            <span>{user.designation || 'officer'}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="action-btn btn-delete"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#a0aec0' }}>
            <Users size={48} style={{ marginBottom: '15px', opacity: 0.3 }} />
            <p style={{ fontSize: '1.2rem' }}>No users found matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
