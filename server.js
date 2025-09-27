import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Adjust for your frontend domain
  },
});

// Store connected users: userId -> socketId
const onlineUsers = new Map();

// Socket connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Event: register user after login
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log('User registered:', userId);
  });

  // Event: check if user is online
  socket.on('check-online', (userId, callback) => {
    const isOnline = onlineUsers.has(userId);
    callback(isOnline); // send boolean response back
  });

  // Event: join a room
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Event: join multiple rooms
  socket.on('join-rooms', (roomIds) => {
    if (Array.isArray(roomIds)) {
      roomIds.forEach((roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
      });
    }
  });

  // Event: send message
  socket.on('send-message', ({ toUserId, roomId, message }) => {
    if (roomId) {
      socket.to(roomId).emit("receive-message", {
        from: socket.id,
        roomId, // <--- include the roomId
        message,
      });

      // echo back to sender too
      socket.emit("receive-message", { from: socket.id, roomId, message });
    }
  }); 

  // Event: typing
  socket.on('typing', ({ toUserId, roomId }) => {
    const toSocketId = onlineUsers.get(toUserId);
    if (roomId) {
      socket.to(roomId).emit('typing', { from: socket.id, roomId });
    } else if (toSocketId) {
      io.to(toSocketId).emit('typing', { from: socket.id });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    // Remove user from map
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
