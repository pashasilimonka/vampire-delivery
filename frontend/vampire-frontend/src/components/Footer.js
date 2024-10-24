import { useAuth } from '../context/AuthContext'; // Імпортуємо контекст авторизації

function Footer() {
  const { user, logout } = useAuth(); // Отримуємо користувача та функцію виходу з контексту

  return (
    <footer>
      <p>
        Vampire Delivery Co. &copy; 2024 | <a href="#">Політика конфіденційності</a>
        {user && ( // Відображаємо кнопку "Вийти", якщо користувач залогінений
          <button onClick={() => logout()}>Вийти</button>
        )}
      </p>
    </footer>
  );
}

export default Footer;
