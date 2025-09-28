import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import setupRelinkNamespace from './namespaces/relink.js';
import { PORT, CORS_ORIGIN } from './config.js';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
  },
});

// Setup relink namespace
const relinkNamespace = io.of('/relink');
setupRelinkNamespace(relinkNamespace);


server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
