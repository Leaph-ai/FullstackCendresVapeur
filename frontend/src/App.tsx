import { MachineRail } from '@cv/components/layout/MachineRail';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  const railRef = useScrollRail();
  return (
    <>
      <MachineRail railRef={railRef} />
      <div className="home" style={{ minHeight: '200vh', padding: 40 }}>
        <p>Scroll pour piloter le rail mécanique (gauche).</p>
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
