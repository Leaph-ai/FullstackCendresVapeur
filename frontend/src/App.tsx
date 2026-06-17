import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { FooterBoiler } from '@cv/components/layout/FooterBoiler';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  const railRef = useScrollRail();
  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="home">
        <Topbar cartCount={3} />
        <main className="home-main">
          <p className="cv-note">Sections contenu à brancher…</p>
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
