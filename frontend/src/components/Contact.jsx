import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('http://localhost:8080/api/contact', formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact form submission error:', err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>Contact Us</h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>Have questions or suggestions? We'd love to hear from you.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
        {/* Contact Information */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '2rem', color: '#333' }}>Get In Touch</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '10px', color: '#2196f3' }}>
                <Mail size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#555' }}>Email</div>
                <div style={{ color: '#777' }}>venkatasivaragala@gmail.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '10px', color: '#4caf50' }}>
                <Phone size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#555' }}>Phone</div>
                <div style={{ color: '#777' }}>+91 1800-123-4567</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: '#fff3e0', padding: '12px', borderRadius: '10px', color: '#ff9800' }}>
                <MapPin size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#555' }}>Address</div>
                <div style={{ color: '#777' }}>Sector 5, Environmental Park, New Delhi, India</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--primary)', borderRadius: '10px', color: 'white' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Emergency Support?</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>For urgent environmental hazards, please use the live reporting tool on the dashboard for faster intervention.</p>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ background: '#e8f5e9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#4caf50' }}>
                <Send size={40} />
              </div>
              <h3 style={{ color: '#2e7d32' }}>Message Sent Successfully!</h3>
              <p style={{ color: '#666' }}>Thank you for reaching out. Our team will get back to you within 24-48 hours.</p>
              <button onClick={() => setSubmitted(false)} className="btn" style={{ marginTop: '1rem' }}>Send Another Message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required 
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required 
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Subject</label>
                <input 
                  type="text" 
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  required 
                  placeholder="How can we help?"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#555' }}>Message</label>
                <textarea 
                  rows="5" 
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  required 
                  placeholder="Your message here..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn full-width" 
                disabled={loading}
                style={{ padding: '12px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: loading ? 0.7 : 1 }}
              >
                <Send size={20} />
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
