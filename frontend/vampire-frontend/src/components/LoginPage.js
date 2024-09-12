// Login.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log(JSON.stringify({username,password}))
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      login(data.access_token);
      const decoded = jwtDecode(data.access_token);
      navigate(decoded.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard'); // Редірект в залежності від ролі
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <Link to={"/register"}>Зареєструватись</Link>
      </div>
    </div>
  );
}

export default Login;
