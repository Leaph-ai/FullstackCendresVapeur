import { useCallback, useEffect } from 'react';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { FooterBoiler } from '@cv/components/layout/FooterBoiler';
import { HeroSection } from '@cv/components/sections/HeroSection';
import { VitrineSection } from '@cv/components/sections/VitrineSection';
import { ToxicitySection } from '@cv/components/sections/ToxicitySection';
import { JournalSection } from '@cv/components/sections/JournalSection';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { useLiveData } from '@cv/hooks/useLiveData';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes, useLocation } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';
import Cart from './cart';
import Checkout from './checkout';
import { CartProvider, useCart } from './context/CartContext';

function Home() {
  const location = useLocation();
  const railRef = useScrollRail();
  const live = useLiveData();
  const { getItemCount, addItem } = useCart();
  const onAdd = useCallback(() => {
    addItem({
      id: Math.random(),
      productId: Math.random(),
      name: 'Produit',
      category: 'Catégorie',
      price: 19.99,
    });
  }, [addItem]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash || location.pathname !== '/') return;

    const target = document.querySelector(hash) as HTMLElement | null;
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash, location.pathname]);

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="home">
        <Topbar cartCount={getItemCount()} />
        <main className="home-main">
          <HeroSection />
          <VitrineSection locked clanking={false} bourseIdx={live.bourseIdx} bourseTrend={live.bourseTrend} bourseSpark={live.bourseSpark} onAddToCart={onAdd} />
          <ToxicitySection locked clanking={false} gauges={live.gauges} toxSpark={live.toxSpark} />
          <JournalSection locked clanking={false} entries={live.journal} />
        </main>
      </div>
      <FooterBoiler />
      <OverlayFx />
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
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
