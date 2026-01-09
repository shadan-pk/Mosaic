import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Admin from './pages/Admin';
import Client from './pages/Client';
import './index.css';

function Home() {
  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-header">
          <span className="home-logo">📺</span>
          <h1>MultiScreen Video Wall</h1>
          <p>Transform multiple screens into one unified display</p>
        </div>

        <div className="home-options">
          <Link to="/admin" className="home-card admin-card">
            <span className="card-icon">🎛️</span>
            <h2>Admin Dashboard</h2>
            <p>Configure matrix, manage screens, and control video playback</p>
            <span className="card-arrow">→</span>
          </Link>

          <Link to="/client" className="home-card client-card">
            <span className="card-icon">🖥️</span>
            <h2>Client Screen</h2>
            <p>Connect this screen to be part of the video wall</p>
            <span className="card-arrow">→</span>
          </Link>
        </div>

        <div className="home-instructions">
          <h3>Quick Start</h3>
          <ol>
            <li>Open <strong>Admin Dashboard</strong> on your control computer</li>
            <li>Open <strong>Client Screen</strong> on each lab computer</li>
            <li>Drag clients into the matrix grid to assign positions</li>
            <li>Enter a video URL and press play</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/client" element={<Client />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
