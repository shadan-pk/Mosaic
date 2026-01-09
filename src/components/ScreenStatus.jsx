import React from 'react';

const ScreenStatus = ({ screens }) => {
    const assignedScreens = screens.filter(s => s.status === 'assigned');
    const unassignedScreens = screens.filter(s => s.status === 'unassigned');

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    return (
        <div className="screen-status">
            <h2>Screen Status</h2>

            <div className="status-summary">
                <div className="summary-item">
                    <span className="summary-value">{screens.length}</span>
                    <span className="summary-label">Total Connected</span>
                </div>
                <div className="summary-item">
                    <span className="summary-value">{assignedScreens.length}</span>
                    <span className="summary-label">Assigned</span>
                </div>
                <div className="summary-item">
                    <span className="summary-value">{unassignedScreens.length}</span>
                    <span className="summary-label">Waiting</span>
                </div>
            </div>

            <div className="screen-list">
                <h3>All Screens</h3>
                {screens.length === 0 ? (
                    <p className="no-screens">No screens connected yet</p>
                ) : (
                    <ul>
                        {screens.map(screen => (
                            <li key={screen.socketId} className={`screen-item ${screen.status}`}>
                                <div className="screen-item-main">
                                    <span className={`status-indicator ${screen.status}`}></span>
                                    <span className="screen-id">{screen.id}</span>
                                </div>
                                <div className="screen-item-details">
                                    {screen.position ? (
                                        <span className="position">
                                            Pos: {screen.position.row + 1},{screen.position.col + 1}
                                        </span>
                                    ) : (
                                        <span className="position unassigned">Unassigned</span>
                                    )}
                                    <span className="connected-at">
                                        {formatTime(screen.connectedAt)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ScreenStatus;
