import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function MealForm() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [available, setAvailable] = useState(true);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleImageChange = (event) => {
        setImage(event.target.files[0]);
    };

    const uploadImage = async (file) => {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8002/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const result = await response.json();
        console.log(result);
        return result.url; 
        
        // Припустимо, ваш сервер повертає URL зображення
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Перевірка даних
        if (!name || !price || !bloodType || !image) {
            setError('Будь ласка, заповніть всі поля.');
            return;
        }

        try {
            // Завантаження зображення
            const imageUrl = await uploadImage(image);
            console.log(imageUrl);

            // Створення страви з отриманим URL зображення
            const mealData = {
                name,
                price: parseFloat(price), // Переконайтесь, що ціна є числом
                blood_type: bloodType,
                available,
                image_path: imageUrl, // Використовуйте URL зображення
            };

            const token = localStorage.getItem('token');
            const mealResponse = await fetch('http://localhost:8000/meals', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mealData),
            });

            if (!mealResponse.ok) {
                throw new Error('Failed to create meal');
            }

            const mealResult = await mealResponse.json();
            setSuccess(true);
            console.log('Meal created:', mealResult);
            // Очистити форму
            setName('');
            setPrice('');
            setBloodType('');
            setAvailable(true);
            setImage(null);
            navigate("/admin-dashboard");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h1>Створити страву</h1>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>Страву успішно створено!</div>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Назва:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Ціна:</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Група крові:</label>
                    <input
                        type="text"
                        value={bloodType}
                        onChange={(e) => setBloodType(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Доступна:</label>
                    <input
                        type="checkbox"
                        checked={available}
                        onChange={(e) => setAvailable(e.target.checked)}
                    />
                </div>
                <div>
                    <label>Зображення:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        required
                    />
                </div>
                <button type="submit">Створити</button>
            </form>
        </div>
    );
}

export default MealForm;
