import { Routes, Route } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './pages/ForgotPassword/forgotPassword';
import Cart from './pages/Panier/cart';
import Checkout from './pages/Checkout/checkout';
import { Admin } from './pages/Admin/Admin';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage/HomePage';

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
      </Routes>
    </CartProvider>
  );
}

export default App;
