"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Chit from '@/components/Chit';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ fontSize: '0.95rem' }}>{selectedOption.label}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
           <ChevronDown size={18} opacity={0.7} />
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', zIndex: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            {options.map((opt) => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '0.95rem', background: value === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'transparent', color: value === opt.value ? 'var(--accent-gold)' : 'white', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function OnlineGame() {
  const router = useRouter();
  
  const [socket, setSocket] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [myId, setMyId] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const prevPhaseRef = useRef(null);
  
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setMyId(newSocket.id);
    });

    newSocket.on('room_update', (room) => {
      setRoomState(room);
      setErrorMsg('');
    });

    newSocket.on('your_role', (role) => {
      setMyRole(role);
    });

    newSocket.on('error', (err) => {
      setErrorMsg(err);
      setIsJoined(false);
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    const currentPhase = roomState?.roundState?.phase;
    const currentState = roomState?.state;

    if (currentState === 'LOBBY' || currentState === 'GAME_OVER') {
      setMyRole(null);
    } else if (currentPhase === 'PICKING_CHITS' && prevPhaseRef.current !== 'PICKING_CHITS') {
      setMyRole(null);
    }

    prevPhaseRef.current = currentPhase;
  }, [roomState]);

  const handleJoin = () => {
    if (!playerName) return setErrorMsg('Enter a name');
    const code = roomCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    socket.emit('join_room', { roomId: code, playerName });
    setIsJoined(true);
  };

  const toggleReady = () => socket && socket.emit('toggle_ready', roomState.id);
  const revealMantri = () => socket && socket.emit('reveal_mantri', roomState.id);
  const makeGuess = (targetId) => socket && socket.emit('make_guess', { roomId: roomState.id, targetId });
  const playAgain = () => socket && socket.emit('next_round', roomState.id);
  const returnToLobby = () => socket && socket.emit('return_to_lobby', roomState.id);
  const updateRounds = (val) => socket && socket.emit('update_settings', { roomId: roomState.id, maxRounds: val});
  const pickChit = (index) => socket && socket.emit('pick_chit', { roomId: roomState.id, chitIndex: index });

  if (!isJoined || !roomState) {
    return (
      <div className="page-container">
        <button className="btn-secondary" onClick={() => router.push('/')} style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <main className="main-content" style={{ alignItems: 'center' }}>
          <motion.div className="glass-panel" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Join Match</h2>
            
            {errorMsg && <div style={{ color: 'var(--accent-red)', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{errorMsg}</div>}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--accent-gold)' }}>Your Name</label>
              <input 
                type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--accent-gold)' }}>Room Code (leave empty to create)</label>
              <input 
                type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit', textTransform: 'uppercase' }}
              />
            </div>
            
            <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleJoin}>
              Join / Create Room
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  const { state, players, roundState, maxRounds, currentRound } = roomState;
  const me = players.find(p => p.id === myId);

  // --- GAME OVER VIEW ---
  if (state === 'GAME_OVER') {
     const sortedPlayers = [...players].sort((a,b) => b.score - a.score);
     return (
       <div className="page-container">
         <main className="main-content" style={{ alignItems: 'center' }}>
            <Trophy size={48} style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }} />
            <h1 className="text-gradient" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '1.5rem' }}>Game Over</h1>
            
            <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', width: '100%', maxWidth: '400px' }}>
               {sortedPlayers.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: i < 3 ? '1px solid var(--glass-border)': 'none' }}>
                    <span style={{ fontWeight: i===0 ? 'bold':'normal', color: i===0 ? 'var(--accent-gold)': 'white' }}>
                      {i+1}. {p.name} {p.id===myId && '(You)'}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{p.score} pts</span>
                  </div>
               ))}
               <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={returnToLobby}>
                  Return to Lobby
               </button>
            </div>
         </main>
       </div>
     )
  }

  // --- LOBBY VIEW ---
  if (state === 'LOBBY') {
    return (
      <div className="page-container">
        <main className="main-content" style={{ alignItems: 'center' }}>
           <h1 className="text-gradient" style={{ fontSize: 'clamp(1.8rem, 6vw, 3rem)', marginBottom: '0.5rem' }}>Room {roomState.id}</h1>
           <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Invite friends using this code.</p>

           <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', width: '100%', maxWidth: '600px' }}>
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px' }}>
                 <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-gold)' }}>Game Settings</label>
                 {me?.isCreator ? (
                    <CustomSelect
                      value={maxRounds}
                      onChange={(val) => updateRounds(val)}
                      options={[
                        { value: 3, label: '3 Rounds' },
                        { value: 5, label: '5 Rounds' },
                        { value: 10, label: '10 Rounds' },
                        { value: -1, label: 'Unlimited Rounds' }
                      ]}
                    />
                 ) : (
                    <div style={{ padding: '10px', border: '1px solid var(--glass-border)', borderRadius: '8px', opacity: 0.8, fontSize: '0.9rem' }}>
                       {maxRounds === -1 ? 'Unlimited Rounds' : `${maxRounds} Rounds Game`} (Only Host can change)
                    </div>
                 )}
              </div>

              <div className="lobby-grid">
                 {Array.from({ length: 4 }).map((_, i) => {
                    const p = players[i];
                    return (
                      <div key={i} className="lobby-slot">
                         {p ? (
                           <>
                             <span>{p.name} {p.id === myId && '(You)'} {p.isCreator && '👑'}</span>
                             {p.ready ? <span style={{ color: 'var(--accent-green)' }}>READY</span> : <span style={{ opacity: 0.5 }}>Waiting..</span>}
                           </>
                         ) : (
                           <span style={{ opacity: 0.3 }}>Waiting...</span>
                         )}
                      </div>
                    )
                 })}
              </div>
              <button 
                className={me?.ready ? "btn-secondary" : "btn-primary"} 
                style={{ width: '100%' }} onClick={toggleReady}
              >
                 {me?.ready ? 'Unready' : 'Ready Up'}
              </button>
           </div>
        </main>
      </div>
    )
  }

  // --- GAME VIEW ---
  const isPlayerMantri = myRole?.id === 'MANTRI';
  const isPlayerRaja = myRole?.id === 'RAJA';

  const isMyPickingTurn = roundState?.phase === 'PICKING_CHITS' && roundState?.turnOrder?.[roundState?.currentTurnIndex] === myId;
  const currentPickingPlayer = roundState?.phase === 'PICKING_CHITS' ? players.find(p => p.id === roundState?.turnOrder?.[roundState?.currentTurnIndex]) : null;

  return (
    <div className="page-container">
      <div className="game-header">
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.75rem', borderRadius: '8px', color: 'var(--accent-gold)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
           Room: {roomState.id}
        </div>
        <div style={{ fontWeight: 'bold', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
           {maxRounds === -1 ? `Round ${currentRound}` : `Round ${currentRound} / ${maxRounds}`}
        </div>
        <div className="scoreboard">
          {players.map(p => (
            <div key={p.id} className="scoreboard-item">
              <div className="name">{p.name} {p.id===myId && '(You)'}</div>
              <div className="score">{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="main-content" style={{ alignItems: 'center', justifyContent: 'flex-start', marginTop: '1rem' }}>
        {/* Role badge */}
        {myRole && state !== 'ROUND_RESULT' && (
           <div className="role-badge" style={{ position: 'absolute', top: '100px', left: '20px' }}>
              <div className="label">You are</div>
              <div className="value">{myRole.name}</div>
           </div>
        )}

        <div className="phase-text">
          {roundState?.phase === 'PICKING_CHITS' && state !== 'ROUND_RESULT' && (
             <motion.div key="picking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h2 className="text-gradient phase-title">Pick a Chit!</h2>
               {isMyPickingTurn ? (
                  <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--accent-gold)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>It&apos;s your turn to pick a chit!</p>
               ) : (
                  <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Waiting for {currentPickingPlayer?.name || '...'} to pick...</p>
               )}
             </motion.div>
          )}

          {roundState?.phase === 'REVEAL_RAJA' && state !== 'ROUND_RESULT' && (
            <motion.div key="raja" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gradient phase-title">Raja Revealed!</h2>
              {isPlayerRaja ? (
                 <>
                   <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>You are the Raja! Command your Mantri.</p>
                   <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={revealMantri}>
                     &quot;Mera Mantri Kaun?&quot;
                   </button>
                 </>
              ) : (
                <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Waiting for Raja to command the Mantri...</p>
              )}
            </motion.div>
          )}
          {roundState?.phase === 'GUESS_CHOR' && state !== 'ROUND_RESULT' && (
             <motion.div key="guess" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h2 className="text-gradient phase-title">Mantri&apos;s Turn</h2>
               {isPlayerMantri ? (
                 <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>You are the Mantri! Select a player to guess if they are the Chor!</p>
               ) : (
                 <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Waiting for the Mantri to make a guess...</p>
               )}
             </motion.div>
          )}
          {state === 'ROUND_RESULT' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="text-gradient" style={{ fontSize: 'clamp(1.4rem, 5vw, 2.5rem)' }}>
                 {roundState?.isCorrect ? 'Mantri Guessed Right! 🎉' : 'Mantri Got Fooled! 😭'}
              </h2>
              <p style={{ marginTop: '0.75rem', fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)' }}>
                 Chor gains {roundState?.isCorrect ? '0' : '800'} points. <br/>
                 Mantri gains {roundState?.isCorrect ? '800' : '0'} points.
              </p>
            </motion.div>
          )}
        </div>

        <div className="chits-row">
          {roundState?.phase === 'PICKING_CHITS' && state !== 'ROUND_RESULT' ? (
             (roundState.unassignedChits || []).map((isAvailable, i) => {
               if (!isAvailable) return (
                 <div key={i} className="chit-taken">Taken</div>
               );
               
               return (
                 <Chit 
                   key={i} 
                   isRevealed={false} 
                   role={null} 
                   label={`Chit ${i+1}`}
                   onClick={isMyPickingTurn ? () => pickChit(i) : undefined} 
                   disabled={!isMyPickingTurn}
                   highlight={isMyPickingTurn}
                 />
               );
             })
          ) : (
            players.map((p) => {
              const serverRevealed = p.role !== null; 
              const isMe = p.id === myId;
              const showActualCard = serverRevealed || isMe;
              
              const roleToRender = serverRevealed ? p.role : (isMe ? myRole : null);
              const isTargetable = roundState?.phase === 'GUESS_CHOR' && state !== 'ROUND_RESULT' && !serverRevealed && isPlayerMantri && !isMe;
              
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Chit 
                    isRevealed={showActualCard} 
                    role={roleToRender} 
                    ownerName={p.name + (isMe ? ' (You)' : '')}
                    onClick={isTargetable ? () => makeGuess(p.id) : undefined}
                    disabled={!isTargetable}
                    highlight={isTargetable}
                  />
                  {state === 'ROUND_RESULT' && (
                     <div style={{ color: p.roundScore > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                       +{p.roundScore}
                     </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {state === 'ROUND_RESULT' && me?.isCreator && (
          <button className="btn-primary" style={{ marginTop: '2.5rem' }} onClick={playAgain}>
             {maxRounds !== -1 && currentRound >= maxRounds ? 'Finish Game' : 'Next Round'}
          </button>
        )}
        {state === 'ROUND_RESULT' && !me?.isCreator && (
          <p style={{ marginTop: '2.5rem', opacity: 0.6, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Waiting for host to continue...</p>
        )}
      </main>
    </div>
  );
}
