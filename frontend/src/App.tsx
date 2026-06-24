import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login/login';
import Register from './pages/Register/register';
import ForgotPassword from './pages/ForgotPassword/forgotPassword';
import Cart from './pages/Panier/cart';
import Checkout from './pages/Checkout/checkout';
import { Admin } from './pages/Admin/Admin';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage/HomePage';
import Verify2FA from './pages/Verify2FA/verify2FA';

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
      </Routes>
    </CartProvider>
  );
}

export default App;
