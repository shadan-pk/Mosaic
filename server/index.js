import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import ScreenManager from './screenManager.js';

import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Settings file path
const settingsPath = path.join(__dirname, 'settings.json');
let settings = {};

// Load settings if exist
if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    if (settings.cloudinary && settings.cloudinary.cloud_name) {
      cloudinary.config(settings.cloudinary);
      console.log('Cloudinary configured from settings');
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
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
app.post('/api/settings/cloud', async (req, res) => {
  const { cloudName, apiKey, apiSecret } = req.body;
  
  if (!cloudName || !apiKey || !apiSecret) {
    // Check if clearing settings
    if (req.body.clear) {
      delete settings.cloudinary;
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      return res.json({ message: 'Cloudinary settings cleared', type: 'local' });
    }
    return res.status(400).json({ error: 'Missing Cloudinary credentials' });
  }

  const newSettings = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  };

  try {
    // Verify config by setting it temporary
    cloudinary.config(newSettings);
    
    // Test the connection
    await cloudinary.api.ping();
    
    // If ping successful, save to settings
    settings.cloudinary = newSettings;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    res.json({ message: 'Cloudinary connected successfully', type: 'cloud' });
  } catch (error) {
    console.error('Cloudinary verification failed:', error);
    res.status(500).json({ error: 'Verification failed: Invalid credentials or network error' });
  }
});

app.get('/api/settings/cloud', (req, res) => {
  const isConfigured = !!(settings.cloudinary && settings.cloudinary.cloud_name && settings.cloudinary.api_key);
  res.json({
    configured: isConfigured,
    cloudName: isConfigured ? settings.cloudinary.cloud_name : null
  });
});

// Video Manifest file path
const videosManifestPath = path.join(__dirname, 'videos.json');
let videoManifest = [];

// Load manifest if exists
if (fs.existsSync(videosManifestPath)) {
  try {
    videoManifest = JSON.parse(fs.readFileSync(videosManifestPath, 'utf8'));
  } catch (err) {
    console.error('Error loading video manifest:', err);
  }
}

// ... existing code ...

app.post('/api/videos/clear', (req, res) => {
  try {
    // Clear in-memory manifest
    videoManifest = [];
    
    // Write empty array to file
    fs.writeFileSync(videosManifestPath, JSON.stringify(videoManifest, null, 2));
    
    console.log('[Manifest] Video cache cleared');
    res.json({ message: 'Video cache cleared successfully', count: 0 });
  } catch (error) {
    console.error('Error clearing video manifest:', error);
    res.status(500).json({ error: 'Failed to clear video cache' });
  }
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filename = req.file.originalname;
  const size = req.file.size;
  
  console.log(`[Upload] Processing file: ${filename} (${size} bytes)`);

  // Check manifest for existing video
  // We match by filename AND size to be relatively sure it's the same video
  const existingVideo = videoManifest.find(v => v.filename === filename && v.size === size);

  if (existingVideo) {
    console.log(`[Manifest] Found existing video for ${filename}, returning URL: ${existingVideo.url}`);
    // Remove the temp upload
    try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch(e) { console.error('Error deleting temp file:', e); }

    return res.json({ url: existingVideo.url, source: 'manifest' });
  }

  // Check if Cloudinary is configured
  if (settings.cloudinary) {
    try {
      console.log(`[Cloudinary] Starting upload for ${filename}...`);
      
      // Use original filename (sanitized) for public_id to keep it readable and stable
      const safeName = path.parse(filename).name.replace(/[^a-zA-Z0-9-_]/g, '_');
      const publicId = `multiscreen/${safeName}`;

      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'video',
        public_id: publicId,
        overwrite: true 
      });

      // Remove local file after successful upload
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch(e) { console.error('Error deleting temp file:', e); }

      const videoData = {
        id: result.public_id,
        filename: filename,
        size: size,
        url: result.secure_url,
        provider: 'cloudinary',
        uploadedAt: new Date().toISOString()
      };

      // Add to manifest and save
      videoManifest.push(videoData);
      fs.writeFileSync(videosManifestPath, JSON.stringify(videoManifest, null, 2));

      console.log(`[Cloudinary] Upload success: ${result.secure_url}`);
      return res.json({ url: result.secure_url });
    } catch (error) {
      console.error('[Cloudinary] Upload failed, falling back to local storage:', error);
      // Fall back to local storage if Cloudinary fails
      const videoData = {
        filename: filename,
        size: size,
        url: `/uploads/${req.file.filename}`,
        provider: 'local',
        uploadedAt: new Date().toISOString()
      };

      // Add to manifest and save
      videoManifest.push(videoData);
      fs.writeFileSync(videosManifestPath, JSON.stringify(videoManifest, null, 2));

      console.log('[Local] Cloudinary failed, using local storage:', `/uploads/${req.file.filename}`);
      return res.json({ url: `/uploads/${req.file.filename}`, fallback: true, provider: 'local' });
    }
  }
  
  // Local fallback
  console.log('[Local] Using local storage');
  const videoData = {
    filename: filename,
    size: size,
    url: `/uploads/${req.file.filename}`,
    provider: 'local',
    uploadedAt: new Date().toISOString()
  };

  // Add to manifest and save
  videoManifest.push(videoData);
  fs.writeFileSync(videosManifestPath, JSON.stringify(videoManifest, null, 2));

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, provider: 'local' });
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
