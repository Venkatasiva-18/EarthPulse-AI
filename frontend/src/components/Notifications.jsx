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

  return (
    <div className="notifications-wrapper" style={{ position: 'relative' }}>
      <button 
        onClick={() => setShowDropdown(!showDropdown)} 
        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', 
            borderRadius: '50%', padding: '2px 6px', fontSize: '10px' 
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown" style={{ 
          position: 'absolute', top: '40px', right: '0', background: 'white', color: 'black', 
          width: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 3000,
          maxHeight: '400px', overflowY: 'auto'
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            Notifications
            <button onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No notifications</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={{ 
                padding: '10px', borderBottom: '1px solid #f9f9f9', 
                background: n.readStatus ? 'transparent' : '#f0f7ff',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                  {new Date(n.timestamp).toLocaleString()}
                  {!n.readStatus && (
                    <button 
                      onClick={() => markAsRead(n.id)} 
                      style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                    >
                      <Check size={14} /> Mark Read
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
