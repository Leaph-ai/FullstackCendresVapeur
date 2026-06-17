import { useCallback, useState } from 'react';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { FooterBoiler } from '@cv/components/layout/FooterBoiler';
import { HeroSection } from '@cv/components/sections/HeroSection';
import { VitrineSection } from '@cv/components/sections/VitrineSection';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  const railRef = useScrollRail();
  const [cart, setCart] = useState(3);
  const onAdd = useCallback(() => setCart((c) => c + 1), []);
  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="home">
        <Topbar cartCount={cart} />
        <main className="home-main">
          <HeroSection />
          <VitrineSection
            locked
            clanking={false}
            bourseIdx={248}
            bourseTrend={{ up: true, delta: 2 }}
            bourseSpark={[40, 52, 48, 61, 55, 68, 62, 70]}
            onAddToCart={onAdd}
          />
        </main>
      </div>
      <FooterBoiler />
      <OverlayFx />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
