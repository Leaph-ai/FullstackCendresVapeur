import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import { ChatModal } from '../../components/chatModal/chatModal';


const PANEL_IDS = ['vitrine', 'toxicite', 'journal', 'chiffres'];

export function HomePage() {
  const location = useLocation();
  const { isLocked, isClanking } = usePanelReveal(PANEL_IDS);
  const live = useLiveData();
  const [cartCount, setCartCount] = useState(3);

  const handleAddToCart = useCallback(() => {
    setCartCount((c) => c + 1);
  }, []);

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
    <SteampunkPageShell cartCount={cartCount}>
      <HeroSection />
      <VitrineSection
        locked={isLocked('vitrine')}
        clanking={isClanking('vitrine')}
        bourseIdx={live.bourseIdx}
        bourseTrend={live.bourseTrend}
        bourseSpark={live.bourseSpark}
        onAddToCart={handleAddToCart}
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
      <ChatModal />
    </SteampunkPageShell>
  );
}
