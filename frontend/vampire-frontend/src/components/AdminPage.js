import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/MainPage.css'
import { useNavigate } from 'react-router-dom';
import '../styles/AdminPage.css';

function AdminPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const token = localStorage.getItem('token');
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

  const deleteMeal = async (meal) => {

    try {
      const meal_id = meal.id;
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8000/meals/${meal_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }
      setMeals((prevMeals) => prevMeals.filter((meal) => meal.id !== meal_id));
    } catch (err) {
      setError(err.message);
    }
  };
  const EditMeal = async(meal) => {
    
    
    navigate(`/edit/${meal.id}`);
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
      <button onClick={() => {navigate("/meal")}}>Додати страву</button>
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
                <button className="add-to-cart-button" onClick={() => EditMeal(meal)}>Редагувати</button>
                <button className="order-now-button" onClick={() => deleteMeal(meal)}>Видалити</button>
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

export default AdminPage;
