import { Routes, Route } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';
import Cart from './cart';
import Checkout from './checkout';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';

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
      </Routes>
    </CartProvider>
  );
}

export default App;
