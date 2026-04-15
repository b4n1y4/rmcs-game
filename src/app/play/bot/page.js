"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getShuffledRoles, ROLES } from '@/lib/gameLogic';
import Chit from '@/components/Chit';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Trophy } from 'lucide-react';

export default function BotGame() {
  const router = useRouter();
  
  const [phase, setPhase] = useState('SETUP'); 
  const [maxRounds, setMaxRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);

  const [players, setPlayers] = useState([
    { id: 0, name: 'You', isBot: false, role: null, score: 0, roundScore: 0 },
    { id: 1, name: 'Bot Alpha', isBot: true, role: null, score: 0, roundScore: 0 },
    { id: 2, name: 'Bot Beta', isBot: true, role: null, score: 0, roundScore: 0 },
    { id: 3, name: 'Bot Gamma', isBot: true, role: null, score: 0, roundScore: 0 },
  ]);
  
  const [revealedRoles, setRevealedRoles] = useState({}); 
  const [roundResult, setRoundResult] = useState(null);

  const startGame = () => {
    setCurrentRound(1);
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    startRound();
  };

  const startRound = () => {
    const roles = getShuffledRoles();
    setPlayers(prev => prev.map((p, i) => ({ ...p, role: roles[i], roundScore: 0 })));
    setRevealedRoles({});
    setRoundResult(null);
    setPhase('REVEAL_RAJA');
  };

  useEffect(() => {
     if (phase === 'REVEAL_RAJA') {
         const raja = players.find(p => p.role?.id === 'RAJA');
         if (raja && !revealedRoles[raja.id]) {
            const timer = setTimeout(() => {
               setRevealedRoles(prev => ({ ...prev, [raja.id]: 'RAJA' }));
            }, 500);
            return () => clearTimeout(timer);
         }
         
         if (raja?.isBot && revealedRoles[raja.id]) {
            const timer = setTimeout(() => {
               revealMantri();
            }, 1000);
            return () => clearTimeout(timer);
         }
     }
  }, [phase, players, revealedRoles]);

  const revealMantri = () => {
     const mantri = players.find(p => p.role?.id === 'MANTRI');
     if (mantri) {
        setRevealedRoles(prev => ({ ...prev, [mantri.id]: 'MANTRI' }));
     }
     setPhase('GUESS_CHOR');
  }

  useEffect(() => {
     if (phase === 'GUESS_CHOR') {
         const mantri = players.find(p => p.role?.id === 'MANTRI');
         if (mantri?.isBot && revealedRoles[mantri.id] && !roundResult) {
            const timer = setTimeout(() => {
               const unrevealed = players.filter(p => !revealedRoles[p.id]);
               if (unrevealed.length > 0) {
                   const randomGuess = unrevealed[Math.floor(Math.random() * unrevealed.length)];
                   handleMantraGuess(randomGuess.id);
               }
            }, 1500);
            return () => clearTimeout(timer);
         }
     }
  }, [phase, players, revealedRoles, roundResult]);

  const handleMantraGuess = (targetPlayerId) => {
    if (phase !== 'GUESS_CHOR') return;

    setPlayers(currPlayers => {
      const targetPlayer = currPlayers.find(p => p.id === targetPlayerId);
      const isCorrect = targetPlayer.role.id === 'CHOR';
      
      const newRevealed = {};
      currPlayers.forEach(p => newRevealed[p.id] = p.role.id);
      setRevealedRoles(newRevealed);
  
      const finalScores = currPlayers.map(p => {
         let added = 0;
         if (p.role.id === 'RAJA') added = ROLES.RAJA.points;
         if (p.role.id === 'SIPAHI') added = ROLES.SIPAHI.points;
         if (p.role.id === 'MANTRI') added = isCorrect ? ROLES.MANTRI.points : 0;
         if (p.role.id === 'CHOR') added = isCorrect ? 0 : 800;
         return { ...p, score: p.score + added, roundScore: added };
      });
      setRoundResult({ isCorrect });
      setPhase('RESULT');
      return finalScores;
    });
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
          <motion.div className="glass-panel" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <Bot size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '1.5rem', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Play vs Bots</h2>
            
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

            <p style={{ opacity: 0.8, marginBottom: '2rem', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>
              You will be matched against 3 AI opponents. <br/> Roles are distributed completely randomly.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={startGame}>
              Start Match
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

  const isPlayerMantri = players.find(p => p.role?.id === 'MANTRI' && !p.isBot);
  const isPlayerRaja = players.find(p => p.role?.id === 'RAJA' && !p.isBot);

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
              <div className="name">{p.name} {p.isBot && '🤖'}</div>
              <div className="score">{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="main-content" style={{ alignItems: 'center', justifyContent: 'flex-start', marginTop: '1rem' }}>
        <div className="phase-text">
          {phase === 'REVEAL_RAJA' && (
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
          {phase === 'GUESS_CHOR' && (
             <motion.div key="guess" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <h2 className="text-gradient phase-title">Mantri&apos;s Turn</h2>
               {isPlayerMantri ? (
                 <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>You are the Mantri! Select a player to guess if they are the Chor!</p>
               ) : (
                 <p style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>Waiting for the Mantri to make a guess...</p>
               )}
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
          {players.map((p) => {
            const isRevealed = !!revealedRoles[p.id] || phase === 'RESULT';
            const isPlayerSelf = !p.isBot;
            const showActualCard = isRevealed || isPlayerSelf;
            
            const isTargetable = phase === 'GUESS_CHOR' && !isRevealed && isPlayerMantri;
            
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Chit 
                  isRevealed={showActualCard} 
                  role={p.role} 
                  ownerName={p.name + (p.isBot ? ' 🤖' : ' (You)')}
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
          })}
        </div>

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
