import { useCallback, useState } from 'react';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { FooterBoiler } from '@cv/components/layout/FooterBoiler';
import { HeroSection } from '@cv/components/sections/HeroSection';
import { VitrineSection } from '@cv/components/sections/VitrineSection';
import { ToxicitySection } from '@cv/components/sections/ToxicitySection';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { TOX_GAUGES } from '@cv/types';

const mockGauges = TOX_GAUGES.map((g) => ({
  id: g.id,
  value: g.center,
  warn: g.initialWarn ?? false,
  danger: false,
}));
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  const railRef = useScrollRail();
  const [cart, setCart] = useState(3);
  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="home">
        <Topbar cartCount={cart} />
        <main className="home-main">
          <HeroSection />
          <VitrineSection locked clanking={false} bourseIdx={248} bourseTrend={{ up: true, delta: 2 }} bourseSpark={[40, 55, 50, 60]} onAddToCart={() => setCart((c) => c + 1)} />
          <ToxicitySection locked clanking={false} gauges={mockGauges} toxSpark={[35, 42, 38, 45, 40]} />
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
