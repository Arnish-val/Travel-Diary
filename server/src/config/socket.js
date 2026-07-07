'use strict';
const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const init = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'New WebSocket connection established');

    // Join room for collaborative planning
    socket.on('join_trip_planner', (plannedTripId) => {
      const room = `trip-plan-${plannedTripId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, room }, 'Socket joined collaborative planner room');
    });

    // Leave room
    socket.on('leave_trip_planner', (plannedTripId) => {
      const room = `trip-plan-${plannedTripId}`;
      socket.leave(room);
      logger.info({ socketId: socket.id, room }, 'Socket left collaborative planner room');
    });

    // Broadcast checklist updates
    socket.on('checklist_update', ({ plannedTripId, action, item }) => {
      const room = `trip-plan-${plannedTripId}`;
      // Broadcast to everyone else in the room
      socket.to(room).emit('checklist_changed', { action, item });
      logger.debug({ room, action, itemId: item.id }, 'Broadcasted checklist change to room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'WebSocket connection closed');
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { init, getIO };
