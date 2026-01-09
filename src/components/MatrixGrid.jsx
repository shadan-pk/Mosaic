import React from 'react';

const MatrixGrid = ({ rows, cols, screens, onDrop, onDragOver, onUnassign, draggedScreen }) => {
    const getScreenAtPosition = (row, col) => {
        return screens.find(s => s.position && s.position.row === row && s.position.col === col);
    };

    const renderCell = (row, col) => {
        const screen = getScreenAtPosition(row, col);
        const cellId = `cell-${row}-${col}`;

        return (
            <div
                key={cellId}
                className={`matrix-cell ${screen ? 'occupied' : 'empty'} ${draggedScreen ? 'droppable' : ''}`}
                onDrop={(e) => onDrop(e, row, col)}
                onDragOver={onDragOver}
            >
                {screen ? (
                    <div className="cell-content assigned">
                        <span className="cell-position">{row + 1},{col + 1}</span>
                        <span className="cell-screen-id">{screen.id}</span>
                        <div className="cell-status online"></div>
                        <button
                            className="btn-unassign"
                            onClick={() => onUnassign(screen.socketId)}
                            title="Remove from matrix"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <div className="cell-content empty">
                        <span className="cell-position">{row + 1},{col + 1}</span>
                        <span className="cell-hint">Drop here</span>
                    </div>
                )}
            </div>
        );
    };

    const gridStyle = {
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`
    };

    return (
        <div className="matrix-grid-container">
            <div className="matrix-grid" style={gridStyle}>
                {Array.from({ length: rows }, (_, row) =>
                    Array.from({ length: cols }, (_, col) => renderCell(row, col))
                )}
            </div>
            <div className="matrix-legend">
                <div className="legend-item">
                    <span className="legend-dot online"></span>
                    <span>Connected & Assigned</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot empty"></span>
                    <span>Empty Position</span>
                </div>
            </div>
        </div>
    );
};

export default MatrixGrid;
