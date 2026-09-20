const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const usersInRooms = {};

io.on('connection', (socket) => {
  
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!usersInRooms[room]) {
      usersInRooms[room] = [];
    }
    
    usersInRooms[room].push({ id: socket.id, username });

    // Notifica a la sala el refresco de usuarios
    io.to(room).emit('roomUsers', {
      users: usersInRooms[room]
    });
  });

  socket.on('chatMessage', (data) => {
    // Si data.targets tiene IDs, redirigir solo a esos destinatarios + al emisor
    if (data.targets && data.targets.length > 0) {
      // Enviar al emisor para visualizarlo en su propia pantalla
      socket.emit('message', data);

      // Enviar de forma aislada a los destinatarios especificados
      data.targets.forEach(targetSocketId => {
        io.to(targetSocketId).emit('message', data);
      });
    } else {
      // Enviar de forma pública a toda la sala
      io.to(data.room).emit('message', data);
    }
  });

  socket.on('disconnect', () => {
    const room = socket.room;
    if (room && usersInRooms[room]) {
      usersInRooms[room] = usersInRooms[room].filter(u => u.id !== socket.id);
      io.to(room).emit('roomUsers', {
        users: usersInRooms[room]
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));