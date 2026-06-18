import { useCallback, useEffect, useState } from 'react';
import {
  ChiffresSection,
  HeroSection,
  JournalSection,
  SteampunkPageShell,
  ToxicitySection,
  VitrineSection,
  useLiveData,
  usePanelReveal,
} from '@cv';
import { Route, Routes, useLocation } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';

const PANEL_IDS = ['vitrine', 'toxicite', 'journal', 'chiffres'];

function Home() {
  const location = useLocation();
  const { isLocked, isClanking } = usePanelReveal(PANEL_IDS);
  const live = useLiveData();
  const [cart, setCart] = useState(3);
  const onAdd = useCallback(() => setCart((c) => c + 1), []);

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
    <SteampunkPageShell cartCount={cart}>
      <HeroSection />
      <VitrineSection
        locked={isLocked('vitrine')}
        clanking={isClanking('vitrine')}
        bourseIdx={live.bourseIdx}
        bourseTrend={live.bourseTrend}
        bourseSpark={live.bourseSpark}
        onAddToCart={onAdd}
      />
      <ToxicitySection
        locked={isLocked('toxicite')}
        clanking={isClanking('toxicite')}
        gauges={live.gauges}
        toxSpark={live.toxSpark}
      />
      <JournalSection
        locked={isLocked('journal')}
        clanking={isClanking('journal')}
        entries={live.journal}
      />
      <ChiffresSection
        locked={isLocked('chiffres')}
        clanking={isClanking('chiffres')}
        nixieValues={live.nixieValues}
      />
    </SteampunkPageShell>
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
