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
  maxHttpBufferSize: 1e7 // 10MB para audios/imágenes
});

// Guardar usuarios activos por sala
const usersInRooms = {};

io.on('connection', (socket) => {
  
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!usersInRooms[room]) {
      usersInRooms[room] = [];
    }
    
    // Agregar usuario si no está en la lista
    if (!usersInRooms[room].includes(username)) {
      usersInRooms[room].push(username);
    }

    console.log(`${username} se unió a ${room}`);

    // Avisar a todos los miembros de la sala sobre la nueva lista de usuarios
    io.to(room).emit('roomUsers', usersInRooms[room]);
  });

  socket.on('chatMessage', (data) => {
    io.to(data.room).emit('message', data);
  });

  socket.on('disconnect', () => {
    const { username, room } = socket;
    if (room && usersInRooms[room]) {
      usersInRooms[room] = usersInRooms[room].filter(u => u !== username);
      io.to(room).emit('roomUsers', usersInRooms[room]);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
