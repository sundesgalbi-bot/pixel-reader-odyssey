/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Scène Bibliothèque
 *  src/scenes/BookScene.js
 *
 *  Affiche la liste complète des livres lus du joueur,
 *  ses statistiques globales et son niveau.
 *  Accessible depuis le HUD (bouton 📚 dans UIScene).
 * ════════════════════════════════════════════════════════════
 */
 
import { saveSystem }                       from '../systems/SaveSystem.js';
import { calculateLevel, GENRE_BUILDINGS }  from '../config/GameConfig.js';
 
export class BookScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BookScene' });
    this._scrollY    = 0;
    this._maxScrollY = 0;
    this._items      = [];
  }
 
  // ── create ─────────────────────────────────────────────────
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
 
    this.cameras.main.setBackgroundColor('#0a0a1e');
 
    // ── Fond avec pattern ────────────────────────────────────
    const bgGraphics = this.add.graphics();
    for (let x = 0; x < W; x += 16) {
      bgGraphics.lineStyle(1, 0x1a1a3a, 0.4);
      bgGraphics.moveTo(x, 0).lineTo(x, H);
    }
 
    // ── En-tête ──────────────────────────────────────────────
    this._drawHeader(W);
 
    // ── Statistiques globales ────────────────────────────────
    this._drawStats(W);
 
    // ── Liste des livres (scrollable) ─────────────────────────
    this._drawBookList(W, H);
 
    // ── Bouton Retour ────────────────────────────────────────
    this._drawBackButton(W, H);
 
    // ── Scroll tactile ───────────────────────────────────────
    this._setupScroll();
  }
 
  // ── En-tête titre ─────────────────────────────────────────
  _drawHeader(W) {
    // Fond en-tête
    const hBg = this.add.graphics();
    hBg.fillStyle(0x0d0d2e, 1);
    hBg.fillRect(0, 0, W, 50);
    hBg.lineStyle(2, 0xf0c040, 1);
    hBg.strokeRect(0, 49, W, 1);
 
    this.add.text(W / 2, 15, '📚 MA BIBLIOTHÈQUE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#f0c040',
    }).setOrigin(0.5, 0).setDepth(10);
 
    this.add.text(W / 2, 30, 'Ton univers de lecture en pixel art.', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#c4b0ff',
    }).setOrigin(0.5, 0).setDepth(10);
  }
 
  // ── Statistiques du joueur ─────────────────────────────────
  _drawStats(W) {
    const data      = saveSystem.getData();
    const levelInfo = calculateLevel(data.player.xp);
 
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x121230, 1);
    statsBg.fillRect(8, 58, W - 16, 52);
    statsBg.lineStyle(1, 0x4040a0, 1);
    statsBg.strokeRect(8, 58, W - 16, 52);
 
    const stats = [
      `🏆 Niv.${levelInfo.level} – ${levelInfo.levelName}`,
      `📖 ${data.stats.totalBooks} livre(s) lu(s)   📄 ${data.stats.totalPages} pages`,
      `⚡ ${data.player.xp} XP   💰 ${data.player.gold} Or   🔜 ${levelInfo.xpToNext} XP prochain niveau`,
    ];
 
    stats.forEach((line, i) => {
      this.add.text(16, 66 + i * 16, line, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '6px',
        color:      i === 0 ? '#f0c040' : '#a0c0ff',
      });
    });
 
    // Barre XP
    const barY = 104;
    const barW = W - 32;
    statsBg.fillStyle(0x2a2a4e, 1);
    statsBg.fillRect(16, barY, barW, 6);
    statsBg.fillStyle(0x60a0ff, 1);
    statsBg.fillRect(16, barY, barW * levelInfo.progress, 6);
  }
 
  // ── Liste des livres ───────────────────────────────────────
  _drawBookList(W, H) {
    const data  = saveSystem.getData();
    const books = [...data.books].reverse(); // Les plus récents en premier
 
    // Zone de masquage (clip) pour le scroll
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, 118, W, H - 160);
    const mask = maskShape.createGeometryMask();
 
    // Conteneur scrollable
    this._listContainer = this.add.container(0, 0);
    this._listContainer.setMask(mask);
 
    if (books.length === 0) {
      const emptyText = this.add.text(W / 2, 200, [
        '🏙️ Ton monde est vide…',
        '',
        'Appuie sur [ + ] pour',
        'ajouter ton premier livre !',
      ], {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '7px',
        color:      '#6060a0',
        align:      'center',
        lineSpacing: 8,
      }).setOrigin(0.5);
      this._listContainer.add(emptyText);
      return;
    }
 
    let offsetY = 118;
    const ITEM_H = 60;
 
    books.forEach((book, i) => {
      const config  = GENRE_BUILDINGS[book.genre] || GENRE_BUILDINGS['Other'];
      const itemBg  = this.add.graphics();
      const bgColor = i % 2 === 0 ? 0x0e0e28 : 0x111130;
 
      itemBg.fillStyle(bgColor, 1);
      itemBg.fillRect(8, offsetY, W - 16, ITEM_H - 2);
      itemBg.lineStyle(1, 0x2a2a5a, 1);
      itemBg.strokeRect(8, offsetY, W - 16, ITEM_H - 2);
      this._listContainer.add(itemBg);
 
      // Couleur genre (barre gauche)
      const colorBar = this.add.graphics();
      colorBar.fillStyle(config.color, 1);
      colorBar.fillRect(8, offsetY, 4, ITEM_H - 2);
      this._listContainer.add(colorBar);
 
      // Emoji genre
      const emojiText = this.add.text(20, offsetY + 8, config.emoji, {
        fontSize: '16px',
      });
      this._listContainer.add(emojiText);
 
      // Titre du livre
      const shortTitle = book.title.length > 22 ? book.title.substring(0, 20) + '…' : book.title;
      const titleText  = this.add.text(44, offsetY + 6, shortTitle, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '7px',
        color:      '#f0f0ff',
      });
      this._listContainer.add(titleText);
 
      // Auteur
      if (book.author) {
        const shortAuthor = book.author.length > 24 ? book.author.substring(0, 22) + '…' : book.author;
        const authorText  = this.add.text(44, offsetY + 20, shortAuthor, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize:   '5px',
          color:      '#8080c0',
        });
        this._listContainer.add(authorText);
      }
 
      // Détails : pages, note, récompenses
      const stars      = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
      const detailText = this.add.text(44, offsetY + 34, [
        `${book.pages}p  ${stars}  +${book.rewards?.xp || 0}XP  +${book.rewards?.gold || 0}Or`,
      ].join(''), {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '5px',
        color:      '#60c060',
      });
      this._listContainer.add(detailText);
 
      // Date
      const dateStr  = book.date ? new Date(book.date).toLocaleDateString('fr-FR') : '';
      const dateText = this.add.text(W - 16, offsetY + 6, dateStr, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '5px',
        color:      '#4040a0',
      }).setOrigin(1, 0);
      this._listContainer.add(dateText);
 
      this._items.push({ y: offsetY, height: ITEM_H });
      offsetY += ITEM_H;
    });
 
    this._maxScrollY = Math.max(0, offsetY - H + 160);
  }
 
  // ── Bouton Retour ──────────────────────────────────────────
  _drawBackButton(W, H) {
    const btnBg = this.add.graphics().setDepth(20);
    btnBg.fillStyle(0x1a1a3e, 1);
    btnBg.fillRect(0, H - 40, W, 40);
    btnBg.lineStyle(1, 0xf0c040, 0.5);
    btnBg.strokeRect(0, H - 40, W, 1);
 
    const btnText = this.add.text(W / 2, H - 20, '← RETOUR AU MONDE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#f0c040',
    }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });
 
    btnText.on('pointerdown', () => {
      this.scene.stop('BookScene');
      this.scene.resume('WorldScene');
      this.scene.resume('UIScene');
    });
 
    btnText.on('pointerover',  () => btnText.setColor('#ffd060'));
    btnText.on('pointerout',   () => btnText.setColor('#f0c040'));
  }
 
  // ── Scroll tactile ─────────────────────────────────────────
  _setupScroll() {
    let startY    = 0;
    let startScroll = 0;
 
    this.input.on('pointerdown', (ptr) => {
      startY      = ptr.y;
      startScroll = this._scrollY;
    });
 
    this.input.on('pointermove', (ptr) => {
      if (!ptr.isDown) return;
      const dy = ptr.y - startY;
      this._scrollY = Phaser.Math.Clamp(startScroll - dy, 0, this._maxScrollY);
      this._listContainer.y = -this._scrollY;
    });
 
    // Molette souris
    this.input.on('wheel', (ptr, objs, dx, dy) => {
      this._scrollY = Phaser.Math.Clamp(this._scrollY + dy, 0, this._maxScrollY);
      this._listContainer.y = -this._scrollY;
    });
  }
}