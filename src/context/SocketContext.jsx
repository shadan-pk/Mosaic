import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [config, setConfig] = useState({
        rows: 3,
        cols: 3,
        videoUrl: '',
        isPlaying: false,
        currentTime: 0,
        volume: 1,
        displayMode: 'matrix' // 'matrix' or 'duplicate'
    });
    const [screens, setScreens] = useState([]);
    const [screenInfo, setScreenInfo] = useState(null);
    const [viewport, setViewport] = useState(null);

    useEffect(() => {
        // Connect to server - in development use localhost:3001
        // Connect to server - dynamically determine URL based on current hostname
        // This allows it to work on both localhost and network IPs
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const serverUrl = `${protocol}//${hostname}:3001`;

        const newSocket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        newSocket.on('config:update', (newConfig) => {
            setConfig(prev => ({ ...prev, ...newConfig }));
        });

        newSocket.on('screens:update', (newScreens) => {
            setScreens(newScreens);
        });

        newSocket.on('video:sync', (syncData) => {
            setConfig(prev => ({ ...prev, ...syncData }));
        });

        newSocket.on('position:assigned', ({ position, viewport }) => {
            setScreenInfo(prev => prev ? { ...prev, position, status: 'assigned' } : prev);
            setViewport(viewport);
        });

        newSocket.on('position:unassigned', () => {
            setScreenInfo(prev => prev ? { ...prev, position: null, status: 'unassigned' } : prev);
            setViewport(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    // Register as client screen
    const registerScreen = useCallback(() => {
        return new Promise((resolve) => {
            if (socket) {
                socket.emit('screen:register', (screen) => {
                    setScreenInfo(screen);
                    resolve(screen);
                });
            }
        });
    }, [socket]);

    // Assign screen to position (admin action)
    const assignScreen = useCallback((socketId, row, col) => {
        if (socket) {
            socket.emit('screen:assign', { socketId, row, col });
        }
    }, [socket]);

    // Unassign screen (admin action)
    const unassignScreen = useCallback((socketId) => {
        if (socket) {
            socket.emit('screen:unassign', { socketId });
        }
    }, [socket]);

    // Update config (admin action)
    const updateConfig = useCallback((newConfig) => {
        if (socket) {
            socket.emit('config:update', newConfig);
        }
    }, [socket]);

    // Video controls
    const setVideoUrl = useCallback((url) => {
        if (socket) {
            socket.emit('video:url', url);
        }
    }, [socket]);

    const playVideo = useCallback(() => {
        if (socket) {
            socket.emit('video:play');
        }
    }, [socket]);

    const pauseVideo = useCallback(() => {
        if (socket) {
            socket.emit('video:pause');
        }
    }, [socket]);

    const seekVideo = useCallback((time) => {
        if (socket) {
            socket.emit('video:seek', time);
        }
    }, [socket]);

    const reportTime = useCallback((time) => {
        if (socket) {
            socket.emit('video:timeUpdate', time);
        }
    }, [socket]);

    const value = {
        socket,
        isConnected,
        config,
        screens,
        screenInfo,
        viewport,
        registerScreen,
        assignScreen,
        unassignScreen,
        updateConfig,
        setVideoUrl,
        playVideo,
        pauseVideo,
        seekVideo,
        reportTime
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
