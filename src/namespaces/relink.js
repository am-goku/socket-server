// Relink namespace event handlers

export default function setupRelinkNamespace(namespace) {
  // Store connected users: userId -> socketId
  const onlineUsers = new Map();

  namespace.on('connection', (socket) => {
    console.log('[Relink] New client connected:', socket.id);

    socket.on('register', (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log('[Relink] User registered:', userId);
    });

    socket.on('check-online', (userId, callback) => {
      const isOnline = onlineUsers.has(userId);
      callback(isOnline);
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`[Relink] Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on('join-rooms', (roomIds) => {
      if (Array.isArray(roomIds)) {
        roomIds.forEach((roomId) => {
          socket.join(roomId);
          console.log(`[Relink] Socket ${socket.id} joined room ${roomId}`);
        });
      }
    });

    socket.on('send-message', ({ toUserId, roomId, message }) => {
      if (roomId) {
        socket.to(roomId).emit("receive-message", {
          from: socket.id,
          roomId,
          message,
        });
        socket.emit("receive-message", { from: socket.id, roomId, message });
      }
    });

    socket.on('typing', ({ toUserId, roomId }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (roomId) {
        socket.to(roomId).emit('typing', { from: socket.id, roomId });
      } else if (toSocketId) {
        namespace.to(toSocketId).emit('typing', { from: socket.id });
      }
    });

    socket.on('disconnect', () => {
      console.log('[Relink] Socket disconnected:', socket.id);
      for (let [userId, sId] of onlineUsers.entries()) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
}
