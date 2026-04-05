// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/main.js
// Rôle    : Point d'entrée de l'application Phaser 3.
//           Configure le moteur de jeu et monte les scènes.
// ─────────────────────────────────────────────────────────────────────────────
 
import BootScene  from './scenes/BootScene.js';
import WorldScene from './scenes/WorldScene.js';
import UIScene    from './scenes/UIScene.js';
 
// ── Dimensions de base (référence logique) ───────────────────────────────────
// Phaser va adapter ces valeurs à l'écran réel via Scale Manager.
const BASE_WIDTH  = 800;
const BASE_HEIGHT = 480;
 
// ── Configuration principale de Phaser ───────────────────────────────────────
const config = {
  type: Phaser.AUTO,          // AUTO : utilise WebGL si dispo, sinon Canvas
  parent: 'game-container',   // ID du div HTML qui reçoit le canvas
  width:  BASE_WIDTH,
  height: BASE_HEIGHT,
 
  backgroundColor: '#1a1040', // Fond visible pendant les transitions
 
  // ── Pixel Art : ESSENTIEL pour un rendu net sans flou ──────────────────
  pixelArt:    true,
  roundPixels: true,          // Arrondit les positions pour éviter l'aliasing
 
  // ── Scale Manager (responsive mobile) ──────────────────────────────────
  scale: {
    mode:        Phaser.Scale.FIT,          // Étire en conservant le ratio
    autoCenter:  Phaser.Scale.CENTER_BOTH,  // Centré horizontalement ET verticalement
    width:       BASE_WIDTH,
    height:      BASE_HEIGHT,
    // Écoute les rotations d'écran sur mobile
    expandParent: true,
  },
 
  // ── Physique (pas utilisée pour l'instant, gardée pour extensions futures) ──
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
 
  // ── Gestion des entrées : tactile activé ────────────────────────────────
  input: {
    touch:             true,
    activePointers:    2,   // 2 doigts pour le pinch-to-zoom
    smoothFactor:      0,   // Pas de lissage (important pour le pixel art)
  },
 
  // ── Scènes (ordre = ordre de démarrage) ─────────────────────────────────
  // BootScene  : chargement des assets
  // WorldScene : monde principal (city builder)
  // UIScene    : HUD superposé (toujours actif)
  scene: [BootScene, WorldScene, UIScene],
 
  // ── Audio ────────────────────────────────────────────────────────────────
  audio: {
    disableWebAudio: false,
    noAudio: false,
  },
};
 
// ── Création de l'instance Phaser ─────────────────────────────────────────────
const game = new Phaser.Game(config);
 
// ── Exposition globale pour débogage en développement ────────────────────────
// Permet d'accéder à `window.game` depuis la console du navigateur
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  window.game = game;
  console.log('[DEBUG] Instance Phaser exposée sur window.game');
}
 
// ── Masquer l'écran de chargement HTML une fois Phaser prêt ──────────────────
// L'événement 'ready' est émis après le premier rendu
game.events.once('ready', () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    // Supprime l'élément après la transition CSS (0.5s)
    setTimeout(() => loadingScreen.remove(), 600);
  }
});
 
export default game;