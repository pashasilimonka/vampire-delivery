import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function EditForm() {
    const { id } = useParams(); // Отримання ID страви з URL
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [available, setAvailable] = useState(true);
    const [image, setImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Функція для отримання даних страви
        const fetchMeal = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:8000/meals/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch meal data');
                }

                const mealData = await response.json();
                setName(mealData.name);
                setPrice(mealData.price);
                setBloodType(mealData.blood_type);
                setAvailable(mealData.available);
                // Тут можна додати логіку для збереження URL зображення, якщо потрібно
            } catch (err) {
                setError(err.message);
            }
        };

        if (id) {
            fetchMeal();
        }
    }, [id]);

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
        return result.url; // Припустимо, ваш сервер повертає URL зображення
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Перевірка даних
        if (!name || !price || !bloodType) {
            setError('Будь ласка, заповніть всі поля.');
            return;
        }

        try {
            let imageUrl = null;

            // Якщо є нове зображення, завантажте його
            if (image) {
                imageUrl = await uploadImage(image);
                console.log(imageUrl);
            } else {
                // Якщо зображення не було змінено, можна отримати URL з існуючої страви
                // imageUrl = existingImageUrl; // отримайте існуючий URL зображення
            }

            // Оновлення страви
            const mealData = {
                name,
                price: parseFloat(price),
                blood_type: bloodType,
                available,
                ...(imageUrl && { image_path: imageUrl }), // Додайте image_path тільки якщо imageUrl існує
            };

            const token = localStorage.getItem('token');
            const mealResponse = await fetch(`http://localhost:8000/meals/${id}`, {
                method: 'PUT', // Використовуйте PUT для оновлення
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mealData),
            });

            if (!mealResponse.ok) {
                throw new Error('Failed to update meal');
            }

            const mealResult = await mealResponse.json();
            setSuccess(true);
            console.log('Meal updated:', mealResult);
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
            <h1>{id ? 'Редагувати страву' : 'Створити страву'}</h1>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {success && <div style={{ color: 'green' }}>Страву успішно оновлено!</div>}
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
                    />
                </div>
                <button type="submit">{id ? 'Оновити' : 'Створити'}</button>
            </form>
        </div>
    );
}

export default EditForm;
