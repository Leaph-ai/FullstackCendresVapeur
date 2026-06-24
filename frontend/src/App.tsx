import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/login';
import Register from './pages/Register/register';
import ForgotPassword from './pages/ForgotPassword/forgotPassword';
import Cart from './pages/Panier/cart';
import Checkout from './pages/Checkout/checkout';
import { Admin } from './pages/Admin/Admin';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage/HomePage';
import { Catalogue } from './pages/Catalogue/Catalogue';
import ErrorPage from './components/feedback/ErrorPage';
import Verify2FA from './pages/Verify2FA/verify2FA';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback';
import { getRoleLevelFromToken } from './api/chat';

function App() {
  const isAdmin = getRoleLevelFromToken() === 3;

  const RequireAdmin = ({ children }: { children: React.ReactNode }) =>
    isAdmin ? children : <Navigate to="/login" replace />;
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route
          path="*"
          element={
            <ErrorPage
              code="NOT_FOUND"
              title="Secteur introuvable"
              detail="Cette zone n'existe pas ou a été engloutie par les cendres."
            />
          }
        />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
      </Routes>
    </CartProvider>
  );
}

export default App;
