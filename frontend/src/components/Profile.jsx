import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Camera, Save, Lock } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
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
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:8080/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
      // Reload page to update app-wide user state if necessary
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading Profile...</div>;
  if (!user) return <div className="container" style={{ padding: '2rem' }}>User not found. Please login.</div>;

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="profile-container" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', height: '150px', position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-50px', left: '40px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid white', overflow: 'hidden', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {formData.profilePicture || user.profilePicture ? (
                  <img src={formData.profilePicture || user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={60} color="#999" />
                )}
              </div>
              {editing && (
                <label style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#1a237e', color: 'white', padding: '6px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: editing ? '#333' : 'white', fontSize: '1.8rem', textShadow: editing ? 'none' : '0 2px 4px rgba(0,0,0,0.3)' }}>{user.name}</h2>
              <p style={{ margin: 0, color: editing ? '#666' : 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>@{user.username} • {user.role}</p>
            </div>
          </div>
          {!editing && (
            <button 
              onClick={() => setEditing(true)} 
              className="btn" 
              style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'white', color: '#1a237e', border: 'none', padding: '8px 20px' }}
            >
              Edit Profile
            </button>
          )}
        </div>

        <div style={{ padding: '70px 40px 40px' }}>
          {message.text && (
            <div style={{ 
              padding: '12px', borderRadius: '8px', marginBottom: '20px',
              background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
              color: message.type === 'success' ? '#2e7d32' : '#c62828',
              border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ffcdd2'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div className="form-section">
                <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#1a237e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} /> Personal Information
                </h3>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    disabled={!editing}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Email</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
                    <Mail size={16} color="#999" />
                    <span>{user.email}</span>
                  </div>
                  <small style={{ color: '#999' }}>Email cannot be changed</small>
                </div>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Mobile</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={16} color="#999" />
                    <input 
                      type="text" 
                      value={formData.mobile || ''} 
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} 
                      disabled={!editing}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', color: '#1a237e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} /> Location Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>State</label>
                    <input type="text" value={formData.state || ''} onChange={(e) => setFormData({...formData, state: e.target.value})} disabled={!editing} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>District</label>
                    <input type="text" value={formData.district || ''} onChange={(e) => setFormData({...formData, district: e.target.value})} disabled={!editing} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Mandal</label>
                    <input type="text" value={formData.mandal || ''} onChange={(e) => setFormData({...formData, mandal: e.target.value})} disabled={!editing} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Village</label>
                    <input type="text" value={formData.village || ''} onChange={(e) => setFormData({...formData, village: e.target.value})} disabled={!editing} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '5px' }}>Address</label>
                  <input type="text" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} disabled={!editing} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                </div>
              </div>
            </div>

            {editing && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={18} /> Change Password (Leave blank to keep current)
                </h4>
                <input 
                  type="password" 
                  placeholder="New Password" 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                />
              </div>
            )}

            {editing && (
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => { setEditing(false); setFormData(user); }} 
                  className="btn btn-outline"
                  style={{ background: 'none', border: '1px solid #ccc', color: '#666', padding: '10px 25px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ background: '#1a237e', color: 'white', border: 'none', padding: '10px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
