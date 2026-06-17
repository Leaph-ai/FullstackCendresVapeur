import '@cv/styles/index.css';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  return (
    <div className="cv" style={{ padding: 32 }}>
      <button type="button" className="cv-btn">Bouton cv-btn</button>
      <span className="cv-badge" style={{ marginLeft: 12 }}>
        <span className="led" /> design system
      </span>
    </div>
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
