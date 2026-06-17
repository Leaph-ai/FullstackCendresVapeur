import '@cv/styles/index.css';
import { Route, Routes } from 'react-router-dom';
import Login from './login';

function Home() {
  return (
    <div className="cv" style={{ padding: 48 }}>
      <h1>Fond usine + tokens OK</h1>
      <p>Vérification du body steampunk et des variables layout.</p>
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
