import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import MatrixGrid from '../components/MatrixGrid';
import VideoControl from '../components/VideoControl';
import ScreenStatus from '../components/ScreenStatus';

const Admin = () => {
    const {
        isConnected,
        config,
        screens,
        updateConfig,
        assignScreen,
        unassignScreen
    } = useSocket();

    const [rows, setRows] = useState(config.rows);
    const [cols, setCols] = useState(config.cols);
    const [draggedScreen, setDraggedScreen] = useState(null);

    // Settings State
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [cloudSettings, setCloudSettings] = useState({
        cloudName: '',
        apiKey: '',
        apiSecret: ''
    });
    const [isCloudConfigured, setIsCloudConfigured] = useState(false);

    useEffect(() => {
        setRows(config.rows);
        setCols(config.cols);
    }, [config.rows, config.cols]);

    // Initial check for cloud settings
    useEffect(() => {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = 3001;

        fetch(`${protocol}//${hostname}:${port}/api/settings/cloud`)
            .then(res => res.json())
            .then(data => {
                setIsCloudConfigured(data.configured);
                if (data.cloudName) {
                    setCloudSettings(prev => ({ ...prev, cloudName: data.cloudName }));
                }
            })
            .catch(err => console.error('Failed to fetch settings:', err));
    }, []);

    const handleSaveSettings = () => {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = 3001;

        fetch(`${protocol}//${hostname}:${port}/api/settings/cloud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudSettings)
        })
            .then(res => res.json())
            .then(data => {
                if (data.type === 'cloud') {
                    setIsCloudConfigured(true);
                    setShowSettingsModal(false);
                    alert('Cloudinary configured successfully!');
                }
            })
            .catch(err => {
                console.error('Failed to save settings:', err);
                alert('Failed to save settings');
            });
    };

    const handleClearSettings = () => {
        if (!confirm('Are you sure you want to clear Cloudinary settings?')) return;

        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = 3001;

        fetch(`${protocol}//${hostname}:${port}/api/settings/cloud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clear: true, cloudName: 'x', apiKey: 'x', apiSecret: 'x' })
        })
            .then(res => res.json())
            .then(() => {
                setIsCloudConfigured(false);
                setCloudSettings({ cloudName: '', apiKey: '', apiSecret: '' });
                setShowSettingsModal(false);
                alert('Settings cleared. Using local storage.');
            });
    };

    const handleConfigUpdate = () => {
        updateConfig({ rows: parseInt(rows), cols: parseInt(cols) });
    };

    const unassignedScreens = screens.filter(s => s.status === 'unassigned');
    const assignedScreens = screens.filter(s => s.status === 'assigned');

    const handleDragStart = (e, screen) => {
        setDraggedScreen(screen);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e, row, col) => {
        e.preventDefault();
        if (draggedScreen) {
            assignScreen(draggedScreen.socketId, row, col);
            setDraggedScreen(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="logo">
                    <span className="logo-icon">📺</span>
                    <h1>MultiScreen Control</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isCloudConfigured && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>☁️ Cloud Active</span>}
                        <button
                            className="settings-btn"
                            onClick={() => setShowSettingsModal(true)}
                            title="Cloud Settings"
                        >
                            ⚙️
                        </button>
                    </div>
                    <div className="connection-status">
                        <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </header>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>System Settings</h3>
                            <button className="btn-close" onClick={() => setShowSettingsModal(false)}>×</button>
                        </div>

                        <div className="settings-info" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            <p style={{ marginBottom: '0.5rem' }}><strong>Storage Configuration</strong></p>
                            <p>
                                By default, videos are stored locally on this computer. This works for testing but may cause buffering when many screens are connected.
                            </p>
                            <p style={{ marginTop: '0.5rem' }}>
                                For <strong>best performance</strong>, configure Cloud Storage (Cloudinary). This allows screens to stream videos directly from the internet, saving your computer's bandwidth.
                            </p>
                        </div>

                        <div className="form-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>Cloudinary Credentials</h4>
                                <div style={{
                                    fontSize: '0.8rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: isCloudConfigured ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                    color: isCloudConfigured ? 'var(--success)' : 'var(--text-muted)',
                                    border: `1px solid ${isCloudConfigured ? 'var(--success)' : 'transparent'}`
                                }}>
                                    {isCloudConfigured ? '✅ Connected' : '⭕ Not Configured'}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cloud Name</label>
                                <input
                                    type="text"
                                    value={cloudSettings.cloudName}
                                    onChange={e => setCloudSettings({ ...cloudSettings, cloudName: e.target.value })}
                                    placeholder="e.g. dyxd..."
                                />
                            </div>
                            <div className="form-group">
                                <label>API Key</label>
                                <input
                                    type="text"
                                    value={cloudSettings.apiKey}
                                    onChange={e => setCloudSettings({ ...cloudSettings, apiKey: e.target.value })}
                                    placeholder="e.g. 8473..."
                                />
                            </div>
                            <div className="form-group">
                                <label>API Secret</label>
                                <input
                                    type="password"
                                    value={cloudSettings.apiSecret}
                                    onChange={e => setCloudSettings({ ...cloudSettings, apiSecret: e.target.value })}
                                    placeholder="e.g. wJ8s..."
                                />
                            </div>

                            <div className="modal-actions">
                                {isCloudConfigured && (
                                    <button className="btn-secondary" style={{ color: 'var(--error)', borderColor: 'var(--error)' }} onClick={handleClearSettings}>
                                        Disconnect & Clear
                                    </button>
                                )}
                                <button className="btn-primary" onClick={handleSaveSettings}>
                                    {isCloudConfigured ? 'Update Configuration' : 'Connect & Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-content">
                <aside className="sidebar">
                    <section className="config-section">
                        <h2>Matrix Configuration</h2>
                        <div className="config-grid">
                            <div className="config-field">
                                <label>Rows</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={rows}
                                    onChange={(e) => setRows(e.target.value)}
                                />
                            </div>
                            <div className="config-field">
                                <label>Columns</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={cols}
                                    onChange={(e) => setCols(e.target.value)}
                                />
                            </div>
                        </div>
                        <button className="btn-primary" onClick={handleConfigUpdate}>
                            Apply Configuration
                        </button>
                        <div className="matrix-info">
                            <span>Total Screens: {config.rows * config.cols}</span>
                            <span>Connected: {screens.length}</span>
                            <span>Assigned: {assignedScreens.length}</span>
                        </div>
                    </section>

                    <section className="screens-section">
                        <h2>Unassigned Screens ({unassignedScreens.length})</h2>
                        <div className="unassigned-list">
                            {unassignedScreens.length === 0 ? (
                                <p className="no-screens">No unassigned screens</p>
                            ) : (
                                unassignedScreens.map(screen => (
                                    <div
                                        key={screen.socketId}
                                        className="screen-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, screen)}
                                    >
                                        <span className="screen-id">{screen.id}</span>
                                        <span className="drag-hint">Drag to assign</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </aside>

                <main className="main-area">
                    <section className="matrix-section">
                        <h2>Screen Matrix ({config.rows} × {config.cols})</h2>
                        <MatrixGrid
                            rows={config.rows}
                            cols={config.cols}
                            screens={screens}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onUnassign={(socketId) => unassignScreen(socketId)}
                            draggedScreen={draggedScreen}
                        />
                    </section>

                    <section className="video-section">
                        <VideoControl />
                    </section>
                </main>

                <aside className="status-sidebar">
                    <ScreenStatus screens={screens} />
                </aside>
            </div>
        </div>
    );
};

export default Admin;
