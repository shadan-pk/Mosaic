import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import ScreenManager from './screenManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but prepend timestamp to avoid collisions
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const screenManager = new ScreenManager();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files in production
app.use(express.static(path.join(__dirname, '../dist')));
// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// API Routes
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Return the URL relative to the server root
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.get('/api/config', (req, res) => {
  res.json(screenManager.getConfig());
});

app.post('/api/config', (req, res) => {
  const config = screenManager.updateConfig(req.body);
  io.emit('config:update', config);
  io.emit('screens:update', screenManager.getAllScreens());
  res.json(config);
});

app.get('/api/screens', (req, res) => {
  res.json(screenManager.getAllScreens());
});

app.get('/api/matrix', (req, res) => {
  res.json(screenManager.getMatrixState());
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle screen registration
  socket.on('screen:register', (callback) => {
    const screen = screenManager.registerScreen(socket.id);
    console.log(`Screen registered: ${screen.id}`);
    
    // Send screen info to the client
    if (callback) callback(screen);
    
    // Notify admin of new screen
    io.emit('screens:update', screenManager.getAllScreens());
    
    // Send current config
    socket.emit('config:update', screenManager.getConfig());
  });

  // Handle position assignment from admin
  socket.on('screen:assign', ({ socketId, row, col }) => {
    const screen = screenManager.assignPosition(socketId, row, col);
    if (screen) {
      console.log(`Screen ${screen.id} assigned to position (${row}, ${col})`);
      
      // Notify the specific client of their assignment
      const viewport = screenManager.calculateViewport(row, col);
      io.to(socketId).emit('position:assigned', { position: { row, col }, viewport });
      
      // Update all admins
      io.emit('screens:update', screenManager.getAllScreens());
      io.emit('matrix:update', screenManager.getMatrixState());
    }
  });

  // Handle position unassignment
  socket.on('screen:unassign', ({ socketId }) => {
    const screen = screenManager.unassignPosition(socketId);
    if (screen) {
      io.to(socketId).emit('position:unassigned');
      io.emit('screens:update', screenManager.getAllScreens());
      io.emit('matrix:update', screenManager.getMatrixState());
    }
  });

  // Handle video control commands from admin
  socket.on('video:control', (command) => {
    console.log('Video control:', command);
    const config = screenManager.updateConfig(command);
    io.emit('video:sync', config);
  });

  // Handle video URL update
  socket.on('video:url', (url) => {
    console.log('Video URL updated:', url);
    const config = screenManager.updateConfig({ videoUrl: url, currentTime: 0, isPlaying: false });
    io.emit('video:sync', config);
  });

  // Handle play command
  socket.on('video:play', () => {
    const config = screenManager.updateConfig({ isPlaying: true });
    io.emit('video:sync', config);
  });

  // Handle pause command
  socket.on('video:pause', () => {
    const config = screenManager.updateConfig({ isPlaying: false });
    io.emit('video:sync', config);
  });

  // Handle seek command
  socket.on('video:seek', (time) => {
    const config = screenManager.updateConfig({ currentTime: time });
    io.emit('video:sync', config);
  });

  // Handle time sync request (for keeping clients in sync)
  socket.on('video:timeUpdate', (time) => {
    const config = screenManager.updateConfig({ currentTime: time });
    // Broadcast occasional time updates so Admin UI stays in sync
    // We throttle this slightly on the client side (reporting every 2s)
    // so it's safe to broadcast here.
    io.emit('config:update', { currentTime: time });
  });

  // Handle duration update from client
  socket.on('video:duration', (duration) => {
    // Only update if duration is significantly different (e.g. > 1s)
    if (Math.abs(screenManager.getConfig().duration - duration) > 1) {
        console.log(`Video duration updated: ${duration}`);
        const config = screenManager.updateConfig({ duration });
        io.emit('config:update', config);
    }
  });

  // Handle config update from admin
  socket.on('config:update', (newConfig) => {
    const config = screenManager.updateConfig(newConfig);
    io.emit('config:update', config);
    io.emit('matrix:update', screenManager.getMatrixState());
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const screen = screenManager.removeScreen(socket.id);
    if (screen) {
      console.log(`Screen disconnected: ${screen.id}`);
      io.emit('screens:update', screenManager.getAllScreens());
      io.emit('matrix:update', screenManager.getMatrixState());
    }
  });
});

// Catch-all route for SPA (Express 5 compatible)
app.use((req, res, next) => {
  // Only serve HTML for non-API routes
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Log network IP for convenience
  import('os').then((os) => {
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach((ifaceName) => {
      interfaces[ifaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`🔌 Network Server: http://${iface.address}:${PORT}`);
        }
      });
    });
  });

  console.log(`📺 Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🖥️  Client Screen: http://localhost:${PORT}/client`);
});
