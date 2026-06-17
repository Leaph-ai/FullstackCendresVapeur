import '@cv/styles/index.css';
import { SparkChart } from '@cv/components/primitives/SparkChart';
import { OverlayFx } from '@cv/components/primitives/OverlayFx';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  const spark = [40, 55, 48, 62, 58, 70, 65, 72];
  return (
    <>
      <div className="cv" style={{ padding: 32 }}>
        <SparkChart values={spark} />
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
