import './styles/App.css';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import Header from './components/Header';
import PrivateRoute from './context/PrivateRoutes';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import { AuthProvider } from './context/AuthContext';
import Register from './components/RegisterPage';
import AdminPage from './components/AdminPage';
import MainPage from './components/MainPage'
import ShoppingCart from './components/ShoppingCart';
import OrderForm from './components/OrderForm';
import Orders from './components/Orders';
import MealForm from './components/MealForm';
import EditForm from './components/EditForm';
import WaiterPage from './components/WaiterPage';
function App() {
  return (
    <div className="app-container">
      <AuthProvider>
        <Router>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin-dashboard"
                element={
                  <PrivateRoute roles={['ADMIN']}>
                    <AdminPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <PrivateRoute roles={['USER', 'ADMIN']}>
                    <AboutUs />
                  </PrivateRoute>
                }
              />
              <Route
                path='/main'
                element={
                  <PrivateRoute roles={['USER']}>
                    <MainPage />
                  </PrivateRoute>
                }
              />
              <Route
                path='/shopping_cart'
                element={
                  <PrivateRoute roles={['USER']}>
                    <ShoppingCart />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" />} />
              <Route
                path='/order'
                element={
                  <PrivateRoute>
                    <OrderForm />
                  </PrivateRoute>
                }
               />
               <Route
                path='/orders'
                element={
                  <PrivateRoute>
                    <Orders/>
                  </PrivateRoute>
                }
                
               />
               <Route
               path='/meal'
               element={
                <PrivateRoute roles={['ADMIN']}>
                  <MealForm/>
                </PrivateRoute>
               }
               />
               <Route
               path='/edit/:id'
               element={
                <PrivateRoute roles={['ADMIN']}>
                  <EditForm/>
                </PrivateRoute>
               }
               />
               <Route
                path='/waiter-dashboard'
                element={
                  <PrivateRoute roles={['WAITER', 'ADMIN']}>
                    <WaiterPage/>
                  </PrivateRoute>
                }
                
               />
            </Routes>
            
          </main>
          <Footer />
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
