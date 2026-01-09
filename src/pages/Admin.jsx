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

    useEffect(() => {
        setRows(config.rows);
        setCols(config.cols);
    }, [config.rows, config.cols]);

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
                <div className="connection-status">
                    <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </header>

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
