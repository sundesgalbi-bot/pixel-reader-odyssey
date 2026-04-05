/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Scène de démarrage
 *  src/scenes/BootScene.js
 *
 *  Rôle : Charger tous les assets (textures, sons, tilemaps…)
 *  et afficher une barre de progression pixel art.
 *  Une fois le chargement terminé, lance WorldScene + UIScene.
 * ════════════════════════════════════════════════════════════
 */
 
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }
 
  // ── preload : Phaser charge les assets ici ─────────────────
  preload() {
    const W = this.scale.width;
    const H = this.scale.height;
 
    // ── Fond de l'écran de boot ──────────────────────────────
    this.cameras.main.setBackgroundColor('#1a1a2e');
 
    // ── Titre ────────────────────────────────────────────────
    this.add.text(W / 2, H / 2 - 60, 'PIXEL-READER\nODYSSEY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '14px',
      color:      '#f0c040',
      align:      'center',
      shadow:     { offsetX: 2, offsetY: 2, color: '#8b6914', fill: true },
    }).setOrigin(0.5);
 
    // ── Barre de progression ─────────────────────────────────
    const barW   = 200;
    const barH   = 14;
    const barX   = W / 2 - barW / 2;
    const barY   = H / 2;
 
    // Fond de la barre
    this.add.rectangle(W / 2, barY + barH / 2, barW + 4, barH + 4, 0x2a2a4e)
      .setOrigin(0.5);
 
    // Bordure dorée
    const border = this.add.graphics();
    border.lineStyle(2, 0xf0c040, 1);
    border.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
 
    // Barre de remplissage
    const bar = this.add.graphics();
 
    // Texte de statut
    const statusText = this.add.text(W / 2, barY + barH + 14, 'INITIALISATION...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#a0a0c0',
    }).setOrigin(0.5);
 
    // ── Mise à jour de la barre en fonction de la progression ─
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0xf0c040, 1);
      bar.fillRect(barX, barY, barW * value, barH);
 
      // Mise à jour barre HTML aussi (si encore visible)
      const htmlBar = document.getElementById('loading-bar');
      if (htmlBar) htmlBar.style.width = `${value * 100}%`;
    });
 
    this.load.on('fileprogress', (file) => {
      statusText.setText(`CHARGEMENT : ${file.key.toUpperCase()}`);
    });
 
    this.load.on('complete', () => {
      statusText.setText('PRÊT !');
      bar.clear();
      bar.fillStyle(0xf0c040, 1);
      bar.fillRect(barX, barY, barW, barH);
    });
 
    // ════════════════════════════════════════════════════════
    // CHARGEMENT DES ASSETS
    // Les fichiers sont dans le dossier assets/
    // ════════════════════════════════════════════════════════
 
    // ── Tileset de terrain (généré procéduralement si absent) ──
    // this.load.image('tileset', 'assets/tiles/terrain.png');
 
    // ── Spritesheet du héros / personnage ───────────────────
    // this.load.spritesheet('hero', 'assets/sprites/hero.png', {
    //   frameWidth: 16, frameHeight: 16
    // });
 
    // ── Audio ────────────────────────────────────────────────
    // this.load.audio('bgm', 'assets/audio/theme.ogg');
    // this.load.audio('sfx-build', 'assets/audio/build.ogg');
 
    // NOTE : Sans assets réels, on génère tout par code dans WorldScene.
    // Pour ajouter vos propres sprites, décommentez les lignes ci-dessus.
  }
 
  // ── create : Lancement des scènes principales ──────────────
  create() {
    // Petit délai pour laisser le temps à l'animation de se terminer
    this.time.delayedCall(400, () => {
      // Lance la scène du monde en arrière-plan
      this.scene.launch('WorldScene');
 
      // Lance la scène UI par-dessus (superposition)
      this.scene.launch('UIScene');
 
      // Arrête cette scène (elle n'est plus nécessaire)
      this.scene.stop('BootScene');
    });
  }
}