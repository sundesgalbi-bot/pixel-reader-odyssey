// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/scenes/BootScene.js
// Rôle    : Première scène chargée. Génère les assets graphiques par programme
//           (via Canvas 2D) en attendant de vrais fichiers PNG pixel art.
//           Lance ensuite WorldScene + UIScene.
// ─────────────────────────────────────────────────────────────────────────────
 
import { GENRE_CONFIG } from '../data/GenreConfig.js';
import SaveSystem       from '../systems/SaveSystem.js';
 
export default class BootScene extends Phaser.Scene {
 
  constructor() {
    super('BootScene');
  }
 
  // ── Preload : génération procédurale des textures ─────────────────────────
  preload() {
    // Génère une texture de sol en damier pixel art
    this._createGroundTexture();
 
    // Génère une texture de bâtiment pour chaque genre
    for (const [genre, cfg] of Object.entries(GENRE_CONFIG)) {
      this._createBuildingTexture(genre, cfg.color, cfg.roofColor);
    }
 
    // Génère une texture de bâtiment "niveau évolué" (★★★+)
    for (const [genre, cfg] of Object.entries(GENRE_CONFIG)) {
      this._createEvolvedBuildingTexture(`${genre}_evolved`, cfg.color, cfg.roofColor);
    }
 
    // Génère des décorations simples
    this._createDecorationTextures();
 
    // Génère l'icône du bouton "+"
    this._createAddButtonTexture();
  }
 
  // ── Create : lancement des scènes principales ─────────────────────────────
  create() {
    console.log('[BootScene] Assets générés. Lancement du monde...');
 
    // Initialise la sauvegarde (crée un état vide si première visite)
    SaveSystem.init();
 
    // Lance la scène du monde (city builder)
    this.scene.start('WorldScene');
 
    // Lance la scène UI en parallèle (HUD superposé)
    this.scene.launch('UIScene');
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Méthodes privées — Génération procédurale des textures
  // ══════════════════════════════════════════════════════════════════════════
 
  /**
   * Crée une texture de sol en damier (style Tiled).
   * Deux tons de vert/brun pour simuler une herbe pixélisée.
   */
  _createGroundTexture() {
    const SIZE = 16; // Taille d'une tuile en pixels
    const gfx  = this.make.graphics({ add: false });
 
    // Couleurs alternées du damier
    const COLORS = [0x2d5a1b, 0x3a7023]; // Vert foncé / vert clair
 
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 2; col++) {
        gfx.fillStyle(COLORS[(row + col) % 2]);
        gfx.fillRect(col * SIZE, row * SIZE, SIZE, SIZE);
      }
    }
 
    // Ajoute quelques pixels de texture
    gfx.fillStyle(0x4a8c2a, 0.4);
    gfx.fillRect(4, 2, 2, 2);
    gfx.fillRect(18, 10, 2, 2);
    gfx.fillRect(10, 20, 2, 2);
    gfx.fillRect(26, 26, 2, 2);
 
    gfx.generateTexture('ground', SIZE * 2, SIZE * 2);
    gfx.destroy();
  }
 
  /**
   * Génère un bâtiment pixel art simple (niveau 1-2) pour un genre donné.
   * @param {string} key       - Clé de la texture dans le cache Phaser
   * @param {number} wallColor - Couleur hexadécimale des murs
   * @param {number} roofColor - Couleur hexadécimale du toit
   */
  _createBuildingTexture(key, wallColor, roofColor) {
    const W = 32; // Largeur du sprite
    const H = 40; // Hauteur du sprite
    const gfx = this.make.graphics({ add: false });
 
    // ── Ombre portée ─────────────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillRect(4, H - 4, W - 4, 4);
 
    // ── Corps du bâtiment ─────────────────────────────────────────────────
    gfx.fillStyle(wallColor);
    gfx.fillRect(2, 16, W - 4, H - 20);
 
    // ── Toit triangulaire ─────────────────────────────────────────────────
    gfx.fillStyle(roofColor);
    gfx.fillTriangle(
      W / 2, 2,    // Sommet
      0, 18,       // Coin bas gauche
      W, 18        // Coin bas droit
    );
 
    // ── Fenêtres ──────────────────────────────────────────────────────────
    gfx.fillStyle(0xF2E68A, 0.9); // Lumière jaune chaude
    gfx.fillRect(6, 22, 6, 6);   // Fenêtre gauche
    gfx.fillRect(W - 12, 22, 6, 6); // Fenêtre droite
 
    // Reflet de fenêtre (pixel unique blanc)
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillRect(7, 23, 2, 2);
    gfx.fillRect(W - 11, 23, 2, 2);
 
    // ── Porte ────────────────────────────────────────────────────────────
    gfx.fillStyle(0x3d2a1a);
    gfx.fillRect(W / 2 - 3, H - 12, 6, 10);
 
    // ── Contour du bâtiment ───────────────────────────────────────────────
    gfx.lineStyle(1, 0x000000, 0.3);
    gfx.strokeRect(2, 16, W - 4, H - 20);
 
    gfx.generateTexture(key, W, H);
    gfx.destroy();
  }
 
  /**
   * Génère une version évoluée du bâtiment (plus grand, avec tour).
   */
  _createEvolvedBuildingTexture(key, wallColor, roofColor) {
    const W = 48;
    const H = 56;
    const gfx = this.make.graphics({ add: false });
 
    // Corps principal
    gfx.fillStyle(wallColor);
    gfx.fillRect(4, 24, W - 8, H - 28);
 
    // Tour centrale
    const lighterWall = Phaser.Display.Color.IntegerToColor(wallColor);
    lighterWall.lighten(20);
    gfx.fillStyle(lighterWall.color);
    gfx.fillRect(W / 2 - 7, 12, 14, H - 16);
 
    // Grand toit
    gfx.fillStyle(roofColor);
    gfx.fillTriangle(W / 2, 2, 2, 26, W - 2, 26);
 
    // Petit toit de la tour
    gfx.fillTriangle(W / 2, 6, W / 2 - 8, 14, W / 2 + 8, 14);
 
    // Fenêtres (plus nombreuses)
    gfx.fillStyle(0xF2E68A, 0.9);
    gfx.fillRect(8, 30, 5, 5);
    gfx.fillRect(W - 13, 30, 5, 5);
    gfx.fillRect(8, 40, 5, 5);
    gfx.fillRect(W - 13, 40, 5, 5);
    gfx.fillRect(W / 2 - 3, 18, 6, 6); // Fenêtre de tour
 
    // Porte
    gfx.fillStyle(0x3d2a1a);
    gfx.fillRect(W / 2 - 4, H - 14, 8, 13);
 
    // Étoile décorative (bâtiment évolué)
    gfx.fillStyle(0xF2A623);
    gfx.fillRect(W / 2 - 2, 2, 4, 4);
 
    gfx.generateTexture(key, W, H);
    gfx.destroy();
  }
 
  /**
   * Génère des textures de décoration : arbres, fontaine, chemin.
   */
  _createDecorationTextures() {
    // ── Arbre ────────────────────────────────────────────────────────────
    const tree = this.make.graphics({ add: false });
    tree.fillStyle(0x4a2700); tree.fillRect(6, 20, 4, 10); // Tronc
    tree.fillStyle(0x2d6b1b); tree.fillCircle(8, 14, 10);  // Feuillage bas
    tree.fillStyle(0x3a8c24); tree.fillCircle(8, 8,  7);   // Feuillage milieu
    tree.fillStyle(0x4aad2e); tree.fillCircle(8, 4,  4);   // Pointe
    tree.generateTexture('tree', 16, 32);
    tree.destroy();
 
    // ── Fontaine ─────────────────────────────────────────────────────────
    const fountain = this.make.graphics({ add: false });
    fountain.fillStyle(0x888888); fountain.fillRect(4, 16, 24, 8);  // Base
    fountain.fillStyle(0x666666); fountain.fillRect(8, 12, 16, 6);  // Bassin
    fountain.fillStyle(0x378ADD, 0.8); fountain.fillRect(10, 14, 12, 4); // Eau
    fountain.fillStyle(0x85B7EB); fountain.fillRect(14, 8, 4, 8);   // Jet
    fountain.generateTexture('fountain', 32, 24);
    fountain.destroy();
 
    // ── Chemin (tuile 16x16) ──────────────────────────────────────────────
    const path = this.make.graphics({ add: false });
    path.fillStyle(0xb8a070); path.fillRect(0, 0, 16, 16);
    path.fillStyle(0xa09060, 0.5);
    path.fillRect(2, 2, 4, 4);
    path.fillRect(10, 8, 3, 3);
    path.fillRect(4, 12, 3, 2);
    path.generateTexture('path', 16, 16);
    path.destroy();
  }
 
  /**
   * Génère la texture du bouton flottant "+" pour UIScene.
   */
  _createAddButtonTexture() {
    const gfx = this.make.graphics({ add: false });
    const SIZE = 56;
    const R    = SIZE / 2;
 
    // Cercle de fond
    gfx.fillStyle(0x7F77DD);
    gfx.fillCircle(R, R, R - 2);
 
    // Bordure légère
    gfx.lineStyle(2, 0xAFA9EC, 0.6);
    gfx.strokeCircle(R, R, R - 2);
 
    // Croix "+"
    gfx.fillStyle(0xffffff);
    gfx.fillRect(R - 10, R - 3, 20, 6);
    gfx.fillRect(R - 3, R - 10, 6, 20);
 
    gfx.generateTexture('btn_add', SIZE, SIZE);
    gfx.destroy();
  }
}