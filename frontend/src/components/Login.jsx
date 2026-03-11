import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setToken, setUser }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('CITIZEN');
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/forgot-password', { email: userEmail });
      alert('OTP sent to your email!');
      setIsResetting(true);
    } catch (err) {
      const backendMessage = err.response?.data?.message;
      setError(backendMessage || 'Failed to send OTP. Please check if your email is registered.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/reset-password', { email: userEmail, otp, newPassword });
      alert('Password reset successfully! You can now login.');
      setShowForgotPassword(false);
      setIsResetting(false);
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/auth/verify-otp', { email: userEmail, otp });
      alert('Email verified successfully! You can now login.');
      setShowOtp(false);
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post('http://localhost:8080/api/auth/resend-otp', { email: userEmail });
      alert('OTP resent successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', formData);
      const token = response.data.token;
      
      const userRes = await axios.get('http://localhost:8080/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = userRes.data;
      
      // Allow MODERATOR and ADMINISTRATOR to login as AUTHORITY (Officer)
      const roleMatch = (selectedRole === 'CITIZEN' && user.role === 'CITIZEN') ||
                        (selectedRole === 'AUTHORITY' && (user.role === 'AUTHORITY' || user.role === 'MODERATOR' || user.role === 'ADMINISTRATOR')) ||
                        (selectedRole === 'ADMINISTRATOR' && user.role === 'ADMINISTRATOR');

      if (!roleMatch) {
        setError(`Unauthorized: User is not registered as ${selectedRole.toLowerCase()}`);
        return;
      }

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));

      alert('Login successful!');
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401 && err.response?.data?.unverified) {
        // If unverified, we need the email to verify OTP
        // Assuming we can extract it or ask for it
        if (formData.username.includes('@')) {
          setUserEmail(formData.username);
        } else {
          // If they logged in with username, we might need a better way to get email
          // For now, let's suggest they login with email to verify
          setError('Email not verified. Please login with your email address to receive and verify OTP.');
          return;
        }
        setShowOtp(true);
        setError('Please verify your email with the OTP sent to ' + formData.username);
      } else {
        setError('Invalid username/email or password');
      }
    }
  };

  if (showForgotPassword) {
    return (
      <div className="auth-container full-page">
        <div className="auth-card">
          <h2>{isResetting ? 'Reset Password' : 'Forgot Password'}</h2>
          {error && <p className="error">{error}</p>}
          
          {!isResetting ? (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <input 
                  type="email" 
                  placeholder="Enter your registered email" 
                  value={userEmail} 
                  onChange={(e) => setUserEmail(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn full-width">Send OTP</button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="6-digit OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                  maxLength="6"
                />
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  placeholder="New Password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
              </div>
              <button type="submit" className="btn full-width">Reset Password</button>
            </form>
          )}

          <p className="auth-footer">
            <button onClick={() => { setShowForgotPassword(false); setIsResetting(false); setError(''); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
              Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (showOtp) {
    return (
      <div className="auth-container full-page">
        <div className="auth-card">
          <h2>Verify Email</h2>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
            Enter the 6-digit code sent to <strong>{userEmail}</strong>
          </p>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="6-digit OTP" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                maxLength="6"
              />
            </div>
            <button type="submit" className="btn full-width">Verify OTP</button>
          </form>
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <button onClick={handleResendOtp} className="btn-link" style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer' }}>
              Resend OTP
            </button>
          </div>
          <p className="auth-footer">
            <button onClick={() => setShowOtp(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
              Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container full-page">
      <div className="auth-card">
        <h2>Sign In</h2>
        
        <div className="role-selector-tabs">
          <button className={selectedRole === 'CITIZEN' ? 'active' : ''} onClick={() => setSelectedRole('CITIZEN')}>Citizen</button>
          <button className={selectedRole === 'AUTHORITY' ? 'active' : ''} onClick={() => setSelectedRole('AUTHORITY')}>Officer</button>
          <button className={selectedRole === 'ADMINISTRATOR' ? 'active' : ''} onClick={() => setSelectedRole('ADMINISTRATOR')}>Admin</button>
        </div>

        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="Username or Email" 
              value={formData.username} 
              onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required 
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '-15px', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(''); }} 
              className="btn-link" 
              style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}
            >
              Forgot Password?
            </button>
          </div>
          <button type="submit" className="btn full-width">Login as {selectedRole.toLowerCase()}</button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default Login;
