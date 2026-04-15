const rooms = new Map();

const ROLES = {
  RAJA: { id: 'RAJA', name: 'Raja', points: 1000 },
  MANTRI: { id: 'MANTRI', name: 'Mantri', points: 800 },
  SIPAHI: { id: 'SIPAHI', name: 'Sipahi', points: 500 },
  CHOR: { id: 'CHOR', name: 'Chor', points: 0 }
};

function setupGameSocket(io) {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('join_room', ({ roomId, playerName }) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          players: [],
          state: 'LOBBY', 
          maxRounds: 3,
          currentRound: 1,
          roundState: null
        });
      }
      
      const room = rooms.get(roomId);
      
      if (room.state !== 'LOBBY' && room.state !== 'GAME_OVER') {
        socket.emit('error', 'Game already in progress');
        return;
      }
      
      if (room.players.length >= 4) {
        socket.emit('error', 'Room is full');
        return;
      }

      const isCreator = room.players.length === 0;

      room.players.push({
        id: socket.id,
        name: playerName || `Player ${room.players.length + 1}`,
        score: 0,
        roundScore: 0,
        ready: false,
        role: null,
        isCreator
      });

      io.to(roomId).emit('room_update', getSanitizedRoom(room));
    });

    socket.on('update_settings', ({ roomId, maxRounds }) => {
        const room = rooms.get(roomId);
        if(!room || room.state !== 'LOBBY') return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.isCreator) {
            room.maxRounds = maxRounds;
            io.to(roomId).emit('room_update', getSanitizedRoom(room));
        }
    });

    socket.on('toggle_ready', (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      const player = room.players.find(p => p.id === socket.id);
      if (player && room.state === 'LOBBY') {
        player.ready = !player.ready;
        io.to(roomId).emit('room_update', getSanitizedRoom(room));

        if (room.players.length === 4 && room.players.every(p => p.ready)) {
          // Reset game state for fresh start from lobby
          room.currentRound = 1;
          room.players.forEach(p => p.score = 0);
          startNewRound(roomId, io);
        }
      }
    });

    socket.on('pick_chit', ({ roomId, chitIndex }) => {
      const room = rooms.get(roomId);
      if(!room || room.state !== 'PLAYING' || room.roundState.phase !== 'PICKING_CHITS') return;

      if (room.roundState.turnOrder[room.roundState.currentTurnIndex] !== socket.id) return; // not your turn
      if (room.roundState.unassignedChits[chitIndex] === null) return; // already picked

      const role = room.roundState.unassignedChits[chitIndex];
      room.roundState.unassignedChits[chitIndex] = null; // Blank it out

      const player = room.players.find(p => p.id === socket.id);
      player.role = role;
      
      // Notify them privately what they picked
      io.to(socket.id).emit('your_role', role);

      // Advance turn
      room.roundState.currentTurnIndex++;

      if (room.roundState.currentTurnIndex >= 4) {
          // All picked! Transition to REVEAL_RAJA
          setTimeout(() => {
              room.roundState.phase = 'REVEAL_RAJA';
              room.roundState.revealed.push('RAJA'); // Auto reveal
              io.to(roomId).emit('room_update', getSanitizedRoom(room));
          }, 1000);
      }
      
      io.to(roomId).emit('room_update', getSanitizedRoom(room));
    });

    socket.on('reveal_mantri', (roomId) => {
      const room = rooms.get(roomId);
      if(!room || room.state !== 'PLAYING') return;
      
      if (!room.roundState.revealed.includes('MANTRI')) {
        room.roundState.revealed.push('MANTRI');
        room.roundState.phase = 'GUESS_CHOR';
        io.to(roomId).emit('room_update', getSanitizedRoom(room));
      }
    });

    socket.on('make_guess', ({ roomId, targetId }) => {
      const room = rooms.get(roomId);
      if(!room || room.state !== 'PLAYING') return;

      const targetPlayer = room.players.find(p => p.id === targetId);
      const isCorrect = targetPlayer.role.id === 'CHOR';
      
      // Update scores
      room.players.forEach(p => {
         let added = 0;
         if (p.role.id === 'RAJA') added = ROLES.RAJA.points;
         if (p.role.id === 'SIPAHI') added = ROLES.SIPAHI.points;
         if (p.role.id === 'MANTRI') added = isCorrect ? ROLES.MANTRI.points : 0;
         if (p.role.id === 'CHOR') added = isCorrect ? 0 : 800; // Chor wins 800 if Mantri misses
         p.score += added;
         p.roundScore = added;
      });

      room.state = 'ROUND_RESULT';
      room.roundState.isCorrect = isCorrect;
      
      io.to(roomId).emit('room_update', room);
    });

    socket.on('next_round', (roomId) => {
        const room = rooms.get(roomId);
        if(!room) return;

        if (room.maxRounds !== -1 && room.currentRound >= room.maxRounds) {
            room.state = 'GAME_OVER';
            io.to(roomId).emit('room_update', getSanitizedRoom(room));
        } else {
            room.currentRound++;
            startNewRound(roomId, io);
        }
    });

    socket.on('return_to_lobby', (roomId) => {
        const room = rooms.get(roomId);
        if(!room) return;
        room.state = 'LOBBY';
        room.players.forEach(p => { p.ready = false; p.roundScore = 0; p.role = null; p.score = 0; });
        io.to(roomId).emit('room_update', getSanitizedRoom(room));
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      for (const [roomId, room] of rooms.entries()) {
        const index = room.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          const wasCreator = room.players[index].isCreator;
          room.players.splice(index, 1);
          
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            if (wasCreator) room.players[0].isCreator = true; // pass creator ownership
            room.state = 'LOBBY';
            room.players.forEach(p => p.ready = false);
            io.to(roomId).emit('room_update', getSanitizedRoom(room));
          }
        }
      }
    });
  });
}

function startNewRound(roomId, io) {
  const room = rooms.get(roomId);
  room.state = 'PLAYING';
  
  const roles = [ROLES.RAJA, ROLES.MANTRI, ROLES.SIPAHI, ROLES.CHOR];
  for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Generate a random turn order
  const turnOrderIds = room.players.map(p => p.id);
  for (let i = turnOrderIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [turnOrderIds[i], turnOrderIds[j]] = [turnOrderIds[j], turnOrderIds[i]];
  }

  room.players.forEach((p) => {
    p.role = null;
    p.roundScore = 0;
  });

  room.roundState = {
    phase: 'PICKING_CHITS', 
    unassignedChits: roles, // Array of 4 roles. When picked, it becomes null.
    turnOrder: turnOrderIds,
    currentTurnIndex: 0,
    revealed: [], 
    isCorrect: null
  }

  io.to(roomId).emit('room_update', getSanitizedRoom(room));
}

function getSanitizedRoom(room) {
  if (room.state === 'ROUND_RESULT' || room.state === 'GAME_OVER') return room;

  // Clone to avoid mutating original
  const clone = JSON.parse(JSON.stringify(room));

  if (clone.state === 'PLAYING') {
      // Hide roles of players
      clone.players.forEach(p => {
          const isRevealed = p.role && clone.roundState.revealed.includes(p.role.id);
          if (!isRevealed) {
              p.role = null;
          }
      });
      // Hide unassigned chits (turn them to generic objects with an index id, but no role info)
      if (clone.roundState.phase === 'PICKING_CHITS') {
          clone.roundState.unassignedChits = clone.roundState.unassignedChits.map((c, i) => c ? true : null); 
          // true means available, null means taken
      }
  }

  return clone;
}

module.exports = setupGameSocket;
