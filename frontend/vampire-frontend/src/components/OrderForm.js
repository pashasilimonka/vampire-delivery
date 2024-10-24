import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/OrderForm.css'; // Імпортуємо CSS стилі

const OrderForm = () => {
  const location = useLocation(); // Отримуємо вибрані страви з корзини через state
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const selectedCartItems = location.state?.selectedCartItems || [];

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Користувач не залогінений');
      setLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;

      const fullPrice = parseFloat(selectedCartItems.reduce((total, item) => total + item.meal.price * item.amount, 0));

      const orderData = {
        user_id: userId,
        full_price: fullPrice,
        address: address,
        order_date: new Date().toISOString(),
        status: 'ACCEPTED',
        items: selectedCartItems.map((item) => ({
          meal_id: item.meal.id,
          amount: item.amount,
        })),
      };
      console.log(orderData);
      const response = await fetch('http://localhost:8000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Помилка при створенні замовлення');
      }
      selectedCartItems.map((item)=>{
        const deleteResp = fetch(`http://localhost:8000/shopping_cart/${item.id}`,
            {
                method:'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
            }
        );if (!deleteResp.ok) {
            console.error(deleteResp);
          }

      });
      navigate('/order-confirmation');
    } catch (error) {
      setError(error.message || 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h1>Оформлення замовлення</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmitOrder}>
        <label htmlFor="address">Адреса доставки:</label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <h2>Обрані страви:</h2>
        <ul>
          {selectedCartItems.map((item) => (
            <li key={item.id}>
              <p>{item.meal.name} - Кількість: {item.amount} - Ціна: ${item.meal.price * item.amount}</p>
            </li>
          ))}
        </ul>
        <button type="submit" disabled={loading}>
          {loading ? 'Оформлення замовлення...' : 'Оформити замовлення'}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
