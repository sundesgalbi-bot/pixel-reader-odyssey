/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Configuration du jeu
 *  src/config/GameConfig.js
 *
 *  Constantes et fonctions utilitaires partagées
 *  dans tout le projet.
 * ════════════════════════════════════════════════════════════
 */

// ── Taille des tuiles (pixels) ─────────────────────────────
export const TILE_SIZE = 32;

// ── Configurations des bâtiments par genre ─────────────────
export const GENRE_BUILDINGS = {
  'Fantasy':        { height: 3, emoji: '⚔️',  label: 'Fantasy',        color: 0x8b4513, doorColor: 0x654321, roofColor: 0x2f1b14 },
  'Sci-Fi':         { height: 2, emoji: '🚀',  label: 'Science-Fiction', color: 0x708090, doorColor: 0x556b7f, roofColor: 0x2f4f4f },
  'Mystery':        { height: 2, emoji: '🔍',  label: 'Policier / Mystère', color: 0x2f2f2f, doorColor: 0x1a1a1a, roofColor: 0x000000 },
  'Romance':        { height: 1, emoji: '💖',  label: 'Romance',         color: 0xff69b4, doorColor: 0xff1493, roofColor: 0xdc143c },
  'Horror':         { height: 3, emoji: '👻',  label: 'Horreur',         color: 0x800080, doorColor: 0x4b0082, roofColor: 0x2e003e },
  'Historical':     { height: 2, emoji: '🏛️',  label: 'Historique',      color: 0xd2b48c, doorColor: 0x8b7355, roofColor: 0x696969 },
  'Biography':      { height: 1, emoji: '📖',  label: 'Biographie',      color: 0xdeb887, doorColor: 0xd2691e, roofColor: 0x8b4513 },
  'Self-Help':      { height: 1, emoji: '🌱',  label: 'Développement perso', color: 0x32cd32, doorColor: 0x228b22, roofColor: 0x006400 },
  'Other':          { height: 2, emoji: '📚',  label: 'Autre',            color: 0x808080, doorColor: 0x696969, roofColor: 0x2f2f2f },
};

// ── Calcul du niveau du joueur ────────────────────────────
/**
 * @param {number} xp – Points d'expérience totaux
 * @returns {{ level: number, xpForNext: number, levelName: string }}
 */
export function calculateLevel(xp) {
  const level = Math.floor(xp / 100) + 1;
  const xpForNext = level * 100;
  const xpThisLevel = xp - (level - 1) * 100;
  const xpToNext = xpForNext - xp;
  const progress = Math.max(0, Math.min(1, xpThisLevel / 100));
  const levelName = `Niveau ${level}`;
  return { level, xpForNext, levelName, xpThisLevel, xpToNext, progress };
}

// ── Calcul des récompenses pour un livre ──────────────────
/**
 * @param {number} pages – Nombre de pages
 * @param {number} rating – Note (1-5 étoiles)
 * @returns {{ xp: number, gold: number }}
 */
export function calculateRewards(pages, rating) {
  const baseXP = pages * 2;
  const ratingBonus = rating * 10;
  const xp = baseXP + ratingBonus;
  const gold = Math.floor(pages / 10) + rating;
  return { xp, gold };
}