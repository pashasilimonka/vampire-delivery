import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Імпортуємо jwt-decode
import '../styles/ShoppingCart.css'
import { useNavigate } from 'react-router-dom';


const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // Для збереження вибраних елементів
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Користувач не залогінений');
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setUserId(decodedToken.id);
    } catch (error) {
      setError('Помилка декодування токена');
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        if (!userId) return;
        const response = await fetch(`http://localhost:8000/shopping_cart/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Помилка при отриманні корзини');
        }

        const data = await response.json();
        setCartItems(data);
      } catch (err) {
        setError(err.message || 'Помилка при завантаженні корзини');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
    console.log(cartItems);
  }, [userId]);

  const handleQuantityChange = (itemId, delta) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, amount: Math.max(item.amount + delta, 1) } : item
      )
    );
  };

  const handleSelectChange = (itemId) => {
    setSelectedItems((prevSelected) => ({
      ...prevSelected,
      [itemId]: !prevSelected[itemId], // Змінюємо стан вибору для цього елемента
    }));
  };

  const handleOrderSubmit = () => {
    const selectedCartItems = cartItems.filter((item) => selectedItems[item.id]);
    navigate('/order', {state: {selectedCartItems}})
    console.log('Оформлення замовлення для: ', selectedCartItems);
  };

  if (loading) {
    return <p>Завантаження...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="shopping-cart-container">
      <h1>Моя корзина</h1>
      {cartItems.length > 0 ? (
        <ul className="cart-items-list">
          {cartItems.map((item) => (
            <li key={item.id} className="cart-item">
              <input
                type="checkbox"
                checked={!!selectedItems[item.id]}
                onChange={() => handleSelectChange(item.id)}
              />
              <h2>{item.meal.name}</h2>
              <img src={`http://localhost:8000/${item.meal.image_path}`} alt={item.meal.name} />
              <p>Кількість:</p>
              <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
              {item.amount}
              <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
              <p>Ціна: ${item.meal.price}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Ваша корзина порожня.</p>
      )}
      <button className='order-button' onClick={handleOrderSubmit} disabled={Object.keys(selectedItems).length === 0}>
        Оформити замовлення
      </button>
    </div>
  );
};

export default ShoppingCart;

