import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WaiterPage.css';

function WaiterPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/orders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateOrderStatus = async (order, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const updatedOrder = { ...order, status: newStatus }; // Копія замовлення з новим статусом

      const response = await fetch(`http://localhost:8000/orders/${updatedOrder.order_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedOrder),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_id === updatedOrder.order_id ? updatedOrder : o
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="orders-container">
      <h1>Замовлення</h1>
      <div className="orders-list">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <h2>Order ID: {order.order_id}</h2>
              <p>User ID: {order.user_id}</p>
              <p>Address: {order.address}</p>
              <p>Full Price: ${order.full_price}</p>
              <p>Order Date: {new Date(order.order_date).toLocaleString()}</p>
              <p>Status: {order.status}</p>
              <div className="order-actions">
                {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateOrderStatus(order, status)}
                    disabled={order.status === status}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No orders available.</p>
        )}
      </div>
    </div>
  );
}

export default WaiterPage;
