import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Check } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const unreadNotifications = notifications.filter(n => !n.readStatus);
      await Promise.all(unreadNotifications.map(n => 
        axios.put(`http://localhost:8080/api/notifications/${n.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div className="notifications-wrapper" style={{ position: 'relative' }}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)} 
        className="notifications-trigger"
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <Bell size={24} style={{ filter: unreadCount > 0 ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-5px', right: '-5px', background: '#ff4444', color: 'white', 
            borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown" style={{ 
          position: 'absolute', top: '45px', right: '0', background: 'white', color: 'black', 
          width: '320px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', borderRadius: '12px', zIndex: 9999,
          maxHeight: '450px', overflowY: 'auto', border: '1px solid #e0e0e0'
        }}>
          <div style={{ 
            padding: '12px 15px', borderBottom: '1px solid #eee', fontWeight: 'bold', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'sticky', top: 0, background: 'white', zIndex: 1
          }}>
            <span style={{ fontSize: '1rem', color: 'var(--primary)' }}>Notifications</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}>×</button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888' }}>
              <Bell size={32} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ 
                padding: '12px 15px', borderBottom: '1px solid #f0f0f0', 
                background: n.readStatus ? 'transparent' : '#f0f7ff',
                position: 'relative',
                transition: 'background-color 0.2s'
              }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                  <div style={{ 
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: n.type === 'CRITICAL' ? '#ff4444' : n.type === 'WARNING' ? '#ffbb33' : '#00C851',
                    marginTop: '5px', flexShrink: 0
                  }} />
                  <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: '#333' }}>{n.message}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#999', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '18px' }}>
                  {new Date(n.timestamp).toLocaleString()}
                  {!n.readStatus && (
                    <button 
                      onClick={() => markAsRead(n.id)} 
                      style={{ background: '#e3f2fd', border: 'none', color: '#1976d2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}
                    >
                      <Check size={10} /> Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
