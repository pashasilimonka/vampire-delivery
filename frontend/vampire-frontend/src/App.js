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
function App() {
  return (
    <div>
      
      <AuthProvider>
      <Router>
        <Header/>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />

          
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute roles={['ADMIN']}>
                <AdminPage></AdminPage>
              </PrivateRoute>
            }
          />
          <Route
            path="/user-dashboard"
            element={
              <PrivateRoute roles={['USER']}>
                <AboutUs />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Footer/>
      </Router>
    </AuthProvider>
    </div>
  );
}

export default App;
