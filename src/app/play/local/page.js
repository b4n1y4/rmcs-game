"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getShuffledRoles, ROLES } from '@/lib/gameLogic';
import Chit from '@/components/Chit';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function LocalGame() {
  const router = useRouter();
  
  const [phase, setPhase] = useState('SETUP'); 
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);

  const [players, setPlayers] = useState([
    { id: 0, name: 'Player 1', role: null, score: 0, roundScore: 0 },
    { id: 1, name: 'Player 2', role: null, score: 0, roundScore: 0 },
    { id: 2, name: 'Player 3', role: null, score: 0, roundScore: 0 },
    { id: 3, name: 'Player 4', role: null, score: 0, roundScore: 0 },
  ]);
  
  const [unassignedChits, setUnassignedChits] = useState([]);
  const [currentPickerIndex, setCurrentPickerIndex] = useState(0);
  const [tempRevealId, setTempRevealId] = useState(null); 
  const [revealedRoles, setRevealedRoles] = useState({}); 
  const [roundResult, setRoundResult] = useState(null);

  const startGame = () => {
    setCurrentRound(1);
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    startRound();
  };

  const startRound = () => {
    setUnassignedChits(getShuffledRoles());
    setPlayers(prev => prev.map(p => ({ ...p, role: null, roundScore: 0 })));
    setRevealedRoles({});
    setCurrentPickerIndex(0);
    setTempRevealId(null);
    setRoundResult(null);
    setPhase('INTERSTITIAL');
  };

  const handleNameChange = (id, newName) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const pickChit = (index) => {
    if (phase !== 'DISTRIBUTE' || tempRevealId !== null) return;
    
    const role = unassignedChits[index];
    const newUnassigned = [...unassignedChits];
    newUnassigned.splice(index, 1);
    setUnassignedChits(newUnassigned);

    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[currentPickerIndex].role = role;
      return newPlayers;
    });

    setTempRevealId(currentPickerIndex);
  };

  const confirmMemorized = () => {
      setTempRevealId(null);
      if (currentPickerIndex + 1 < 4) {
        setCurrentPickerIndex(prev => prev + 1);
        setPhase('INTERSTITIAL');
      } else {
        setPhase('REVEAL_RAJA');
        autoRevealRaja();
      }
  }

  const autoRevealRaja = () => {
       setTimeout(() => {
          setPlayers(currPlayers => {
              const raja = currPlayers.find(p => p.role?.id === 'RAJA');
              if (raja) {
                setRevealedRoles(prev => ({ ...prev, [raja.id]: 'RAJA' }));
              }
              return currPlayers;
          });
       }, 500);
  };

  const revealMantri = () => {
     const mantri = players.find(p => p.role?.id === 'MANTRI');
     if (mantri) {
        setRevealedRoles(prev => ({ ...prev, [mantri.id]: 'MANTRI' }));
     }
     setPhase('GUESS_CHOR');
  }

  const handleMantraGuess = (targetPlayerId) => {
    if (phase !== 'GUESS_CHOR') return;

    const targetPlayer = players.find(p => p.id === targetPlayerId);
    let isCorrect = targetPlayer.role.id === 'CHOR';
    
    const newRevealed = {};
    players.forEach(p => newRevealed[p.id] = p.role.id);
    setRevealedRoles(newRevealed);

    const finalScores = players.map(p => {
       let added = 0;
       if (p.role.id === 'RAJA') added = ROLES.RAJA.points;
       if (p.role.id === 'SIPAHI') added = ROLES.SIPAHI.points;
       if (p.role.id === 'MANTRI') added = isCorrect ? ROLES.MANTRI.points : 0;
       if (p.role.id === 'CHOR') added = isCorrect ? 0 : 800;
       return { ...p, score: p.score + added, roundScore: added };
    });
    setPlayers(finalScores);
    setRoundResult({ isCorrect });
    setPhase('RESULT');
  };

  const advanceRound = () => {
     if (maxRounds !== -1 && currentRound >= maxRounds) {
        setPhase('GAME_OVER');
     } else {
        setCurrentRound(prev => prev + 1);
        startRound();
     }
  }

  if (phase === 'SETUP') {
    return (
      <div className="page-container">
        <button className="btn-secondary" onClick={() => router.push('/')} style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <main className="main-content" style={{ alignItems: 'center' }}>
          <motion.div className="glass-panel" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Pass & Play Setup</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
               <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--accent-gold)' }}>Number of Rounds</label>
               <select 
                 value={maxRounds} 
                 onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                 style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: 'white', fontFamily: 'inherit' }}
               >
                 <option value={3}>3 Rounds</option>
                 <option value={5}>5 Rounds</option>
                 <option value={10}>10 Rounds</option>
                 <option value={-1}>Unlimited Rounds</option>
               </select>
            </div>

            {players.map((p, i) => (
               <div key={p.id} style={{ marginBottom: '0.75rem' }}>
                 <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', color: 'var(--accent-gold)' }}>Player {i + 1}</label>
                 <input 
                   type="text" 
                   value={p.name}
                   onChange={(e) => handleNameChange(p.id, e.target.value)}
                   style={{
                     width: '100%', padding: '10px', borderRadius: '8px', 
                     background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white',
                     fontFamily: 'inherit'
                   }}
                 />
               </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={startGame}>
              Start Game
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (phase === 'GAME_OVER') {
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
                      {i+1}. {p.name}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{p.score} pts</span>
                  </div>
               ))}
               <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setPhase('SETUP')}>
                  Play Again
               </button>
            </div>
         </main>
       </div>
     )
  }

  if (phase === 'INTERSTITIAL') {
     return (
       <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <motion.div className="glass-panel" style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', textAlign: 'center', maxWidth: '90vw' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
             <h2 style={{ fontSize: 'clamp(1.3rem, 5vw, 2rem)', marginBottom: '1rem' }}>Pass device to <span className="text-gradient">{players[currentPickerIndex].name}</span></h2>
             <p style={{ opacity: 0.8, marginBottom: '2rem', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>Make sure no one else is looking!</p>
             <button className="btn-primary" onClick={() => setPhase('DISTRIBUTE')}>I&apos;m Ready</button>
          </motion.div>
       </div>
     )
  }

  return (
    <div className="page-container">
      <div className="game-header">
        <button className="btn-secondary" onClick={() => router.push('/')} style={{ padding: '8px 14px', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Exit
        </button>
        <div style={{ fontWeight: 'bold', color: 'var(--accent-gold)', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
           {maxRounds === -1 ? `Round ${currentRound}` : `Round ${currentRound} / ${maxRounds}`}
        </div>
        <div className="scoreboard">
          {players.map(p => (
            <div key={p.id} className="scoreboard-item">
              <div className="name">{p.name}</div>
              <div className="score">{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="main-content" style={{ alignItems: 'center', justifyContent: 'flex-start', marginTop: '1rem' }}>
        <div className="phase-text">
          {phase === 'DISTRIBUTE' && (
            <motion.h2 key="dist" className="text-gradient phase-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {tempRevealId !== null 
                 ? `${players[currentPickerIndex].name}, memorize your role!` 
                 : `${players[currentPickerIndex].name}'s turn to pick a chit`}
            </motion.h2>
          )}
          {phase === 'REVEAL_RAJA' && (
            <motion.div key="raja" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-gradient phase-title">Raja Revealed!</h2>
              <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>The Raja must command the Mantri to reveal themselves.</p>
              <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={revealMantri}>
                &quot;Mera Mantri Kaun?&quot;
              </button>
            </motion.div>
          )}
          {phase === 'GUESS_CHOR' && (
             <motion.div key="guess" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h2 className="text-gradient phase-title">Mantri&apos;s Turn</h2>
               <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Select a player to guess if they are the Chor!</p>
             </motion.div>
          )}
          {phase === 'RESULT' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h2 className="text-gradient" style={{ fontSize: 'clamp(1.4rem, 5vw, 2.5rem)' }}>
                 {roundResult?.isCorrect ? 'Mantri Guessed Right! 🎉' : 'Mantri Got Fooled! 😭'}
              </h2>
              <p style={{ marginTop: '0.75rem', fontSize: 'clamp(0.85rem, 2.5vw, 1.1rem)' }}>
                 Chor gains {roundResult?.isCorrect ? '0' : '800'} points. <br/>
                 Mantri gains {roundResult?.isCorrect ? '800' : '0'} points.
              </p>
            </motion.div>
          )}
        </div>

        <div className="chits-row">
          {phase === 'DISTRIBUTE' ? (
            unassignedChits.map((role, i) => (
              <Chit 
                key={i} 
                isRevealed={false} 
                tempReveal={tempRevealId === currentPickerIndex}
                role={tempRevealId !== null ? players[currentPickerIndex].role : role} 
                label={`Chit ${i+1}`}
                onClick={() => pickChit(i)} 
                disabled={tempRevealId !== null}
              />
            ))
          ) : (
            players.map((p) => {
              const isRevealed = !!revealedRoles[p.id] || phase === 'RESULT';
              const isTargetable = phase === 'GUESS_CHOR' && !isRevealed;
              return (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Chit 
                    isRevealed={isRevealed} 
                    role={p.role} 
                    ownerName={p.name}
                    onClick={isTargetable ? () => handleMantraGuess(p.id) : undefined}
                    disabled={!isTargetable}
                    highlight={isTargetable}
                  />
                  {phase === 'RESULT' && (
                     <div style={{ color: p.roundScore > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 'bold', fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                       +{p.roundScore}
                     </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {tempRevealId !== null && phase === 'DISTRIBUTE' && (
           <div style={{ marginTop: '2rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
             <button className="btn-primary" onClick={confirmMemorized}>
               Done (Pass Device)
             </button>
           </div>
        )}

        {phase === 'RESULT' && (
           <div style={{ marginTop: '2.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={advanceRound}>
              {maxRounds !== -1 && currentRound >= maxRounds ? 'Finish Game' : 'Next Round'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
