
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Login from './login'

function Home() {

  return (
    <div className="cv" style={{ padding: 48, textAlign: 'center' }}>
      <h1>Cendres &amp; Vapeur</h1>
      <p>Comptoir de la zone franche — frontend en cours d&apos;assemblage.</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}

export default App
