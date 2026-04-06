/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Scène UI (HUD + Sélection)
 *  src/scenes/UIScene.js
 *
 *  Superposée par-dessus WorldScene (ne scroll pas).
 *  Contient :
 *   - Écran d'accueil "Choose your adventure" (sélection de cours)
 *   - HUD centralisé avec avatar + stats
 *   - Formulaire d'ajout de livre
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
    this._homeScreen = {};
 
    // Système de récompenses
    this.rewardSystem = new RewardSystem(this);
 
    // Note actuelle dans le formulaire
    this._currentRating = 3;
    this._selectedGenre = 'Romance';
    
    // État UI
    this._gameStarted = false;
  }
 
  // ── create : Initialisation ───────────────────────────────
  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    
    // Attacher les événements du formulaire HTML
    this._bindFormEvents();
    this._bindNameOverlayEvents();
 
    // Vérifier si on a un joueur
    const data = saveSystem.getData();
    if (!data.player?.name || data.player.name === 'Lecteur') {
      this._openNameOverlay();
    }
    
    // Montrer l'écran d'accueil au chargement
    this._createHomeScreen(W, H);
    
    // Bouton flottant "+" (toujours présent)
    this._createAddButton(W, H);
 
    // ── Écouter les redimensionnements ────────────────────────
    this.scale.on('resize', this._onResize, this);
 
    console.log('[UIScene] ✅ UI chargée.');
  }
 
  // ── Écran d'accueil + sélection de cours ──────────────────
  _createHomeScreen(W, H) {
    // Titre "Choose your adventure"
    const title = this.add.text(W / 2, 40, 'Choose your adventure', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '32px',
      color:      '#ffffff',
      align:      'center',
      shadow: { offsetX: 3, offsetY: 3, color: '#00ffff', blur: 0, fill: true },
    }).setOrigin(0.5, 0).setScrollFactor(0);
    this._homeScreen.title = title;
 
    // Cards pour chaque genre
    const genres = ['Romance', 'Fantasy', 'Sci-Fi', 'Mystery', 'Self-Help'];
    const cardWidth = 120;
    const cardHeight = 160;
    const spacing = 20;
    const totalWidth = genres.length * (cardWidth + spacing) - spacing;
    const startX = (W - totalWidth) / 2;
    const startY = H / 2 - 40;
 
    this._homeScreen.cards = [];
 
    genres.forEach((genre, index) => {
      const cardX = startX + index * (cardWidth + spacing);
      const cardY = startY;
 
      // Fond du card
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1e0a32, 0.9);
      cardBg.fillRect(cardX, cardY, cardWidth, cardHeight);
      cardBg.lineStyle(2, 0xff79c6, 1);
      cardBg.strokeRect(cardX, cardY, cardWidth, cardHeight);
      cardBg.setScrollFactor(0);
 
      // Emoji/icône
      const emoji = GENRE_BUILDINGS[genre]?.emoji || '📚';
      const emojiText = this.add.text(cardX + cardWidth / 2, cardY + 30, emoji, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '48px',
        align:      'center',
      }).setOrigin(0.5).setScrollFactor(0);
 
      // Titre du genre
      const genreTitle = this.add.text(cardX + cardWidth / 2, cardY + 90, genre, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '14px',
        color:      '#ffb8f1',
        align:      'center',
        wordWrap:   { width: cardWidth - 6 },
      }).setOrigin(0.5).setScrollFactor(0);
 
      // Bouton "Get started"
      const btnY = cardY + cardHeight - 25;
      const btn = this.add.text(cardX + cardWidth / 2, btnY, 'Get started', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '10px',
        color:      '#000000',
        backgroundColor: '#ffff66',
        padding: { x: 8, y: 4 },
        align:      'center',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setScrollFactor(0);
 
      btn.on('pointerdown', () => this._startGame(genre));
      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ffff99' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#ffff66' }));
 
      this._homeScreen.cards.push({ bg: cardBg, emoji: emojiText, title: genreTitle, btn });
    });
  }
 
  // ── Démarrer le jeu avec un cours sélectionné ─────────────
  _startGame(genre) {
    this._selectedGenre = genre;
    this._gameStarted = true;
 
    // Nettoyer l'écran d'accueil
    Object.values(this._homeScreen).forEach(obj => {
      if (obj.destroy) obj.destroy();
      else if (Array.isArray(obj)) {
        obj.forEach(card => {
          Object.values(card).forEach(el => { if (el.destroy) el.destroy(); });
        });
      }
    });
    this._homeScreen = {};
 
    // Créer le HUD du jeu
    this._createWorldHUD();
 
    console.log(`[UIScene] 🎮 Jeu démarré avec le genre: ${genre}`);
  }
 
  // ── HUD Centralisé (Monde) ────────────────────────────────
  _createWorldHUD() {
    const W = this.scale.width;
    const H = this.scale.height;
    
    const data = saveSystem.getData();
    const playerName = data.player?.name || 'Lecteur';
    const levelData = calculateLevel(data.player?.xp || 0);
 
    // ── Avatar au centre-gauche ──────────────────────────────
    const avatarX = 120;
    const avatarY = H / 2;
    this._createPlayerAvatarLarge(avatarX, avatarY);
 
    // Player name + level au-dessus de l'avatar
    const playerLabel = this.add.text(avatarX, avatarY - 90, playerName, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '16px',
      color:      '#ffffff',
      align:      'center',
      shadow: { offsetX: 2, offsetY: 2, color: '#ff79c6', blur: 0, fill: true },
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.playerLabel = playerLabel;
 
    const levelLabel = this.add.text(avatarX, avatarY - 70, `Level ${levelData.level}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '12px',
      color:      '#ffff66',
      align:      'center',
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.levelLabel = levelLabel;
 
    // ── Statistiques (droite de l'avatar) ────────────────────
    const statsX = 280;
    const statsY = H / 2 - 80;
    const statsPanelW = 200;
    const statsPanelH = 40;
    const spacing = 50;
 
    // Course Progress
    this._createStatPanel(statsX, statsY, statsPanelW, statsPanelH, 
      'Course Progress',
      [
        `Exercises: ${data.stats?.exercises || 0} / 43`,
        `Projects: ${data.stats?.projects || 0} / 2`,
        `XP Progress: ${levelData.xpThisLevel} / ${levelData.xpToNext}`,
      ]
    );
 
    // Total XP + Badges
    this._createStatPanel(statsX + statsPanelW + spacing, statsY, statsPanelW, statsPanelH,
      'Achievements',
      [
        `Total XP: ${data.player?.xp || 0}`,
        `Badges: ${data.stats?.badges || 0} / 8`,
        `Daily Streak: ${data.stats?.streak || 0} days`,
      ]
    );
 
    // ── Boutons infos en bas ─────────────────────────────────
    const bottomY = H - 60;
    
    const statsBtn = this.add.text(150, bottomY, 'EXERCISES\n' + (data.stats?.exercises || 0), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '11px',
      color:      '#00ffff',
      backgroundColor: '#1e0a32',
      padding: { x: 10, y: 8 },
      align:      'center',
      lineSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.statsBtn = statsBtn;
    
    const xpBtn = this.add.text(300, bottomY, 'TOTAL XP\n' + (data.player?.xp || 0), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '11px',
      color:      '#ffff66',
      backgroundColor: '#1e0a32',
      padding: { x: 10, y: 8 },
      align:      'center',
      lineSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.xpBtn = xpBtn;
    
    const badgesBtn = this.add.text(450, bottomY, 'BADGES\n' + (data.stats?.badges || 0), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '11px',
      color:      '#00ff00',
      backgroundColor: '#1e0a32',
      padding: { x: 10, y: 8 },
      align:      'center',
      lineSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.badgesBtn = badgesBtn;
    
    const streakBtn = this.add.text(600, bottomY, 'DAILY STREAK\n' + (data.stats?.streak || 0), {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '11px',
      color:      '#ff99ff',
      backgroundColor: '#1e0a32',
      padding: { x: 10, y: 8 },
      align:      'center',
      lineSpacing: 2,
    }).setOrigin(0.5).setScrollFactor(0);
    this._hud.streakBtn = streakBtn;
  }
 
  // ── Créer un panneau de statistiques ──────────────────────
  _createStatPanel(x, y, w, h, title, stats) {
    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(0x1e0a32, 0.95);
    bg.fillRect(x, y, w, h + 10);
    bg.lineStyle(2, 0x00ffff, 0.6);
    bg.strokeRect(x, y, w, h + 10);
    bg.setScrollFactor(0);
 
    // Titre
    const titleText = this.add.text(x + w / 2, y + 5, title, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#ffb8f1',
      align:      'center',
    }).setOrigin(0.5, 0).setScrollFactor(0);
 
    // Stats
    stats.forEach((stat, idx) => {
      this.add.text(x + 8, y + 20 + idx * 12, stat, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '7px',
        color:      '#d7c0ff',
        wordWrap:   { width: w - 16 },
      }).setScrollFactor(0);
    });
  }
 
  // ── Avatar pixel art géant ────────────────────────────────
  _createPlayerAvatarLarge(centerX, centerY) {
    const pixelSize = 4;
    const g = this.add.graphics();
    g.setScrollFactor(0);
 
    // Cheveux violets (en haut, plus grands)
    g.fillStyle(0xff66cc, 1);
    for (let x = -40; x <= 40; x += pixelSize) {
      for (let y = -50; y <= -20; y += pixelSize) {
        if (Math.abs(x) <= 40) g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    // Visage rose pêche
    g.fillStyle(0xffe5d8, 1);
    for (let x = -30; x <= 30; x += pixelSize) {
      for (let y = -20; y <= 30; y += pixelSize) {
        g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    // Yeux grands
    g.fillStyle(0x000000, 1);
    for (let i = -15; i <= -10; i += pixelSize) {
      for (let j = -10; j <= -5; j += pixelSize) {
        g.fillRect(centerX - 20 + i, centerY + j, pixelSize, pixelSize);
        g.fillRect(centerX + 20 + i, centerY + j, pixelSize, pixelSize);
      }
    }
 
    // Sourire
    for (let i = -10; i <= 10; i += pixelSize) {
      g.fillRect(centerX + i, centerY + 10, pixelSize, pixelSize);
    }
 
    // Vêtements colorés (rouge/orange)
    g.fillStyle(0xff6b6b, 1);
    for (let x = -35; x <= 35; x += pixelSize) {
      for (let y = 30; y <= 60; y += pixelSize) {
        g.fillRect(centerX + x, centerY + y, pixelSize, pixelSize);
      }
    }
 
    this._hud.avatar = g;
  }
 
  // ── Bouton flottant "+" en bas à droite ───────────────────
  _createAddButton(W, H) {
    const BX = W - 40;
    const BY = H - 40;
 
    // Fond du bouton
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xffff66, 1);
    btnBg.fillRect(BX - 20, BY - 20, 40, 40);
    btnBg.lineStyle(3, 0xc0c000, 1);
    btnBg.strokeRect(BX - 20, BY - 20, 40, 40);
    btnBg.setScrollFactor(0).setDepth(100);
    this._hud.btnBg = btnBg;
 
    // Icône "+"
    const btnIcon = this.add.text(BX, BY, '+', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '32px',
      color:      '#000000',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    this._hud.btnIcon = btnIcon;
 
    // Zone cliquable
    const hitArea = this.add.rectangle(BX, BY, 44, 44, 0xffffff, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(102);
 
    hitArea.on('pointerdown', () => this._openForm());
    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xffff99, 1);
      btnBg.fillRect(BX - 22, BY - 22, 44, 44);
      btnBg.lineStyle(3, 0xffff66, 1);
      btnBg.strokeRect(BX - 22, BY - 22, 44, 44);
    });
    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xffff66, 1);
      btnBg.fillRect(BX - 20, BY - 20, 40, 40);
      btnBg.lineStyle(3, 0xc0c000, 1);
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
 
    if (this._hud.statsBtn) {
      this._hud.statsBtn.setText('EXERCISES\n' + (data.stats?.exercises || 0));
    }
    if (this._hud.xpBtn) {
      this._hud.xpBtn.setText('TOTAL XP\n' + (data.player?.xp || 0));
    }
    if (this._hud.badgesBtn) {
      this._hud.badgesBtn.setText('BADGES\n' + (data.stats?.badges || 0));
    }
    if (this._hud.streakBtn) {
      this._hud.streakBtn.setText('DAILY STREAK\n' + (data.stats?.streak || 0));
    }
    if (this._hud.playerLabel) {
      const name = data.player?.name || 'Lecteur';
      this._hud.playerLabel.setText(name);
    }
    if (this._hud.levelLabel) {
      this._hud.levelLabel.setText(`Level ${levelInfo.level}`);
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
    const overlay = document.getElementById('player-name-overlay');
    if (overlay) overlay.classList.remove('active');
 
    // Mettre à jour le label si le jeu a démarré
    if (this._hud.playerLabel) {
      this._hud.playerLabel.setText(name);
    }
  }
 
  // ── Redimensionnement (changement d'orientation) ──────────
  _onResize(gameSize) {
    // Phaser recalcule automatiquement la taille du canvas.
    // Pour une version complète, recréer les éléments HUD ici.
    console.log('[UIScene] Redimensionnement :', gameSize.width, 'x', gameSize.height);
  }
}