// Screen Manager - Manages all connected screens and their state
class ScreenManager {
  constructor() {
    this.screens = new Map(); // socketId -> screen data
    this.config = {
      rows: 3,
      cols: 3,
      videoUrl: '',
      isPlaying: false,
      currentTime: 0,
      volume: 1,
      displayMode: 'matrix' // 'matrix' = one video across all screens, 'duplicate' = same video on each screen
    };
  }

  // Register a new screen
  registerScreen(socketId) {
    const screenId = this.generateScreenId();
    const screen = {
      id: screenId,
      socketId: socketId,
      position: null, // { row, col }
      status: 'unassigned',
      connectedAt: Date.now()
    };
    this.screens.set(socketId, screen);
    return screen;
  }

  // Generate unique screen ID
  generateScreenId() {
    return `SCR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Remove screen on disconnect
  removeScreen(socketId) {
    const screen = this.screens.get(socketId);
    this.screens.delete(socketId);
    return screen;
  }

  // Assign screen to matrix position
  assignPosition(socketId, row, col) {
    const screen = this.screens.get(socketId);
    if (!screen) return null;

    // Check if position is already occupied
    for (const [, s] of this.screens) {
      if (s.position && s.position.row === row && s.position.col === col && s.socketId !== socketId) {
        // Swap positions
        s.position = screen.position;
        s.status = screen.position ? 'assigned' : 'unassigned';
      }
    }

    screen.position = { row, col };
    screen.status = 'assigned';
    return screen;
  }

  // Unassign screen from position
  unassignPosition(socketId) {
    const screen = this.screens.get(socketId);
    if (!screen) return null;
    screen.position = null;
    screen.status = 'unassigned';
    return screen;
  }

  // Get all screens
  getAllScreens() {
    return Array.from(this.screens.values());
  }

  // Get screen by socket ID
  getScreen(socketId) {
    return this.screens.get(socketId);
  }

  // Get screen by position
  getScreenByPosition(row, col) {
    for (const [, screen] of this.screens) {
      if (screen.position && screen.position.row === row && screen.position.col === col) {
        return screen;
      }
    }
    return null;
  }

  // Update matrix configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Unassign screens outside new bounds
    for (const [socketId, screen] of this.screens) {
      if (screen.position) {
        if (screen.position.row >= this.config.rows || screen.position.col >= this.config.cols) {
          this.unassignPosition(socketId);
        }
      }
    }
    
    return this.config;
  }

  // Get current configuration
  getConfig() {
    return this.config;
  }

  // Calculate viewport for a specific position
  calculateViewport(row, col) {
    return {
      scaleX: this.config.cols,
      scaleY: this.config.rows,
      offsetX: -col * 100,
      offsetY: -row * 100
    };
  }

  // Get matrix state (for admin dashboard)
  getMatrixState() {
    const matrix = [];
    for (let r = 0; r < this.config.rows; r++) {
      const row = [];
      for (let c = 0; c < this.config.cols; c++) {
        const screen = this.getScreenByPosition(r, c);
        row.push(screen ? { ...screen, viewport: this.calculateViewport(r, c) } : null);
      }
      matrix.push(row);
    }
    return matrix;
  }
}

export default ScreenManager;
