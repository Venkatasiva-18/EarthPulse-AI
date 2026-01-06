import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = ({ setToken, setUser }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('CITIZEN');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', formData);
      const token = response.data;
      
      const userRes = await axios.get('http://localhost:8080/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = userRes.data;
      
      // Basic check if user's role matches selected role (AUTHORITY matches both selection options in code)
      const roleMatch = (selectedRole === 'CITIZEN' && user.role === 'CITIZEN') ||
                        (selectedRole === 'AUTHORITY' && user.role === 'AUTHORITY') ||
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
      setError('Invalid username or password');
    }
  };

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
              placeholder="Username" 
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
          <button type="submit" className="btn full-width">Login as {selectedRole.toLowerCase()}</button>
        </form>
        <p className="auth-footer">Don't have an account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
};

export default Login;
