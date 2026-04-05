/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Scène du Monde
 *  src/scenes/WorldScene.js
 *
 *  Affiche :
 *   - La grille isométrique (vue du dessus légèrement inclinée)
 *   - Les bâtiments générés procéduralement selon le genre
 *   - Un système de caméra avec drag/pan sur mobile
 *   - Des arbres et décorations aléatoires
 * ════════════════════════════════════════════════════════════
 */
 
import { saveSystem }       from '../systems/SaveSystem.js';
import { BuildingSystem }   from '../systems/BuildingSystem.js';
import { TILE_SIZE, GENRE_BUILDINGS, calculateLevel } from '../config/GameConfig.js';
 
// Dimensions de la grille
const GRID_W = 20;
const GRID_H = 12;
 
export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
 
    // État du drag (pan de caméra au doigt)
    this._drag = {
      active: false,
      startX: 0,
      startY: 0,
      camX:   0,
      camY:   0,
    };
  }
 
  // ── create : Construction de la scène ─────────────────────
  create() {
    this.cameras.main.setBackgroundColor('#1a2a3a');
 
    // ── Système de bâtiments ─────────────────────────────────
    this.buildingSystem = new BuildingSystem(this);
 
    // ── Génération de la grille de terrain ──────────────────
    this._drawTerrain();
 
    // ── Chargement et affichage des bâtiments sauvegardés ────
    this._loadBuildings();
 
    // ── Caméra : centrage sur la grille ──────────────────────
    const totalW = GRID_W * TILE_SIZE;
    const totalH = GRID_H * TILE_SIZE;
    this.cameras.main.setBounds(
      -TILE_SIZE * 2,
      -TILE_SIZE * 2,
      totalW + TILE_SIZE * 4,
      totalH + TILE_SIZE * 4
    );
    this.cameras.main.centerOn(totalW / 2, totalH / 2);
 
    // ── Contrôles tactiles (pinch + drag) ────────────────────
    this._setupCameraControls();
 
    // ── Écouter les événements ───────────────────────────────
    this.events.on('book-added', this._onBookAdded, this);
    this.game.events.on('book-added', this._onBookAdded, this);
    this.events.on('building-tapped', this._onBuildingTapped, this);
 
    // ── Ambiance : animation de fond (étoiles scintillantes) ─
    this._addAmbience();
 
    console.log('[WorldScene] ✅ Monde chargé.');
  }
 
  // ── Générer les tuiles de terrain ─────────────────────────
  _drawTerrain() {
    const graphics = this.add.graphics();
 
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
 
        // Alternance de couleurs pour effet damier naturel
        const isEven   = (x + y) % 2 === 0;
        const baseColor = isEven ? 0x2d5a27 : 0x3a6e33; // Deux nuances de vert herbe
 
        // Tuile de base (herbe)
        graphics.fillStyle(baseColor, 1);
        graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
 
        // Contour subtil de la grille
        graphics.lineStyle(1, 0x1a3a15, 0.4);
        graphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
 
        // Détail aléatoire (brin d'herbe, fleur) avec une seed fixe
        const rand = this._pseudoRandom(x * 100 + y);
        if (rand < 0.08) {
          // Petite fleur
          graphics.fillStyle(0xf0e040, 1);
          graphics.fillRect(px + 14, py + 14, 4, 4);
        } else if (rand < 0.15) {
          // Pierre
          graphics.fillStyle(0x808060, 0.5);
          graphics.fillRect(px + 10, py + 10, 6, 6);
        }
      }
    }
 
    // Bordure du monde
    graphics.lineStyle(3, 0x1a3a15, 1);
    graphics.strokeRect(0, 0, GRID_W * TILE_SIZE, GRID_H * TILE_SIZE);
 
    // Eau autour du monde (effet d'île)
    const waterGraphics = this.add.graphics();
    waterGraphics.fillStyle(0x1a4a8a, 1);
    const margin = TILE_SIZE * 3;
    // Bordures eau
    waterGraphics.fillRect(-margin, -margin, GRID_W * TILE_SIZE + margin * 2, margin);
    waterGraphics.fillRect(-margin, GRID_H * TILE_SIZE, GRID_W * TILE_SIZE + margin * 2, margin);
    waterGraphics.fillRect(-margin, -margin, margin, GRID_H * TILE_SIZE + margin * 2);
    waterGraphics.fillRect(GRID_W * TILE_SIZE, -margin, margin, GRID_H * TILE_SIZE + margin * 2);
 
    // Déplacer l'eau derrière la grille
    waterGraphics.setDepth(-10);
    graphics.setDepth(0);
  }
 
  // ── Charger et afficher les bâtiments existants ────────────
  _loadBuildings() {
    const data = saveSystem.getData();
 
    for (const building of data.world.buildings) {
      // Retrouver le livre associé
      const book = data.books.find(b => b.id === building.bookId);
      if (!book) continue;
 
      this.buildingSystem.place(building, book, false);
    }
  }
 
  // ── Afficher un tooltip au tap sur un bâtiment ────────────
  _showBuildingTooltip(book, config, worldX, worldY) {
    // Supprimer l'ancien tooltip
    if (this._tooltip) this._tooltip.destroy();
 
    const camX = worldX - this.cameras.main.scrollX;
    const camY = worldY - this.cameras.main.scrollY;
    const scaleX = this.cameras.main.zoom || 1;
 
    // Créer un panneau de texte
    const W = 160;
    const H = 80;
    const container = this.add.container(
      Phaser.Math.Clamp(camX * scaleX, W / 2 + 8, this.scale.width  - W / 2 - 8),
      Phaser.Math.Clamp(camY * scaleX - 60, H / 2 + 8, this.scale.height - H / 2 - 8)
    ).setScrollFactor(0).setDepth(100);
 
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.95);
    bg.fillRect(-W / 2, -H / 2, W, H);
    bg.lineStyle(2, 0xf0c040, 1);
    bg.strokeRect(-W / 2, -H / 2, W, H);
    container.add(bg);
 
    const title = this.add.text(0, -H / 2 + 8, book.title, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#f0c040',
      wordWrap:   { width: W - 16 },
      align:      'center',
    }).setOrigin(0.5, 0);
    container.add(title);
 
    const details = this.add.text(0, -H / 2 + 32, [
      `${config.emoji} ${config.label}`,
      `📄 ${book.pages} pages`,
      `${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}`,
    ].join('\n'), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '5px',
      color:      '#c0c0e0',
      align:      'center',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);
    container.add(details);
 
    this._tooltip = container;
 
    // Fermer automatiquement après 3 secondes
    this.time.delayedCall(3000, () => {
      if (this._tooltip === container) {
        this.tweens.add({
          targets: container, alpha: 0, duration: 200,
          onComplete: () => container.destroy(),
        });
        this._tooltip = null;
      }
    });
  }
 
  // ── Réagir au tap sur un bâtiment ───────────────────────
  _onBuildingTapped({ building, book, config, worldX, worldY }) {
    this._showBuildingTooltip(book, config, worldX, worldY);
  }
 
  // ── Contrôles caméra : drag au doigt + pinch zoom ─────────
  _setupCameraControls() {
    // Drag (pan)
    this.input.on('pointerdown', (ptr) => {
      this._drag.active = true;
      this._drag.startX = ptr.x;
      this._drag.startY = ptr.y;
      this._drag.camX   = this.cameras.main.scrollX;
      this._drag.camY   = this.cameras.main.scrollY;
    });
 
    this.input.on('pointermove', (ptr) => {
      if (!this._drag.active || ptr.isDown === false) return;
 
      const dx = ptr.x - this._drag.startX;
      const dy = ptr.y - this._drag.startY;
 
      // Seuil minimal pour éviter les micro-mouvements
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
 
      this.cameras.main.setScroll(
        this._drag.camX - dx,
        this._drag.camY - dy,
      );
    });
 
    this.input.on('pointerup', () => {
      this._drag.active = false;
    });
 
    // Zoom molette souris (desktop)
    this.input.on('wheel', (ptr, objs, dx, dy) => {
      const zoom = this.cameras.main.zoom - dy * 0.001;
      this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.5, 2.5));
    });
 
    // Pinch zoom (mobile) – via Phaser pinch plugin ou manuel
    // Phaser ne supporte pas nativement le pinch, on écoute les touches
    let pinchDist = 0;
    this.input.on('pointermove', (ptr) => {
      const pointers = this.input.manager.pointers.filter(p => p.isDown);
      if (pointers.length === 2) {
        this._drag.active = false; // Désactive le pan pendant le pinch
        const [p1, p2] = pointers;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (pinchDist > 0) {
          const delta = (dist - pinchDist) * 0.005;
          const zoom  = this.cameras.main.zoom + delta;
          this.cameras.main.setZoom(Phaser.Math.Clamp(zoom, 0.5, 2.5));
        }
        pinchDist = dist;
      } else {
        pinchDist = 0;
      }
    });
  }
 
  // ── Ambiance : particules et arbres ───────────────────────
  _addAmbience() {
    // Arbres décoratifs
    const treeGraphics = this.add.graphics();
    treeGraphics.setDepth(1);
 
    for (let i = 0; i < 15; i++) {
      const rand = this._pseudoRandom(i * 777);
      const x    = Math.floor(rand * GRID_W);
      const y    = Math.floor(this._pseudoRandom(i * 333) * GRID_H);
 
      // Éviter les bords et le centre (zone de construction)
      if (x < 2 || x > GRID_W - 3 || y < 1 || y > GRID_H - 2) continue;
 
      // Vérifier que la cellule est libre dans la sauvegarde
      const data     = saveSystem.getData();
      const occupied = data.world.buildings.some(b => b.gridX === x && b.gridY === y);
      if (occupied) continue;
 
      const px = x * TILE_SIZE + TILE_SIZE / 2;
      const py = y * TILE_SIZE + TILE_SIZE / 2;
 
      // Tronc
      treeGraphics.fillStyle(0x8b4513, 1);
      treeGraphics.fillRect(px - 3, py - 8, 6, 10);
 
      // Feuillage (cercles superposés)
      const green = this._pseudoRandom(i * 99) < 0.3 ? 0x2d8a2d : 0x3da03d;
      treeGraphics.fillStyle(green, 1);
      treeGraphics.fillCircle(px, py - 14, 10);
      treeGraphics.fillStyle(0x50c050, 0.7);
      treeGraphics.fillCircle(px - 4, py - 12, 7);
      treeGraphics.fillCircle(px + 4, py - 16, 7);
    }
  }
 
  // ── Méthode de jeu : ajouter un bâtiment depuis l'extérieur ──
  addBuilding(building, book) {
    this._onBookAdded({ building, book });
  }
 
  // ── Pseudo-aléatoire déterministe (même résultat à chaque fois) ──
  _pseudoRandom(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  }
 
  // ── update : Boucle de jeu (60 fps) ───────────────────────
  update() {
    // Tri de profondeur dynamique (les bâtiments du bas passent devant)
    const children = this.buildingGroup.getChildren();
    children.sort((a, b) => a.y - b.y);
    children.forEach((child, i) => child.setDepth(i));
  }
}