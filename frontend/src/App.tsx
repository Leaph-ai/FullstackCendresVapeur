import '@cv/styles/index.css';
import { Route, Routes } from 'react-router-dom';
import Login from './login';
import Register from './register';
import ForgotPassword from './forgotPassword';

function Home() {
  return (

    <>
      <div className="cv" style={{ padding: 32 }}>
        <span className="lamp amber" /> <span className="lamp" />
        <span className="valve spin" style={{ marginLeft: 16 }} />
      </div>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
    </Routes>
  );
}

export default App;
