"use client";
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Bot, Gamepad2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="page-container">
      <main className="main-content" style={{ alignItems: 'center', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: 'clamp(2.2rem, 8vw, 4rem)', marginBottom: '1rem', fontWeight: '800', lineHeight: 1.1 }}>
            Raja Mantri <br />
            <span className="text-gradient">Chor Sipahi</span>
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.2rem)', color: 'var(--foreground)', opacity: 0.8, marginBottom: '3rem' }}>
            The classic game of bluffing and deduction, reimagined.
          </p>
        </motion.div>

        <motion.div 
          className="glass-panel" 
          style={{ padding: 'clamp(1.5rem, 4vw, 3rem)', display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '400px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button 
            className="btn-primary" 
            onClick={() => router.push('/play/local')}
          >
            <Gamepad2 size={22} />
            Pass & Play
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => router.push('/play/bot')}
          >
            <Bot size={22} />
            Play vs Bots
          </button>

          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '0.5rem 0' }} />

          <button 
            className="btn-secondary" 
            style={{ color: 'var(--accent-gold)', borderColor: 'var(--accent-gold-glow)' }}
            onClick={() => router.push('/play/online')}
          >
            <Users size={22} />
            Online Multiplayer
          </button>
        </motion.div>
      </main>
    </div>
  );
}
