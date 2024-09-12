import React from 'react';
import '../styles/AdminPage.css';
import { useAuth } from '../context/AuthContext';

function AdminPage() {
    const { logout } = useAuth();
  return (
    <div className="admin-dashboard">
      <h1>Панель Адміністратора</h1>
      <p>Ласкаво просимо, адміністраторе! Ця сторінка поки що в розробці.</p>
      <div className="admin-placeholder">
        <p>Тут буде ваша панель управління.</p>
      </div>
      <button onClick={()=>logout()}>Вийти</button>
    </div>
  );
}

export default AdminPage;
