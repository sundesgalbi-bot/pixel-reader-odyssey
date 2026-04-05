// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/scenes/WorldScene.js
// Rôle    : Scène principale — affiche la grille du monde et les bâtiments.
//           Gère les interactions : déplacement caméra (drag), zoom (pinch),
//           placement de bâtiment après ajout d'un livre.
// ─────────────────────────────────────────────────────────────────────────────
 
import SaveSystem        from '../systems/SaveSystem.js';
import { GENRE_CONFIG, getBuildingLevel } from '../data/GenreConfig.js';
 
const TILE_SIZE  = 16; // Pixels par tuile (grille logique)
const WORLD_COLS = 40; // Nombre de colonnes de la grille
const WORLD_ROWS = 30; // Nombre de lignes de la grille
 
export default class WorldScene extends Phaser.Scene {
 
  constructor() {
    super('WorldScene');
 
    // Dictionnaire des sprites de bâtiments actifs : id → sprite Phaser
    this._buildingSprites = {};
 
    // Suivi du pinch-to-zoom
    this._pinchDist = null;
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  create
  // ══════════════════════════════════════════════════════════════════════════
  create() {
    const worldW = WORLD_COLS * TILE_SIZE;
    const worldH = WORLD_ROWS * TILE_SIZE;
 
    // ── Sol : grille de tuiles ────────────────────────────────────────────
    this._drawGround(worldW, worldH);
 
    // ── Grille de séparation (repères visuels) ────────────────────────────
    this._drawGridLines(worldW, worldH);
 
    // ── Bordure du monde ─────────────────────────────────────────────────
    const border = this.add.graphics();
    border.lineStyle(2, 0x7F77DD, 0.4);
    border.strokeRect(0, 0, worldW, worldH);
 
    // ── Caméra : limites et zoom ──────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(2.5);            // Zoom initial (pixel art lisible)
    this.cameras.main.centerOn(worldW / 2, worldH / 2);
 
    // ── Contrôles tactiles ────────────────────────────────────────────────
    this._setupCameraControls();
 
    // ── Charge les bâtiments sauvegardés ─────────────────────────────────
    this._loadSavedBuildings();
 
    // ── Écoute les événements internes Phaser ─────────────────────────────
    // UIScene émet cet événement quand un livre est soumis
    this.events.on('book-added', this._onBookAdded, this);
 
    // Écoute aussi via le bus global de scènes
    this.game.events.on('book-added', this._onBookAdded, this);
 
    console.log('[WorldScene] Monde initialisé —', WORLD_COLS, '×', WORLD_ROWS, 'tuiles');
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Mise à jour (appelée chaque frame)
  // ══════════════════════════════════════════════════════════════════════════
  update() {
    this._handlePinchZoom();
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  API publique : placer un bâtiment
  // ══════════════════════════════════════════════════════════════════════════
 
  /**
   * Place ou met à jour un bâtiment à la position de tuile (tileX, tileY).
   * Si un bâtiment existe déjà à cet emplacement, il est remplacé.
   *
   * @param {number} tileX  - Colonne de la grille
   * @param {number} tileY  - Ligne de la grille
   * @param {string} genre  - Genre littéraire (clé de GENRE_CONFIG)
   * @param {number} level  - Niveau 0-4 (affecte la texture et la taille)
   * @param {string} bldId  - Identifiant unique du bâtiment
   */
  placeBuilding(tileX, tileY, genre, level = 0, bldId = null) {
    const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = tileY * TILE_SIZE;
 
    // Clé de texture : niveau évolué à partir du niveau 2
    const textureKey = level >= 2 ? `${genre}_evolved` : genre;
 
    // Supprime l'ancien sprite si mise à jour
    if (bldId && this._buildingSprites[bldId]) {
      this._buildingSprites[bldId].destroy();
    }
 
    // Crée le sprite du bâtiment
    const sprite = this.add.sprite(worldX, worldY, textureKey);
    sprite.setOrigin(0.5, 1); // Ancré en bas au centre (comme dans les RPG isométriques)
    sprite.setDepth(tileY);   // Les bâtiments du bas passent devant ceux du haut
 
    // Légère animation d'apparition
    sprite.setAlpha(0);
    this.tweens.add({
      targets:  sprite,
      alpha:    1,
      y:        worldY - 4,   // Petit rebond vers le haut
      duration: 400,
      ease:     'Back.easeOut',
      onComplete: () => {
        // Démarre l'animation idle si disponible
        const idleKey = `${genre}_idle`;
        if (this.anims.exists(idleKey)) {
          sprite.play(idleKey);
        }
      }
    });
 
    // Survol de la souris / tap : affiche le tooltip
    sprite.setInteractive();
    sprite.on('pointerover', () => this._showTooltip(sprite, genre, level));
    sprite.on('pointerout',  () => this._hideTooltip());
 
    if (bldId) {
      this._buildingSprites[bldId] = sprite;
    }
 
    return sprite;
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Méthodes privées
  // ══════════════════════════════════════════════════════════════════════════
 
  /** Dessine le sol en tuiles ground (damier) */
  _drawGround(worldW, worldH) {
    const cols = Math.ceil(worldW / 32) + 1;
    const rows = Math.ceil(worldH / 32) + 1;
 
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.add.image(c * 32, r * 32, 'ground').setOrigin(0, 0);
      }
    }
  }
 
  /** Dessine les lignes de grille (très subtiles, servent de repères) */
  _drawGridLines(worldW, worldH) {
    const gfx = this.add.graphics();
    gfx.lineStyle(0.5, 0xAFA9EC, 0.08); // Quasi-transparent
 
    // Lignes verticales
    for (let x = 0; x <= worldW; x += TILE_SIZE) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, worldH);
    }
    // Lignes horizontales
    for (let y = 0; y <= worldH; y += TILE_SIZE) {
      gfx.moveTo(0, y);
      gfx.lineTo(worldW, y);
    }
    gfx.strokePath();
  }
 
  /** Configure les contrôles de caméra (drag + pinch-zoom) */
  _setupCameraControls() {
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;
 
    // ── Drag (un doigt ou souris) ─────────────────────────────────────────
    this.input.on('pointerdown', (pointer) => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) return; // Pinch
      isDragging = true;
      lastX = pointer.x;
      lastY = pointer.y;
    });
 
    this.input.on('pointermove', (pointer) => {
      if (!isDragging) return;
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) return; // Pinch actif
 
      const cam  = this.cameras.main;
      const zoom = cam.zoom;
      cam.scrollX -= (pointer.x - lastX) / zoom;
      cam.scrollY -= (pointer.y - lastY) / zoom;
 
      lastX = pointer.x;
      lastY = pointer.y;
    });
 
    this.input.on('pointerup', () => {
      isDragging = false;
      this._pinchDist = null;
    });
 
    // ── Zoom molette (desktop) ────────────────────────────────────────────
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(
        cam.zoom - deltaY * 0.002,
        1.0,  // Zoom minimum
        5.0   // Zoom maximum
      );
      cam.setZoom(newZoom);
    });
 
    // Le pinch-zoom (2 doigts) est géré dans update() via _handlePinchZoom()
  }
 
  /** Gestion du pinch-to-zoom (appel chaque frame depuis update) */
  _handlePinchZoom() {
    const p1 = this.input.pointer1;
    const p2 = this.input.pointer2;
 
    if (p1.isDown && p2.isDown) {
      const currentDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
 
      if (this._pinchDist !== null) {
        const delta  = currentDist - this._pinchDist;
        const cam    = this.cameras.main;
        const newZoom = Phaser.Math.Clamp(cam.zoom + delta * 0.01, 1.0, 5.0);
        cam.setZoom(newZoom);
      }
 
      this._pinchDist = currentDist;
    } else {
      this._pinchDist = null;
    }
  }
 
  /** Charge et place tous les bâtiments depuis la sauvegarde */
  _loadSavedBuildings() {
    const state = SaveSystem.getState();
    state.buildings.forEach(bld => {
      this.placeBuilding(bld.tileX, bld.tileY, bld.genre, bld.level, bld.id);
    });
    console.log(`[WorldScene] ${state.buildings.length} bâtiment(s) chargé(s).`);
  }
 
  /**
   * Appelé quand un nouveau livre est ajouté (via UIScene).
   * @param {Object} data - { genre, xp, gold, pagesInGenre, bookId }
   */
  _onBookAdded(data) {
    const state = SaveSystem.getState();
 
    // Calcule le niveau actuel du bâtiment pour ce genre
    const pagesInGenre = state.stats.pagesByGenre[data.genre] || 0;
    const newLevel     = getBuildingLevel(pagesInGenre);
 
    // Cherche si un bâtiment de ce genre existe déjà
    const existingBld = state.buildings.find(b => b.genre === data.genre);
 
    if (existingBld) {
      // Met à jour le niveau si nécessaire
      if (existingBld.level !== newLevel) {
        SaveSystem.upgradeBuilding(existingBld.id, newLevel);
        this.placeBuilding(existingBld.tileX, existingBld.tileY, data.genre, newLevel, existingBld.id);
        this._showLevelUpEffect(existingBld.tileX, existingBld.tileY);
      }
    } else {
      // Place un nouveau bâtiment à une position libre
      const pos = this._findFreeTile();
      if (pos) {
        const bld = SaveSystem.placeBuilding(data.genre, pos.x, pos.y, newLevel);
        if (bld) {
          this.placeBuilding(pos.x, pos.y, data.genre, newLevel, bld.id);
        }
      }
    }
  }
 
  /**
   * Trouve une case libre sur la grille (spirale depuis le centre).
   * @returns {{ x: number, y: number } | null}
   */
  _findFreeTile() {
    const state    = SaveSystem.getState();
    const occupied = new Set(state.buildings.map(b => `${b.tileX},${b.tileY}`));
 
    // Commence au centre du monde
    const cx = Math.floor(WORLD_COLS / 2);
    const cy = Math.floor(WORLD_ROWS / 2);
 
    // Recherche en spirale
    for (let radius = 0; radius < 15; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const x = cx + dx;
          const y = cy + dy;
          // Laisse 2 tuiles de marge sur les bords
          if (x < 2 || x >= WORLD_COLS - 2 || y < 2 || y >= WORLD_ROWS - 2) continue;
          if (!occupied.has(`${x},${y}`)) return { x, y };
        }
      }
    }
    return null; // Monde plein (cas extrêmement rare)
  }
 
  /** Affiche un effet "level up" au-dessus d'un bâtiment */
  _showLevelUpEffect(tileX, tileY) {
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE;
 
    const text = this.add.text(wx, wy - 20, '⬆ NIVEAU +', {
      fontSize:   '6px',
      fontFamily: 'Courier New',
      color:      '#F2A623',
      stroke:     '#000',
      strokeThickness: 1,
    }).setOrigin(0.5, 1).setDepth(999);
 
    this.tweens.add({
      targets:  text,
      y:        wy - 40,
      alpha:    0,
      duration: 1500,
      ease:     'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }
 
  /** Affiche un tooltip au survol d'un bâtiment */
  _showTooltip(sprite, genre, level) {
    const cfg  = GENRE_CONFIG[genre];
    if (!cfg) return;
 
    const label = cfg.levels?.[level] ?? cfg.building;
    this._tooltip = this.add.text(
      sprite.x, sprite.y - sprite.displayHeight - 4,
      `${cfg.emoji} ${label}`,
      { fontSize: '5px', fontFamily: 'Courier New', color: '#EDE8FF',
        backgroundColor: '#1e1354', padding: { x: 4, y: 2 } }
    ).setOrigin(0.5, 1).setDepth(1000);
  }
 
  _hideTooltip() {
    if (this._tooltip) {
      this._tooltip.destroy();
      this._tooltip = null;
    }
  }
}