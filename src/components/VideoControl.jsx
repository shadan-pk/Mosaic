import React, { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const VideoControl = () => {
    const { config, setVideoUrl, playVideo, pauseVideo, seekVideo, updateConfig } = useSocket();
    const [urlInput, setUrlInput] = useState(config.videoUrl || '');
    const [showPreview, setShowPreview] = useState(false);
    const previewRef = useRef(null);

    const handleLoadVideo = () => {
        if (urlInput.trim()) {
            setVideoUrl(urlInput.trim());
        }
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        seekVideo(time);
        if (previewRef.current) {
            previewRef.current.currentTime = time;
        }
    };

    const handlePreviewTimeUpdate = () => {
        if (previewRef.current && config.isPlaying) {
            // Keep preview in sync during playback
        }
    };

    const handleDisplayModeChange = (mode) => {
        updateConfig({ displayMode: mode });
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const sampleVideos = [
        { name: 'Big Buck Bunny', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
        { name: 'Elephant Dream', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
        { name: 'Sintel', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' }
    ];

    return (
        <div className="video-control">
            <h2>Video Control</h2>

            {/* Display Mode Toggle */}
            <div className="display-mode-section">
                <span className="mode-label">Display Mode:</span>
                <div className="mode-toggle">
                    <button
                        className={`mode-btn ${config.displayMode === 'matrix' ? 'active' : ''}`}
                        onClick={() => handleDisplayModeChange('matrix')}
                    >
                        <span className="mode-icon">🖼️</span>
                        <span className="mode-text">Matrix</span>
                        <span className="mode-desc">One video across all screens</span>
                    </button>
                    <button
                        className={`mode-btn ${config.displayMode === 'duplicate' ? 'active' : ''}`}
                        onClick={() => handleDisplayModeChange('duplicate')}
                    >
                        <span className="mode-icon">📺</span>
                        <span className="mode-text">Duplicate</span>
                        <span className="mode-desc">Same video on each screen</span>
                    </button>
                </div>
            </div>

            <div className="video-url-section">
                <div className="upload-section">
                    <h3>Upload Local Video</h3>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                const formData = new FormData();
                                formData.append('video', e.target.files[0]);

                                // Determine server URL dynamically
                                const protocol = window.location.protocol;
                                const hostname = window.location.hostname;
                                const port = 3001; // Backend port
                                const uploadUrl = `${protocol}//${hostname}:${port}/api/upload`;

                                fetch(uploadUrl, {
                                    method: 'POST',
                                    body: formData
                                })
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.url) {
                                            // Construct full URL for the video
                                            const fullVideoUrl = `${protocol}//${hostname}:${port}${data.url}`;
                                            setUrlInput(fullVideoUrl);
                                            setVideoUrl(fullVideoUrl);
                                        }
                                    })
                                    .catch(err => console.error('Upload failed:', err));
                            }
                        }}
                    />
                </div>

                <div className="url-input-group">
                    <input
                        type="text"
                        placeholder="Enter video URL (MP4, WebM, etc.)"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLoadVideo()}
                    />
                    <button className="btn-load" onClick={handleLoadVideo}>
                        Load Video
                    </button>
                </div>

                <div className="sample-videos">
                    <span className="sample-label">Quick Load:</span>
                    {sampleVideos.map((video, i) => (
                        <button
                            key={i}
                            className="btn-sample"
                            onClick={() => {
                                setUrlInput(video.url);
                                setVideoUrl(video.url);
                            }}
                        >
                            {video.name}
                        </button>
                    ))}
                </div>
            </div>

            {config.videoUrl && (
                <>
                    <div className="preview-section">
                        <div className="preview-header">
                            <span>Preview</span>
                            <button
                                className="btn-toggle-preview"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                {showPreview ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {showPreview && (
                            <div className="preview-container">
                                <video
                                    ref={previewRef}
                                    src={config.videoUrl}
                                    onTimeUpdate={handlePreviewTimeUpdate}
                                    muted
                                />
                            </div>
                        )}
                    </div>

                    <div className="playback-controls">
                        <div className="transport-buttons">
                            <button
                                className={`btn-transport ${config.isPlaying ? 'playing' : ''}`}
                                onClick={() => config.isPlaying ? pauseVideo() : playVideo()}
                            >
                                {config.isPlaying ? (
                                    <span className="icon-pause">⏸</span>
                                ) : (
                                    <span className="icon-play">▶</span>
                                )}
                            </button>
                            <button
                                className="btn-transport"
                                onClick={() => seekVideo(0)}
                            >
                                <span className="icon-restart">⏮</span>
                            </button>
                        </div>

                        <div className="seek-bar">
                            <span className="time-current">{formatTime(config.currentTime)}</span>
                            <input
                                type="range"
                                min="0"
                                max={config.duration || 100}
                                step="0.1"
                                value={config.currentTime || 0}
                                onChange={handleSeek}
                            />
                            <span className="time-duration">{formatTime(config.duration || 0)}</span>
                        </div>

                        <div className="playback-status">
                            <span className={`status-badge ${config.isPlaying ? 'playing' : 'paused'}`}>
                                {config.isPlaying ? 'PLAYING' : 'PAUSED'}
                            </span>
                        </div>
                    </div>
                </>
            )}

            {!config.videoUrl && (
                <div className="no-video-loaded">
                    <span className="icon">🎬</span>
                    <p>Enter a video URL above to get started</p>
                </div>
            )}
        </div>
    );
};

export default VideoControl;
