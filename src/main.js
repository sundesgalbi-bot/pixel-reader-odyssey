/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Point d'entrée principal
 *  src/main.js
 *
 *  Configure Phaser 3 avec :
 *   - Mode Pixel Art (antialiasing désactivé)
 *   - Redimensionnement responsive (Scale Manager)
 *   - Chargement de toutes les scènes
 * ════════════════════════════════════════════════════════════
 */
 
import { BootScene }  from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { UIScene }    from './scenes/UIScene.js';
import { BookScene }  from './scenes/BookScene.js';
 
// ── Dimensions de référence du monde de jeu ──────────────────
// On travaille en paysage, résolution "rétro" pour pixel art net
const GAME_WIDTH  = 800;
const GAME_HEIGHT = 480;
 
// ── Configuration principale de Phaser ───────────────────────
const config = {
  type: Phaser.AUTO,         // Utilise WebGL si dispo, sinon Canvas
 
  width:  GAME_WIDTH,
  height: GAME_HEIGHT,
 
  backgroundColor: '#1a1a2e',
 
  parent: 'game-container',  // ID du div conteneur dans index.html
 
  // ── Mode Pixel Art ───────────────────────────────────────
  // Désactive tous les filtres de lissage pour un rendu pixel net
  pixelArt: true,
  antialias: false,
  antialiasGL: false,
  roundPixels: true,         // Arrondit les positions pour éviter le flou
 
  // ── Système de redimensionnement responsive ──────────────
  scale: {
    mode:        Phaser.Scale.FIT,         // Remplit l'écran en conservant le ratio
    autoCenter:  Phaser.Scale.CENTER_BOTH, // Centre horizontalement et verticalement
    width:       GAME_WIDTH,
    height:      GAME_HEIGHT,
 
    // Listener pour le changement d'orientation (portrait → paysage)
    // Phaser gère ça automatiquement avec FIT
  },
 
  // ── Physique (arcade légère pour les animations futures) ──
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug:   false,
    },
  },
 
  // ── Déclaration de toutes les scènes ─────────────────────
  scene: [
    BootScene,   // 1. Chargement des assets + écran d'accueil
    WorldScene,  // 2. Le monde principal (grille + bâtiments)
    UIScene,     // 3. Interface HUD superposée
    BookScene,   // 4. Bibliothèque personnelle (liste des livres)
  ],
};
 
// ── Lancement du jeu ─────────────────────────────────────────
export const game = new Phaser.Game(config);
 
// ── Masquer l'écran de chargement HTML une fois Phaser prêt ──
// On écoute l'événement 'ready' de Phaser
game.events.once('ready', () => {
  console.log('[Main] Phaser ready event reçu');
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    // Supprime le nœud après la transition CSS
    setTimeout(() => loadingScreen.remove(), 600);
  }
});