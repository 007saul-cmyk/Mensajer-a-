const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e7 // Límite para subir imágenes/audios (10MB)
});

io.on('connection', (socket) => {
  
  // Unirse a una sala específica
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    console.log(`${username} se unió a la sala: ${room}`);
  });

  // Reenviar mensaje en tiempo real a todos en la misma sala
  socket.on('chatMessage', (data) => {
    io.to(data.room).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});