import { useCallback, useState } from 'react';
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
import { Route, Routes } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';

function Home() {
  const railRef = useScrollRail();
  const live = useLiveData();
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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
    </Routes>
  );
}

export default App;
