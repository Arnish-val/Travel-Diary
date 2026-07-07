import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to connect to Socket.io namespace and coordinate real-time updates.
 */
const useSocket = (plannedTripId, onChecklistChange) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!plannedTripId) return;

    // Establish WebSocket connection (points to server origin via proxy in dev)
    const socket = io('/', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    // Join room for collaborative planning
    socket.emit('join_trip_planner', plannedTripId);

    // Listen for broadcasted checklist modifications
    socket.on('checklist_changed', ({ action, item }) => {
      if (onChecklistChange) {
        onChecklistChange(action, item);
      }
    });

    return () => {
      socket.emit('leave_trip_planner', plannedTripId);
      socket.disconnect();
    };
  }, [plannedTripId, onChecklistChange]);

  const emitChecklistChange = (action, item) => {
    if (socketRef.current) {
      socketRef.current.emit('checklist_update', {
        plannedTripId,
        action,
        item,
      });
    }
  };

  return { emitChecklistChange };
};

export default useSocket;
