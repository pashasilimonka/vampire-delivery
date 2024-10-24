import React, { createContext, useState, useContext, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';

// Створюємо контекст
const AuthContext = createContext();

// Провайдер контексту авторизації
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Функція для входу
  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      console.log(decoded);
      setUser({
        username: decoded.sub,
        id: decoded.id,
        role: decoded.role,
      });
      localStorage.setItem('token', token);
    } catch (e) {
      console.error('Invalid token:', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          username: decoded.sub,
          id: decoded.id,
          role: decoded.role,
        });
      } catch (e) {
        console.error('Invalid token on startup:', e);
        logout();
      }
    }
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return <div>Loading...</div>; // Показуємо спінер або інший компонент під час завантаження
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
