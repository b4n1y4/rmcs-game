"use client";
import { motion, AnimatePresence } from 'framer-motion';

export default function Chit({ 
  isRevealed, 
  role, 
  onClick, 
  disabled, 
  highlight, 
  ownerName, 
  tempReveal = false,
  label
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {label && <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 'bold' }}>{label}</div>}
      <motion.button
        className={`glass-panel chit-card`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: disabled ? 'default' : 'pointer',
          padding: '0.75rem',
          border: highlight ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
          boxShadow: highlight ? '0 0 20px var(--accent-gold-glow)' : '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
        }}
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { y: -5, scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <AnimatePresence mode="wait">
          {(isRevealed || tempReveal) && role ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ textAlign: 'center' }}
            >
              <div className="chit-icon">{role.icon}</div>
              <div className="chit-name" style={{ fontWeight: 'bold', color: role.color }}>{role.name}</div>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="chit-icon" style={{ opacity: 0.3 }}>?</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      {ownerName && (
        <div className="chit-owner">
          {ownerName}
        </div>
      )}
    </div>
  );
}
