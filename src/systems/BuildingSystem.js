/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Système de bâtiments
 *  src/systems/BuildingSystem.js
 *
 *  Centralise toute la logique de placement, rendu
 *  et interaction avec les bâtiments sur la grille.
 *  Utilisé par WorldScene pour déléguer la logique de dessin.
 * ════════════════════════════════════════════════════════════
 */
 
import { TILE_SIZE, GENRE_BUILDINGS } from '../config/GameConfig.js';
import { saveSystem }                 from './SaveSystem.js';
 
export class BuildingSystem {
  /**
   * @param {Phaser.Scene} scene – La scène Phaser parente
   */
  constructor(scene) {
    this.scene   = scene;
    this._map    = new Map(); // buildingId → Phaser.GameObjects.Container
    this._group  = scene.add.group();
  }
 
  // ── Placer un bâtiment sur la grille ──────────────────────
  /**
   * @param {{ id, gridX, gridY, genre, bookId }} building
   * @param {{ title, pages, author, rating }} book
   * @param {boolean} animate – Animer l'apparition
   * @returns {Phaser.GameObjects.Container}
   */
  place(building, book, animate = true) {
    const config = GENRE_BUILDINGS[book.genre] || GENRE_BUILDINGS['Other'];
    const worldX = building.gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = building.gridY * TILE_SIZE + TILE_SIZE / 2;
 
    const container = this.scene.add.container(worldX, worldY);
    container.setDepth(building.gridY);
 
    // ── Corps du bâtiment (dessin vectoriel) ─────────────────
    const g = this.scene.add.graphics();
    this._drawBuilding(g, config, book.pages, book.rating);
    container.add(g);
 
    // ── Icône genre ──────────────────────────────────────────
    const iconY  = -TILE_SIZE * config.height - 8;
    const icon   = this.scene.add.text(0, iconY, config.emoji, {
      fontSize: '14px',
    }).setOrigin(0.5, 1);
    container.add(icon);
 
    // ── Zone interactive ─────────────────────────────────────
    const hitH   = TILE_SIZE * config.height + 8;
    const hitY   = -(hitH / 2);
    const hitZone = this.scene.add.rectangle(0, hitY, TILE_SIZE, hitH, 0xffffff, 0);
    hitZone.setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', () => {
      this.scene.events.emit('building-tapped', { building, book, config, worldX, worldY });
    });
    // Highlight au survol
    hitZone.on('pointerover', () => {
      icon.setScale(1.3);
      this.scene.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
    });
    hitZone.on('pointerout',  () => {
      icon.setScale(1);
      this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
    });
    container.add(hitZone);
 
    // ── Animation d'apparition ───────────────────────────────
    if (animate) {
      container.setAlpha(0);
      container.y += 24;
      this.scene.tweens.add({
        targets:  container,
        alpha:    1,
        y:        worldY,
        duration: 450,
        ease:     'Back.easeOut',
        delay:    50,
      });
 
      // Particule de construction
      this._spawnBuildParticles(worldX, worldY, config.color);
    }
 
    this._map.set(building.id, container);
    this._group.add(container);
    return container;
  }
 
  // ── Supprimer un bâtiment de la scène ────────────────────
  remove(buildingId) {
    const container = this._map.get(buildingId);
    if (!container) return;
 
    this.scene.tweens.add({
      targets:  container,
      alpha:    0,
      scaleX:   0,
      scaleY:   0,
      duration: 300,
      ease:     'Back.easeIn',
      onComplete: () => {
        container.destroy();
        this._map.delete(buildingId);
        this._group.remove(container);
      },
    });
  }
 
  // ── Obtenir le container d'un bâtiment ────────────────────
  get(buildingId) {
    return this._map.get(buildingId);
  }
 
  // ── Trier tous les bâtiments par profondeur (Y) ───────────
  sortDepth() {
    const children = this._group.getChildren();
    children.sort((a, b) => a.y - b.y);
    children.forEach((child, i) => child.setDepth(i));
  }
 
  // ── Charger tous les bâtiments depuis la sauvegarde ───────
  loadAll() {
    const data = saveSystem.getData();
    data.world.buildings.forEach(building => {
      const book = data.books.find(b => b.id === building.bookId);
      if (book) this.place(building, book, false);
    });
  }
 
  // ════════════════════════════════════════════════════════════
  // DESSIN PROCÉDURAL DES BÂTIMENTS
  // ════════════════════════════════════════════════════════════
 
  /**
   * Dessine un bâtiment pixel art complet dans un Graphics Phaser.
   * @param {Phaser.GameObjects.Graphics} g
   * @param {object} config  – Données du genre (couleur, toit, porte, hauteur)
   * @param {number} pages   – Nombre de pages (influence le drapeau)
   * @param {number} rating  – Note du livre (influence les décorations)
   */
  _drawBuilding(g, config, pages, rating) {
    const h      = config.height;
    const bW     = TILE_SIZE - 6;
    const floorH = 13;
    const totalH = h * floorH + 10;
    const baseX  = -bW / 2;
    const baseY  = -totalH;
 
    // ── Ombre ────────────────────────────────────────────────
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(2, 2, bW + 6, 8);
 
    // ── Corps principal ──────────────────────────────────────
    g.fillStyle(config.color, 1);
    g.fillRect(baseX, baseY, bW, totalH - 8);
 
    // ── Reflet latéral (ombre intérieure) ────────────────────
    g.fillStyle(0x000000, 0.15);
    g.fillRect(baseX + bW - 4, baseY, 4, totalH - 8);
 
    // ── Fenêtres ─────────────────────────────────────────────
    for (let floor = 0; floor < h; floor++) {
      const fY      = baseY + 4 + floor * floorH;
      const litColor = (floor % 2 === 0) ? 0xf0f0a0 : 0xffe080;
      g.fillStyle(litColor, 0.9);
      g.fillRect(baseX + 3, fY, 5, 6);     // Fenêtre gauche
      g.fillRect(baseX + bW - 8, fY, 5, 6); // Fenêtre droite
 
      // Croisée de fenêtre
      g.fillStyle(0x000000, 0.3);
      g.fillRect(baseX + 5, fY, 1, 6);
      g.fillRect(baseX + 3, fY + 3, 5, 1);
    }
 
    // ── Porte ────────────────────────────────────────────────
    g.fillStyle(config.doorColor, 1);
    const doorX = baseX + bW / 2 - 3;
    const doorY = baseY + totalH - 17;
    g.fillRect(doorX, doorY, 7, 9);
    // Poignée
    g.fillStyle(0xffd700, 1);
    g.fillRect(doorX + 5, doorY + 5, 1, 2);
 
    // ── Toit ─────────────────────────────────────────────────
    g.fillStyle(config.roofColor, 1);
    if (h >= 3) {
      // Toit pointu (triangle)
      g.fillTriangle(
        baseX - 3, baseY,
        baseX + bW + 3, baseY,
        baseX + bW / 2, baseY - 14
      );
      // Cheminée
      g.fillStyle(0x505050, 1);
      g.fillRect(baseX + bW - 10, baseY - 10, 5, 10);
      g.fillStyle(0x303030, 1);
      g.fillRect(baseX + bW - 12, baseY - 12, 9, 3);
    } else if (h === 2) {
      // Toit à double pente
      g.fillTriangle(
        baseX - 2, baseY,
        baseX + bW + 2, baseY,
        baseX + bW / 2, baseY - 10
      );
    } else {
      // Toit plat avec rebord
      g.fillRect(baseX - 3, baseY - 5, bW + 6, 6);
    }
 
    // ── Contour général ──────────────────────────────────────
    g.lineStyle(2, 0x000000, 0.4);
    g.strokeRect(baseX, baseY, bW, totalH - 8);
 
    // ── Drapeau (livre 500+ pages) ───────────────────────────
    if (pages && pages >= 500) {
      const flagX = baseX + bW / 2 - 1;
      const flagY = baseY - (h >= 3 ? 26 : 13);
      // Mât
      g.lineStyle(1, 0x888888, 1);
      g.moveTo(flagX, flagY);
      g.lineTo(flagX, flagY + 14);
      g.strokePath();
      // Drapeau
      g.fillStyle(pages >= 1000 ? 0xffd700 : 0xff4040, 1);
      g.fillTriangle(flagX, flagY, flagX + 9, flagY + 4, flagX, flagY + 8);
    }
 
    // ── Étoile (note 5/5) ────────────────────────────────────
    if (rating >= 5) {
      g.fillStyle(0xffd700, 1);
      g.fillStar(baseX + bW / 2, baseY - (h >= 3 ? 30 : 18), 5, 5, 3);
    }
  }
 
  // ── Particules de construction ────────────────────────────
  _spawnBuildParticles(x, y, color) {
    // Mini-particules codées à la main (sans plugin)
    const COUNT = 8;
    for (let i = 0; i < COUNT; i++) {
      const angle  = (i / COUNT) * Math.PI * 2;
      const dist   = Phaser.Math.Between(20, 50);
      const g      = this.scene.add.graphics().setDepth(200);
 
      // Convertir la couleur hex en composantes RGB
      const r = (color >> 16) & 0xff;
      const gv = (color >> 8) & 0xff;
      const b = color & 0xff;
 
      g.fillStyle(color, 1);
      g.fillRect(-3, -3, 6, 6);
      g.setPosition(x, y);
 
      this.scene.tweens.add({
        targets:   g,
        x:         x + Math.cos(angle) * dist,
        y:         y + Math.sin(angle) * dist - 20,
        alpha:     0,
        scaleX:    0,
        scaleY:    0,
        duration:  600,
        ease:      'Quad.easeOut',
        delay:     i * 30,
        onComplete: () => g.destroy(),
      });
    }
  }
}