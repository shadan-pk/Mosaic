import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Admin from './pages/Admin';
import Client from './pages/Client';
import './index.css';

function Home() {
  return (
    <div className="home-page">
      <div className="home-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <div className="home-header" style={{ marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-0.05em', marginBottom: '1rem' }}>Mosaic</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: '300' }}>Unified Video Wall System</p>
        </div>

        <div className="home-options" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
          <Link to="/admin" className="home-card admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Admin Dashboard</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>System Configuration & Control</p>
            </div>
            <span className="card-arrow" style={{ position: 'static', opacity: 1, fontSize: '1.2rem' }}>→</span>
          </Link>

          <Link to="/client" className="home-card client-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Client Screen</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Connect Display Node</p>
            </div>
            <span className="card-arrow" style={{ position: 'static', opacity: 1, fontSize: '1.2rem' }}>→</span>
          </Link>
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
