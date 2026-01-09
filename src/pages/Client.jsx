import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import VideoPlayer from '../components/VideoPlayer';

const Client = () => {
    const {
        isConnected,
        screenInfo,
        viewport,
        config,
        registerScreen
    } = useSocket();

    const [isRegistered, setIsRegistered] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (isConnected && !isRegistered) {
            registerScreen().then(() => {
                setIsRegistered(true);
            });
        }
    }, [isConnected, isRegistered, registerScreen]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Waiting for connection
    if (!isConnected) {
        return (
            <div className="client-screen waiting">
                <div className="waiting-content">
                    <div className="loader"></div>
                    <h2>Connecting to Server...</h2>
                    <p>Please wait while we establish connection</p>
                </div>
            </div>
        );
    }

    // Waiting for registration
    if (!screenInfo) {
        return (
            <div className="client-screen waiting">
                <div className="waiting-content">
                    <div className="loader"></div>
                    <h2>Registering Screen...</h2>
                </div>
            </div>
        );
    }

    // Waiting for position assignment
    if (!viewport || screenInfo.status === 'unassigned') {
        return (
            <div className="client-screen unassigned">
                <div className="unassigned-content">
                    <div className="screen-info-display">
                        <span className="label">Screen ID</span>
                        <span className="screen-id">{screenInfo.id}</span>
                    </div>
                    <div className="waiting-message">
                        <div className="pulse-ring"></div>
                        <h2>Waiting for Assignment</h2>
                        <p>An administrator will assign this screen to a position in the matrix</p>
                    </div>
                    <button className="btn-fullscreen" onClick={toggleFullscreen}>
                        {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    </button>
                </div>
            </div>
        );
    }

    // Assigned and ready to display video
    return (
        <div className="client-screen assigned">
            {!config.videoUrl ? (
                <div className="no-video">
                    <div className="position-badge">
                        <span>Position {screenInfo.position.row + 1},{screenInfo.position.col + 1}</span>
                    </div>
                    <h2>Waiting for Video</h2>
                    <p>Administrator will start playback soon</p>
                </div>
            ) : (
                <VideoPlayer
                    viewport={viewport}
                    videoUrl={config.videoUrl}
                    isPlaying={config.isPlaying}
                    currentTime={config.currentTime}
                    volume={config.volume}
                    displayMode={config.displayMode}
                />
            )}

            {!isFullscreen && (
                <div className="client-overlay">
                    <div className="mini-info">
                        <span>{screenInfo.id}</span>
                        <span>({screenInfo.position.row + 1}, {screenInfo.position.col + 1})</span>
                    </div>
                    <button className="btn-fullscreen-small" onClick={toggleFullscreen}>
                        ⛶
                    </button>
                </div>
            )}
        </div>
    );
};

export default Client;
