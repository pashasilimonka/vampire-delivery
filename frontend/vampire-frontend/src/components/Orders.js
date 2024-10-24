import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import '../styles/Orders.css';


function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

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
    }, []); // Виконати цей ефект лише один раз, при монтуванні компонента

    useEffect(() => {
        const fetchOrders = async () => {
            if (userId === null) return; // Не виконуємо запит, якщо userId ще не визначено
            
            try {
                const response = await fetch(`http://localhost:8000/orders/${userId}`, { // Змінено шлях запиту
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                console.log(data);
                setOrders(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [userId]); // Додайте userId як залежність

    if (loading) {
        return <div>Loading...</div>; // Показуємо спінер під час завантаження
    }

    if (error) {
        return <div>Error: {error}</div>; // Виводимо помилку, якщо вона сталася
    }

    return (
        <div className="orders-container">
            <h1>Ваші замовлення</h1>
            <div className="orders-list">
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order.id} className="order-card">
                            <h2>Замовлення #{order.id}</h2>
                            <p>Сума: ${order.full_price}</p>
                            <p>Адреса: {order.address}</p>
                            <p>Дата замовлення: {new Date(order.order_date).toLocaleString()}</p>
                            <p>Статус: {order.status}</p>
                            <h3>Товари:</h3>
                            {/* <ul>
                                {order.items.map((item) => ( // Змінено order_items на items, якщо ваше API віддає items
                                    <li key={item.meal_id}>
                                        ID страви: {item.meal_id}, Кількість: {item.amount}
                                    </li>
                                ))}
                            </ul> */}
                        </div>
                    ))
                ) : (
                    <p>У вас немає замовлень.</p>
                )}
            </div>
        </div>
    );
}

export default Orders;
