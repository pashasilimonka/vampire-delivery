import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/RegisterPage.css";
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const Registration = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }), 
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      const data = await response.json();
      const decodedToken = jwtDecode(data.access_token);
      login(data.access_token);

      // Редірект залежно від ролі
      navigate(decodedToken.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <h2>Реєстрація</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Логін:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Реєстрація...' : 'Зареєструватися'}
        </button>
      </form>
      <Link to="/login">Увійти в існуючий запис</Link>
    </div>
  );
};

export default Registration;
