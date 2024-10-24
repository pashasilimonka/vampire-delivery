import { Link } from 'react-router-dom';
import logo from '../images/logo.png';
import { useAuth } from '../context/AuthContext'; // Імпортуємо контекст авторизації

function Header() {
  const { user } = useAuth(); // Отримуємо користувача з контексту

  return (
    <header>
      <div className="logo-container">
        <Link to={"/about"}>
          <img src={logo} alt="Bloodline Express Logo" className="logo" />
        </Link>
      </div>
      {user && user.role !== 'ADMIN' && user.role !== 'WAITER' && ( // Відображаємо меню тільки для не адміністраторів
        <nav>
          <ul className="nav-links">
            <li><Link to="/main">Головна</Link></li>
            <li><Link to="/shopping_cart">Корзина</Link></li>
            <li><Link to="/orders">Замовлення</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default Header;
