import '@cv/styles/index.css';
import { ScrollPanel, PanelHead, PanelBody } from '@cv/components/primitives/ScrollPanel';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  return (
    <>
      <main style={{ maxWidth: 900, margin: '40px auto' }}>
        <ScrollPanel id="demo" locked>
          <PanelHead sector="TEST" title="Panneau scroll verrouillé" />
          <PanelBody><p className="cv-note">Chaînes + crochets visibles au-dessus.</p></PanelBody>
        </ScrollPanel>
      </main>
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
