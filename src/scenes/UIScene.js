/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Scène UI (HUD)
 *  src/scenes/UIScene.js
 *
 *  Superposée par-dessus WorldScene (ne scroll pas).
 *  Contient :
 *   - Barre de statut (XP, Or, Niveau)
 *   - Bouton flottant "+" pour ajouter un livre
 *   - Gestion du formulaire HTML overlay
 *   - Notifications de récompenses
 * ════════════════════════════════════════════════════════════
 */
 
import { saveSystem }       from '../systems/SaveSystem.js';
import { RewardSystem }     from '../systems/RewardSystem.js';
import { calculateRewards, calculateLevel, GENRE_BUILDINGS } from '../config/GameConfig.js';
 
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
 
    // Référence aux éléments HUD Phaser
    this._hud = {};
 
    // Système de récompenses
    this.rewardSystem = new RewardSystem(this);
 
    // Note actuelle dans le formulaire
    this._currentRating = 3;
    this._selectedGenre = 'Romance';
  }
 
  // ── create : Construction du HUD ──────────────────────────
  create() {
    const W = this.scale.width;
 
    // ── Barre supérieure ─────────────────────────────────────
    this._createTopBar(W);
 
    // ── Sélection de style / bâtiment girly ───────────────────
    this._createBuildingSelector(W);
 
    // ── Panneau des livres sur le côté ───────────────────────
    this._createSideBookPanel(W);
 
    // ── Bouton flottant "+" ───────────────────────────────────
    this._createAddButton(W);
 
    // ── Attacher les événements du formulaire HTML ────────────
    this._bindFormEvents();
    this._bindNameOverlayEvents();
    this._checkPlayerName();
 
    // ── Mise à jour initiale du HUD ───────────────────────────
    this._refreshHUD();
    this._refreshSidePanel();
 
    // ── Écouter les redimensionnements ────────────────────────
    this.scale.on('resize', this._onResize, this);
 
    console.log('[UIScene] ✅ HUD chargé.');
  }
 
  // ── Barre de statut en haut de l'écran ────────────────────
  _createTopBar(W) {
    // Avatar du joueur (coin haut gauche)
    this._createPlayerAvatar(W);
 
    // Fond semi-transparent de la barre
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0a0a1e, 0.85);
    barBg.fillRect(0, 0, W, 36);
    barBg.lineStyle(1, 0xf0c040, 0.5);
    barBg.strokeRect(0, 35, W, 1);
    this._hud.barBg = barBg;
 
    // ── Pseudo du joueur ─────────────────────────────────────
    this._hud.nameLabel = this.add.text(8, 8, 'Hello, Lecteur', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#ffb8f1',
    });
 
    // ── XP ────────────────────────────────────────────────────
    this._hud.xpLabel = this.add.text(8, 18, '⚡ XP: 0', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#80d0ff',
    });
 
    // ── Or ────────────────────────────────────────────────────
    this._hud.goldLabel = this.add.text(W / 2 - 40, 8, '💰 Or: 10', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#f0c040',
    });
 
    // ── Niveau ────────────────────────────────────────────────
    this._hud.levelLabel = this.add.text(W - 8, 8, 'Niv.1', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#80ff80',
    }).setOrigin(1, 0);
 
    // ── Bouton Bibliothèque ───────────────────────────────────
    this._hud.libraryBtn = this.add.text(W - 50, 8, '📚', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#80ff80',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this._hud.libraryBtn.on('pointerdown', () => this.scene.launch('BookScene'));
 
    // ── Barre XP (sous la barre principale) ──────────────────
    this._hud.xpBarBg = this.add.graphics();
    this._hud.xpBarBg.fillStyle(0x2a2a4e, 1);
    this._hud.xpBarBg.fillRect(0, 36, W, 4);
 
    this._hud.xpBar = this.add.graphics();
 
    this._drawXPBar(0);
  }
 
  // ── Avatar pixel art du joueur ────────────────────────────
  _createPlayerAvatar(W) {
    const avatarPanel = this.add.graphics();
    avatarPanel.fillStyle(0x1e0a32, 0.95);
    avatarPanel.fillRect(85, 5, 70, 38);
    avatarPanel.lineStyle(2, 0xff79c6, 1);
    avatarPanel.strokeRect(85, 5, 70, 38);
    avatarPanel.setScrollFactor(0);
    this._hud.avatarPanel = avatarPanel;
 
    // Dessiner un petit avatar pixel art : cheveux violets, visage rose, vêtements colorés
    this._drawPixelAvatar(120, 24);
  }
 
  _drawPixelAvatar(centerX, centerY) {
    const pixelSize = 2;
    const g = this.add.graphics();
    g.setScrollFactor(0);
 
    // Cheveux violets (en haut)
    g.fillStyle(0xff66cc, 1);
    for (let x = -6; x <= 6; x += pixelSize) {
      for (let y = -8; y <= -4; y += pixelSize) {
        if (Math.abs(x) <= 6) g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    // Visage rose pêche
    g.fillStyle(0xffe5d8, 1);
    for (let x = -4; x <= 4; x += pixelSize) {
      for (let y = -2; y <= 4; y += pixelSize) {
        g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    // Yeux
    g.fillStyle(0x000000, 1);
    g.fillRect(centerX - 3, centerY, pixelSize, pixelSize);
    g.fillRect(centerX + 1, centerY, pixelSize, pixelSize);
 
    // Sourire
    g.fillRect(centerX - 2, centerY + 2, pixelSize, pixelSize);
    g.fillRect(centerX + 1, centerY + 2, pixelSize, pixelSize);
 
    // Vêtements : rouge/orange (tube top)
    g.fillStyle(0xff6b6b, 1);
    for (let x = -5; x <= 5; x += pixelSize) {
      for (let y = 4; y <= 8; y += pixelSize) {
        g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    this._hud.avatar = g;
  }
 
  // ── Barre XP colorée ──────────────────────────────────────
  _drawXPBar(progress) {
    const W = this.scale.width;
    this._hud.xpBar.clear();
    this._hud.xpBar.fillStyle(0x60a0ff, 1);
    this._hud.xpBar.fillRect(0, 36, W * progress, 4);
  }
 
  // ── Sélectionne un style de bâtiment/gendre de livre ─────────
  _createBuildingSelector(W) {
    const label = this.add.text(8, 42, 'Style de bâtiment :', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#ffb8f1',
    });
    this._hud.selectorLabel = label;
 
    const genres = ['Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Self-Help'];
    let x = 10;
    const y = 60;
    this._hud.genreButtons = [];
 
    genres.forEach((genre) => {
      const config = GENRE_BUILDINGS[genre] || GENRE_BUILDINGS.Other;
      const button = this.add.text(x, y, `${config.emoji} ${config.label}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '6px',
        color:      '#e6d4ff',
        backgroundColor: '#29144b',
        padding: { x: 6, y: 4 },
      }).setInteractive({ useHandCursor: true });
      button.genre = genre;
      button.on('pointerdown', () => this._selectGenre(genre));
      this._hud.genreButtons.push(button);
      x += button.width + 12;
    });
 
    const hint = this.add.text(10, 88, 'Choisis un style, puis clique sur + pour poser ton bâtiment.', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#d1b2ff',
      wordWrap:   { width: 360 },
    });
    hint.setDepth(10);
    this._hud.selectorHint = hint;
 
    this._selectGenre(this._selectedGenre);
  }
 
  // ── Panneau de livres sur le côté ─────────────────────────
  _createSideBookPanel(W) {
    const panelWidth = 170;
    const panelX = W - panelWidth - 10;
    const panelY = 50;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e0a32, 0.95);
    panelBg.fillRect(panelX, panelY, panelWidth, 180);
    panelBg.lineStyle(2, 0xff79c6, 1);
    panelBg.strokeRect(panelX, panelY, panelWidth, 180);
    panelBg.setScrollFactor(0);
    this._hud.sidePanelBg = panelBg;
 
    const title = this.add.text(panelX + panelWidth / 2, panelY + 8, '📚 MES LIVRES', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '8px',
      color:      '#ffb8f1',
    }).setOrigin(0.5, 0);
    title.setScrollFactor(0);
    this._hud.sidePanelTitle = title;
 
    this._hud.sideItems = [];
    for (let i = 0; i < 3; i += 1) {
      const item = this.add.text(panelX + 8, panelY + 30 + i * 45, '', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '6px',
        color:      '#d7c0ff',
        wordWrap:   { width: panelWidth - 16 },
      }).setScrollFactor(0);
      this._hud.sideItems.push(item);
    }
 
    const openLibrary = this.add.text(panelX + panelWidth / 2, panelY + 160, 'Voir toute la bibliothèque', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#ffb8f1',
      align:      'center',
      wordWrap:   { width: panelWidth - 12 },
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    openLibrary.on('pointerdown', () => this.scene.launch('BookScene'));
    openLibrary.on('pointerover', () => openLibrary.setColor('#fff5ff'));
    openLibrary.on('pointerout', () => openLibrary.setColor('#ffb8f1'));
    openLibrary.setScrollFactor(0);
    this._hud.sideLibraryLink = openLibrary;
  }
 
  _refreshSidePanel() {
    const data = saveSystem.getData();
    const books = [...data.books].reverse().slice(0, 3);
 
    if (books.length === 0) {
      this._hud.sideItems.forEach((item, index) => {
        item.setText(index === 0 ? 'Aucun livre pour le moment...' : '');
      });
      return;
    }
 
    this._hud.sideItems.forEach((item, index) => {
      const book = books[index];
      if (!book) {
        item.setText('');
        return;
      }
      const config = GENRE_BUILDINGS[book.genre] || GENRE_BUILDINGS.Other;
      const shortTitle = book.title.length > 18 ? book.title.substring(0, 16) + '…' : book.title;
      const text = `${config.emoji} ${shortTitle}\n${book.pages}p • ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}`;
      item.setText(text);
    });
  }
 
  _selectGenre(genre) {
    this._selectedGenre = genre;
    this._hud.genreButtons?.forEach((button) => {
      const isActive = button.genre === genre;
      button.setStyle({
        backgroundColor: isActive ? '#ff79c6' : '#2a0e45',
        color:           isActive ? '#1a0a2a' : '#f4c0ff',
        borderColor:     isActive ? '#ffb8f1' : '#5f2a7f',
      });
    });
    const genreSelect = document.getElementById('input-genre');
    if (genreSelect) genreSelect.value = genre;
  }
 
  _checkPlayerName() {
    const data = saveSystem.getData();
    const name = data.player?.name || '';
    if (!name || name === 'Lecteur') {
      this._openNameOverlay();
    } else {
      if (this._hud.nameLabel) this._hud.nameLabel.setText(`Hello, ${name}`);
    }
  }
 
  _openNameOverlay() {
    const overlay = document.getElementById('player-name-overlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => {
        document.getElementById('input-player-name')?.focus();
      }, 100);
    }
  }
 
  _bindNameOverlayEvents() {
    const saveBtn = document.getElementById('btn-save-name');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this._savePlayerName());
    }
    const input = document.getElementById('input-player-name');
    if (input) {
      input.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') this._savePlayerName();
      });
    }
  }
 
  _savePlayerName() {
    const input = document.getElementById('input-player-name');
    const name = input?.value.trim() || 'Lecteur';
    const data = saveSystem.getData();
    data.player.name = name;
    saveSystem.save(data);
    if (this._hud.nameLabel) this._hud.nameLabel.setText(`Hello, ${name}`);
    const overlay = document.getElementById('player-name-overlay');
    if (overlay) overlay.classList.remove('active');
  }
 
  // ── Bouton flottant "+" en bas à droite ───────────────────
  _createAddButton(W) {
    const H = this.scale.height;
    const BX = W - 30;
    const BY = H - 30;
 
    // Fond du bouton (cercle pixel art = rectangle arrondi)
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xf0c040, 1);
    btnBg.fillRect(BX - 20, BY - 20, 40, 40);
    btnBg.lineStyle(3, 0x8b6914, 1);
    btnBg.strokeRect(BX - 20, BY - 20, 40, 40);
    this._hud.btnBg = btnBg;
 
    // Icône "+"
    const btnIcon = this.add.text(BX, BY, '+', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '18px',
      color:      '#1a1a2e',
    }).setOrigin(0.5);
    this._hud.btnIcon = btnIcon;
 
    // Zone cliquable / tappable
    const hitArea = this.add.rectangle(BX, BY, 44, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });
 
    hitArea.on('pointerdown', () => this._openForm());
    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xffd060, 1);
      btnBg.fillRect(BX - 22, BY - 22, 44, 44);
      btnBg.lineStyle(3, 0xf0c040, 1);
      btnBg.strokeRect(BX - 22, BY - 22, 44, 44);
    });
    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xf0c040, 1);
      btnBg.fillRect(BX - 20, BY - 20, 40, 40);
      btnBg.lineStyle(3, 0x8b6914, 1);
      btnBg.strokeRect(BX - 20, BY - 20, 40, 40);
    });
 
    // Animation de pulsation
    this.tweens.add({
      targets:    [btnBg, btnIcon],
      scaleX:     1.05,
      scaleY:     1.05,
      duration:   800,
      yoyo:       true,
      repeat:     -1,
      ease:       'Sine.easeInOut',
    });
 
    this._hud.addBtn = hitArea;
  }
 
  // ── Ouvrir le formulaire HTML d'ajout de livre ────────────
  _openForm() {
    const genreSelect = document.getElementById('input-genre');
    if (genreSelect) genreSelect.value = this._selectedGenre;
    const overlay = document.getElementById('book-form-overlay');
    if (overlay) {
      overlay.classList.add('active');
      // Focus sur le premier champ
      setTimeout(() => {
        const titleInput = document.getElementById('input-title');
        if (titleInput) titleInput.focus();
      }, 100);
    }
  }
 
  // ── Fermer le formulaire HTML ──────────────────────────────
  _closeForm() {
    const overlay = document.getElementById('book-form-overlay');
    if (overlay) overlay.classList.remove('active');
    this._resetForm();
  }
 
  // ── Réinitialiser le formulaire ───────────────────────────
  _resetForm() {
    const inputs = ['input-title', 'input-author', 'input-pages'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const genre = document.getElementById('input-genre');
    if (genre) genre.value = this._selectedGenre;
    this._setRating(3);
  }
 
  // ── Lier les événements du formulaire HTML ─────────────────
  _bindFormEvents() {
    // Bouton Annuler
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this._closeForm());
    }
 
    // Bouton Soumettre
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this._submitForm());
    }
 
    // Étoiles de notation
    const starBtns = document.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this._setRating(Number(btn.dataset.value));
      });
    });
 
    // Changement de genre via le formulaire
    const genreSelect = document.getElementById('input-genre');
    if (genreSelect) {
      genreSelect.value = this._selectedGenre;
      genreSelect.addEventListener('change', () => {
        this._selectedGenre = genreSelect.value;
      });
    }
 
    // Initialiser la notation à 3 étoiles
    this._setRating(3);
 
    // Fermer en cliquant hors du formulaire
    const overlay = document.getElementById('book-form-overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this._closeForm();
      });
    }
  }
 
  // ── Mettre à jour les étoiles visuelles ───────────────────
  _setRating(value) {
    this._currentRating = value;
    const hiddenInput   = document.getElementById('input-rating');
    if (hiddenInput) hiddenInput.value = value;
 
    document.querySelectorAll('.star-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.value) <= value);
    });
  }
 
  // ── Soumettre le formulaire et créer le bâtiment ──────────
  _submitForm() {
    // ── Récupérer les valeurs ──────────────────────────────
    const title  = document.getElementById('input-title')?.value?.trim();
    const author = document.getElementById('input-author')?.value?.trim() || '';
    const pages  = parseInt(document.getElementById('input-pages')?.value || '0', 10);
    const genre  = document.getElementById('input-genre')?.value || 'Other';
    const rating = this._currentRating;
 
    // ── Validation ────────────────────────────────────────
    if (!title) {
      this._showToast('❌ Le titre est obligatoire !', '#ff4040');
      return;
    }
    if (!pages || pages < 1) {
      this._showToast('❌ Nombre de pages invalide !', '#ff4040');
      return;
    }
 
    // ── Calcul des récompenses ────────────────────────────
    const rewards = calculateRewards(pages, rating);
 
    // ── Sauvegarder et obtenir les objets créés ───────────
    const { book, building } = saveSystem.addBook(
      { title, author, pages, genre, rating },
      rewards
    );
 
    // ── Fermer le formulaire ──────────────────────────────
    this._closeForm();
 
    // ── Notifier WorldScene d'ajouter le bâtiment ─────────
    this.game.events.emit('book-added', { book, building });
 
    // ── Rafraîchir le HUD ─────────────────────────────────
    this._refreshHUD();
    this._refreshSidePanel();
 
    // ── Afficher la notification de récompenses ───────────
    this._showRewardNotification(rewards, title);
 
    // ── Vérifier les succès ───────────────────────────────
    this.rewardSystem.grantBookRewards({ title, author, pages, genre, rating });
 
    console.log(`[UIScene] Livre ajouté : "${title}" | +${rewards.xp} XP | +${rewards.gold} Or`);
  }
 
  // ── Notification de récompenses animée ────────────────────
  _showRewardNotification(rewards, bookTitle) {
    const W = this.scale.width;
    const H = this.scale.height;
 
    // Panneau principal
    const panel = this.add.container(W / 2, H / 2 - 20).setDepth(200);
 
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 0.97);
    bg.fillRect(-120, -60, 240, 120);
    bg.lineStyle(3, 0xf0c040, 1);
    bg.strokeRect(-120, -60, 240, 120);
    panel.add(bg);
 
    // Titre
    panel.add(this.add.text(0, -45, '📚 LECTURE VALIDÉE !', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '7px',
      color:      '#f0c040',
    }).setOrigin(0.5));
 
    // Titre du livre (tronqué si trop long)
    const shortTitle = bookTitle.length > 18 ? bookTitle.substring(0, 16) + '…' : bookTitle;
    panel.add(this.add.text(0, -28, `"${shortTitle}"`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#c0c0e0',
    }).setOrigin(0.5));
 
    // Récompenses
    panel.add(this.add.text(0, -10, `⚡ +${rewards.xp} XP`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '9px',
      color:      '#80d0ff',
    }).setOrigin(0.5));
 
    panel.add(this.add.text(0, 10, `💰 +${rewards.gold} Or`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '9px',
      color:      '#f0c040',
    }).setOrigin(0.5));
 
    panel.add(this.add.text(0, 32, rewards.bonus, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '5px',
      color:      '#80ff80',
    }).setOrigin(0.5));
 
    // Animation d'entrée
    panel.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets:  panel,
      alpha:    1,
      scaleX:   1,
      scaleY:   1,
      duration: 300,
      ease:     'Back.easeOut',
    });
 
    // Auto-fermeture
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets:  panel,
        alpha:    0,
        y:        H / 2 - 60,
        duration: 400,
        ease:     'Sine.easeIn',
        onComplete: () => panel.destroy(),
      });
    });
  }
 
  // ── Toast de notification HTML (erreurs, succès) ──────────
  _showToast(message, color = '#2ecc71') {
    const toast = document.getElementById('toast');
    if (!toast) return;
 
    toast.textContent = message;
    toast.style.background = color;
    toast.classList.add('show');
 
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
 
  // ── Rafraîchir les valeurs du HUD depuis la sauvegarde ────
  _refreshHUD() {
    const data       = saveSystem.getData();
    const levelInfo  = calculateLevel(data.player.xp);
 
    if (this._hud.nameLabel) {
      const name = data.player?.name || 'Lecteur';
      this._hud.nameLabel.setText(`Hello, ${name}`);
    }
    if (this._hud.xpLabel) {
      this._hud.xpLabel.setText(`⚡ ${data.player.xp} XP`);
    }
    if (this._hud.goldLabel) {
      this._hud.goldLabel.setText(`💰 ${data.player.gold}`);
    }
    if (this._hud.levelLabel) {
      this._hud.levelLabel.setText(`Niv.${levelInfo.level}`);
    }
 
    this._drawXPBar(levelInfo.progress || 0);
  }
 
  // ── Redimensionnement (changement d'orientation) ──────────
  _onResize(gameSize) {
    // Phaser recalcule automatiquement la taille du canvas.
    // On doit juste repositionner les éléments HUD fixes.
    // Pour une version complète, recréer les éléments HUD ici.
    console.log('[UIScene] Redimensionnement :', gameSize.width, 'x', gameSize.height);
  }
}