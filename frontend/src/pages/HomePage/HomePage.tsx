import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ChiffresSection,
  ContactSection,
  HeroSection,
  JournalSection,
  SteampunkPageShell,
  ToxicitySection,
  VitrineSection,
  useAirQuality,
  useLiveData,
  usePanelReveal,
} from '@cv';
import type { Product } from '@cv';
import { ChatModal } from '../../components/chatModal/chatModal';
import { useCart } from '../../context/CartContext';


const PANEL_IDS = ['vitrine', 'toxicite', 'journal', 'chiffres', 'contact'];

export function HomePage() {
  const location = useLocation();
  const { isLocked, isClanking } = usePanelReveal(PANEL_IDS);
  const live = useLiveData();
  const air = useAirQuality();
  const alertRed = air?.alertRed ?? false;

  useEffect(() => {
    document.body.classList.toggle('cv-redalert', alertRed);
    return () => document.body.classList.remove('cv-redalert');
  }, [alertRed]);

  const { addItem, getItemCount } = useCart();

  const handleAddToCart = useCallback((product: Product) => {
    void addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
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
    <SteampunkPageShell cartCount={getItemCount()}>
      {alertRed && (
        <div className="cv-alertbanner" role="alert" aria-live="assertive">
          <span className="led" aria-hidden="true" />
          ALERTE ROUGE — taux de soufre critique dans l'atmosphère de la colonie.
        </div>
      )}
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
        air={air}
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
      <ContactSection
        locked={isLocked('contact')}
        clanking={isClanking('contact')}
      />
      <ChatModal />
    </SteampunkPageShell>
  );
}
