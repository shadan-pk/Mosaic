import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const VideoPlayer = ({ viewport, videoUrl, isPlaying, currentTime, volume, displayMode }) => {
    const videoRef = useRef(null);
    const { reportTime, reportDuration, config } = useSocket();
    const [isBuffering, setIsBuffering] = useState(false);
    const [hasError, setHasError] = useState(false);
    const lastSyncTime = useRef(0);

    // Calculate the transform to show only this screen's portion
    const containerStyle = {
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000'
    };

    // In duplicate mode, show full video. In matrix mode, show portion based on viewport
    const videoStyle = displayMode === 'duplicate'
        ? {
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: 0,
            top: 0,
            objectFit: 'contain'
        }
        : {
            position: 'absolute',
            width: `${viewport.scaleX * 100}%`,
            height: `${viewport.scaleY * 100}%`,
            left: `${viewport.offsetX}%`,
            top: `${viewport.offsetY}%`,
            objectFit: 'cover'
        };

    // Sync playback state
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.play().catch(err => {
                console.error('Error playing video:', err);
                // Try muted playback (browser autoplay policy)
                video.muted = true;
                video.play().catch(e => console.error('Muted play failed:', e));
            });
        } else {
            video.pause();
        }
    }, [isPlaying]);

    // Sync current time
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const timeDiff = Math.abs(video.currentTime - currentTime);
        // Only sync if difference is greater than 0.5 seconds to avoid constant seeking
        if (timeDiff > 0.5) {
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    // Set volume
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            video.volume = volume;
        }
    }, [volume]);

    // Handle video events
    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) {
            // Report duration if it's valid and different from current config
            if (video.duration && Math.abs(video.duration - config.duration) > 1) {
                reportDuration(video.duration);
            }
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && isPlaying) {
            // Report time periodically (every 2 seconds) for sync
            if (video.currentTime - lastSyncTime.current > 2) {
                lastSyncTime.current = video.currentTime;
                reportTime(video.currentTime);
            }
        }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);
    const handleError = () => setHasError(true);

    if (hasError) {
        return (
            <div className="video-error">
                <span className="error-icon">⚠️</span>
                <h3>Video Error</h3>
                <p>Unable to load video</p>
            </div>
        );
    }

    return (
        <div style={containerStyle} className="video-player-container">
            <video
                ref={videoRef}
                src={videoUrl}
                style={videoStyle}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={handleWaiting}
                onPlaying={handlePlaying}
                onCanPlay={handleCanPlay}
                onError={handleError}
                playsInline
                preload="auto"
            />

            {isBuffering && (
                <div className="buffering-overlay">
                    <div className="buffering-spinner"></div>
                </div>
            )}

            {/* Display mode indicator */}
            <div className="mode-indicator">
                {displayMode === 'duplicate' ? '📺 Duplicate' : '🖼️ Matrix'}
            </div>
        </div>
    );
};

export default VideoPlayer;
