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
 
    // ── Fond paysage : montagnes, ciel, nuages ───────────────
    this._drawBackground();
 
    // ── Système de bâtiments ─────────────────────────────────
    this.buildingSystem = new BuildingSystem(this);
    this.buildingGroup = this.buildingSystem._group;
 
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
    this.events.on('book-added', (payload) => this._onBookAdded(payload));
    this.game.events.on('book-added', (payload) => this._onBookAdded(payload));
    this.events.on('building-tapped', (payload) => this._onBuildingTapped(payload));
 
    // ── Ambiance : animation de fond (étoiles scintillantes) ─
    this._addAmbience();
 
    console.log('[WorldScene] ✅ Monde chargé.');
  }
 
  // ── Dessiner le paysage en arrière-plan ──────────────────
  _drawBackground() {
    const bg = this.add.graphics();
    bg.setScrollFactor(0.3);
    bg.setDepth(-20);

    const W = this.scale.width;
    const H = this.scale.height;

    // Ciel dégradé magique : violet foncé en bas, rose/magenta en haut
    bg.fillStyle(0x1a0033, 1);
    bg.fillRect(0, 0, W * 4, H * 0.2);
    bg.fillStyle(0x6b0080, 1);
    bg.fillRect(0, H * 0.2, W * 4, H * 0.4);
    bg.fillStyle(0xb8389e, 1);
    bg.fillRect(0, H * 0.4, W * 4, H * 0.3);
    bg.fillStyle(0xff66cc, 1);
    bg.fillRect(0, H * 0.7, W * 4, H * 0.3);

    // Étoiles scintillantes
    bg.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 50; i++) {
      const x = (i * 97 + Math.sin(i * 2) * 200) % (W * 2);
      const y = (i * 71) % (H * 0.5);
      const size = 2 + (i % 3);
      bg.fillRect(x, y, size, size);
    }

    // Spirales galactiques (roses/cyans)
    bg.lineStyle(2, 0xff33ff, 0.3);
    for (let i = 0; i < 3; i++) {
      const centerX = (i * 200 + 100);
      const centerY = H * 0.25;
      for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
        const radius = angle * 20;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) bg.fillCircle(x, y, 1);
      }
    }

    // Planètes et sphères
    const planets = [
      { x: W * 0.7, y: H * 0.15, r: 35, color: 0x00ffff },
      { x: W * 1.5, y: H * 0.3, r: 28, color: 0xff99ff },
      { x: W * 0.2, y: H * 0.4, r: 45, color: 0xffff66 },
      { x: W * 1.8, y: H * 0.2, r: 32, color: 0x99ffff },
    ];
    planets.forEach((p) => {
      bg.fillStyle(p.color, 1);
      bg.fillCircle(p.x, p.y, p.r);
      bg.fillStyle(0xffffff, 0.4);
      bg.fillCircle(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.4);
    });

    // Aurores / lumière
    bg.fillStyle(0x00ffff, 0.15);
    for (let y = 0; y < H * 0.6; y += 20) {
      bg.fillRect(0, y, W * 4, 15);
    }

    // Montagnes : dégradé rose/bleu
    bg.fillStyle(0xc084d0, 1);
    const mountainPoints = [];
    for (let i = 0; i <= 300; i += 20) {
      const height = Math.sin(i * 0.015) * 40 + 60;
      mountainPoints.push({ x: i, y: H * 0.6 - height });
    }
    mountainPoints.push({ x: 300, y: H });
    mountainPoints.push({ x: 0, y: H });
    bg.fillPoints(mountainPoints, true);

    // Pics de montagne irisés (bleu clair)
    bg.fillStyle(0x66ffff, 1);
    for (let i = 0; i < 6; i++) {
      const peakX = 30 + i * 50;
      const peakY = H * 0.55;
      bg.fillTriangle(peakX - 20, peakY + 40, peakX, peakY - 20, peakX + 20, peakY + 40);
    }

    // Forêt rose au loin
    bg.fillStyle(0xff99dd, 0.8);
    for (let i = 0; i < 12; i++) {
      const x = (i * 70) % (W * 2);
      const y = H * 0.65 + Math.sin(i * 0.7) * 20;
      bg.fillCircle(x, y, 18 + (i % 4) * 5);
    }

    // Rivière brillante (cyan)
    bg.fillStyle(0x00ffff, 0.6);
    const riverPoints = [];
    for (let i = 0; i <= 300; i += 15) {
      const waveY = H * 0.75 + Math.sin(i * 0.02) * 15;
      riverPoints.push({ x: i, y: waveY });
    }
    for (let i = 300; i >= 0; i -= 15) {
      riverPoints.push({ x: i, y: H * 0.75 + Math.sin(i * 0.02) * 15 + 8 });
    }
    bg.fillPoints(riverPoints, true);

    // Dépôt de la rivière
    bg.fillStyle(0x99ffff, 0.4);
    for (let i = 0; i < 20; i++) {
      const x = (i * 15) % (W * 2);
      const y = H * 0.75 + Math.sin(i * 0.5) * 10;
      bg.fillCircle(x, y, 3 + (i % 2) * 2);
    }
  }

  // ── Générer les tuiles de terrain ─────────────────────────
  _drawTerrain() {
    const graphics = this.add.graphics();
 
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
 
        // Alternance de couleurs roses/violettes magiques
        const isEven   = (x + y) % 2 === 0;
        const baseColor = isEven ? 0xc499d8 : 0xdb99e8; // Roses/violettes pâles
        const accentColor = isEven ? 0xab77c8 : 0xc477d8; // Un peu plus foncés

        // Tuile de base
        graphics.fillStyle(baseColor, 1);
        graphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Contour magique
        graphics.lineStyle(1, accentColor, 0.6);
        graphics.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

        // Détails scintillants : petites cristaux magiques
        const rand = this._pseudoRandom(x * 100 + y);
        if (rand < 0.05) {
          // Cristal cyan brillant
          graphics.fillStyle(0x00ffff, 0.7);
          graphics.fillRect(px + 12, py + 12, 4, 4);
          graphics.lineStyle(1, 0x66ffff, 0.8);
          graphics.strokeRect(px + 12, py + 12, 4, 4);
        } else if (rand < 0.12) {
          // Fleur rose
          graphics.fillStyle(0xff66cc, 0.8);
          graphics.fillCircle(px + 14, py + 14, 3);
          graphics.fillStyle(0xffb8f1, 0.6);
          graphics.fillCircle(px + 14, py + 11, 2);
        } else if (rand < 0.18) {
          // Herbe plus claire
          graphics.fillStyle(0xffc0e0, 0.4);
          graphics.fillRect(px + 8, px + 8, 8, 3);
        }
      }
    }

    // Bordure du monde arc-en-ciel magique
    graphics.lineStyle(4, 0x00ffff, 0.8);
    graphics.strokeRect(0, 0, GRID_W * TILE_SIZE, GRID_H * TILE_SIZE);

    // Aura magique around le monde
    graphics.lineStyle(2, 0xff66cc, 0.3);
    graphics.strokeRect(-8, -8, GRID_W * TILE_SIZE + 16, GRID_H * TILE_SIZE + 16);

    // Eau magique autour du monde (cyan brillant)
    const waterGraphics = this.add.graphics();
    waterGraphics.fillStyle(0x00ffcc, 0.6);
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
 
  // ── Réagir à l'ajout d'un nouveau livre ───────────────────
  _onBookAdded({ building, book }) {
    if (!building || !book) return;
 
    this.buildingSystem.place(building, book, true);
 
    const worldX = building.gridX * TILE_SIZE + TILE_SIZE / 2;
    const worldY = building.gridY * TILE_SIZE + TILE_SIZE / 2;
    this.cameras.main.pan(worldX, worldY, 600, 'Sine.easeInOut');
  }
 
  // ── Ambiance : particules et arbres ───────────────────────
  _addAmbience() {
    // Arbres décoratifs roses/violets magiques
    const treeGraphics = this.add.graphics();
    treeGraphics.setDepth(1);

    for (let i = 0; i < 18; i++) {
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

      // Tronc rose/marron
      treeGraphics.fillStyle(0xb8619a, 1);
      treeGraphics.fillRect(px - 4, py - 6, 8, 12);

      // Feuillage rose/magenta (cercles superposés)
      const pink = this._pseudoRandom(i * 99) < 0.5 ? 0xff99dd : 0xff66cc;
      treeGraphics.fillStyle(pink, 1);
      treeGraphics.fillCircle(px, py - 14, 11);
      treeGraphics.fillStyle(0xffb3e6, 0.8);
      treeGraphics.fillCircle(px - 5, py - 12, 8);
      treeGraphics.fillCircle(px + 5, py - 16, 8);

      // Lueur magique autour de l'arbre
      treeGraphics.fillStyle(0x00ffff, 0.2);
      treeGraphics.fillCircle(px, py - 10, 16);
    }

    // Particules magiques (points brillants qui flottent)
    for (let i = 0; i < 6; i++) {
      const px = Math.random() * (GRID_W * TILE_SIZE);
      const py = Math.random() * (GRID_H * TILE_SIZE);
      const particle = this.add.graphics();
      particle.setDepth(50);

      const color = [0x00ffff, 0xff99ff, 0xffff66][i % 3];
      particle.fillStyle(color, 0.8);
      particle.fillRect(px - 1, py - 1, 2, 2);

      this.tweens.add({
        targets: particle,
        y: py - 30,
        alpha: 0,
        duration: 2000 + i * 300,
        ease: 'Sine.easeIn',
        repeat: -1,
        delay: i * 500,
      });
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