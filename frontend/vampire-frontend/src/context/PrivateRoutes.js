// PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children, roles }) => {
    const { user } = useAuth();
    const location = useLocation();
  
    console.log(user);  // Додатковий лог, щоб побачити, чи правильно зберігається користувач
  
    if (!user) {
      // Якщо користувач не авторизований, перенаправте на сторінку логіну
      return <Navigate to="/login" state={{ from: location }} />;
    }
  
    if (roles && !roles.includes(user.role.trim().toUpperCase())) {
      // Якщо роль користувача не підходить, перенаправте на сторінку доступу заборонено
      console.log(`Доступ заборонено: роль користувача - ${user.role}`);  // Лог для перевірки ролі
      return <Navigate to="/access-denied" />;
    }
  
    return children;
  };
  
  export default PrivateRoute;