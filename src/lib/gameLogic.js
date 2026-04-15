export const ROLES = {
  RAJA: { id: 'RAJA', name: 'Raja', points: 1000, icon: '👑', color: 'var(--accent-gold)' },
  MANTRI: { id: 'MANTRI', name: 'Mantri', points: 800, icon: '🗡️', color: 'var(--primary)' },
  SIPAHI: { id: 'SIPAHI', name: 'Sipahi', points: 500, icon: '👮', color: 'var(--secondary)' },
  CHOR: { id: 'CHOR', name: 'Chor', points: 0, icon: '🎭', color: 'var(--accent-red)' }
};

export function getShuffledRoles() {
  const roles = [ROLES.RAJA, ROLES.MANTRI, ROLES.SIPAHI, ROLES.CHOR];
  for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}
