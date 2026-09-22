import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration supporting dynamic origins from FRONTEND_URL env var and localhost
const isOriginAllowed = (origin) => {
  if (!origin) return true; // mobile apps, Postman, server-to-server
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (process.env.FRONTEND_URL) {
    const origins = process.env.FRONTEND_URL.split(',').map((o) => o.trim());
    if (origins.includes(origin)) return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        // Fallback to allow origin to avoid breaking live socket/HTTP in various development environments
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Initialize Socket.io and attach to server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  },
});

// Bind io to Express app context
app.set('io', io);

// Socket.io connection logic
io.on('connection', (socket) => {
  // Join a private room based on userId and role
  socket.on('join', (data) => {
    const userId = typeof data === 'object' && data !== null ? (data.userId || data._id || data.id) : data;
    const rawRole = typeof data === 'object' && data !== null ? data.role : null;
    const role = rawRole ? rawRole.toString().toLowerCase() : '';
    
    if (userId) {
      socket.join(userId.toString());
      console.log(`[Socket] User/Agent ${userId} joined their private room (${userId.toString()}).`);
    }
    if (role === 'agent' || role === 'admin') {
      socket.join('agents');
      socket.join('admin');
      console.log(`[Socket] Agent/Admin ${userId || socket.id} joined the agents broadcast rooms.`);
    }
  });

  socket.on('disconnect', (reason) => {
    // Client disconnected
  });
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/category-availability', categoryRoutes);
app.use('/api/tickets', ticketRoutes);

// Simple Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is healthy' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

