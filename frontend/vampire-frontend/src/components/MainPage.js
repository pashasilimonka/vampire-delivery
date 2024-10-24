import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/MainPage.css'
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const token = localStorage.getItem('token');
        const decodedToken = jwtDecode(token);
        setUserId(decodedToken.id);
        const response = await fetch('http://127.0.0.1:8000/meals', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch meals');
        }
        const data = await response.json();
        setMeals(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, []);

  const addToCart = async (meal) => {
    try {
      const token = localStorage.getItem('token');
      const shoppingCartItem = {
        user_id: userId,
        meal_id: meal.id,
        amount: 1, 
      };

      const response = await fetch('http://localhost:8000/shopping_cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(shoppingCartItem),
      });

      if (!response.ok) {
        throw new Error('Failed to add to shopping cart');
      }

      const result = await response.json();
      console.log('Item added to cart:', result);
      // Можливо, потрібно оновити стан кошика або повідомити користувача про успішне додавання
    } catch (err) {
      setError(err.message);
    }
  };
  const orderNow = async(meal) => {
    const selectedCartItems = [{user_id: userId,
      meal_id: meal.id,
      amount: 1,
      meal: meal 
    }];
    
    navigate('/order', {state: {selectedCartItems}});
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="meals-container">
      <h1>Наші напої</h1>
      <div className="meals-list">
        {meals.length > 0 ? (
          meals.map((meal) => (
            <div key={meal.id} className="meal-card">
              <img src={`http://localhost:8000/${meal.image_path}`} alt={meal.name} className="meal-image" />
              <h2>{meal.name}</h2>
              <p>Price: ${meal.price}</p>
              <p>Blood Type: {meal.blood_type}</p>
              <p>{meal.available ? 'Available' : 'Not Available'}</p>
              <div className="meal-actions">
                <button className="add-to-cart-button" onClick={() => addToCart(meal)}>Додати до кошика</button>
                <button className="order-now-button" onClick={() => orderNow(meal)}>Замовити зараз</button>
              </div>
            </div>
          ))
        ) : (
          <p>No meals available.</p>
        )}
      </div>
    </div>
  );
}

export default MainPage;
