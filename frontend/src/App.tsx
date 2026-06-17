import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
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
      <div className="home" style={{ minHeight: '200vh', padding: 40 }}>
        <p>Rail + cheminée — test layout fixe.</p>
      </div>
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
