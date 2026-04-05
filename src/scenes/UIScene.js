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
import { calculateRewards, calculateLevel } from '../config/GameConfig.js';
 
export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
 
    // Référence aux éléments HUD Phaser
    this._hud = {};
 
    // Système de récompenses
    this.rewardSystem = new RewardSystem(this);
 
    // Note actuelle dans le formulaire
    this._currentRating = 3;
  }
 
  // ── create : Construction du HUD ──────────────────────────
  create() {
    const W = this.scale.width;
 
    // ── Barre supérieure ─────────────────────────────────────
    this._createTopBar(W);
 
    // ── Bouton flottant "+" ───────────────────────────────────
    this._createAddButton(W);
 
    // ── Attacher les événements du formulaire HTML ────────────
    this._bindFormEvents();
 
    // ── Mise à jour initiale du HUD ───────────────────────────
    this._refreshHUD();
 
    // ── Écouter les redimensionnements ────────────────────────
    this.scale.on('resize', this._onResize, this);
 
    console.log('[UIScene] ✅ HUD chargé.');
  }
 
  // ── Barre de statut en haut de l'écran ────────────────────
  _createTopBar(W) {
    // Fond semi-transparent de la barre
    const barBg = this.add.graphics();
    barBg.fillStyle(0x0a0a1e, 0.85);
    barBg.fillRect(0, 0, W, 36);
    barBg.lineStyle(1, 0xf0c040, 0.5);
    barBg.strokeRect(0, 35, W, 1);
    this._hud.barBg = barBg;
 
    // ── XP ────────────────────────────────────────────────────
    this._hud.xpLabel = this.add.text(8, 8, '⚡ XP: 0', {
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
 
  // ── Barre XP colorée ──────────────────────────────────────
  _drawXPBar(progress) {
    const W = this.scale.width;
    this._hud.xpBar.clear();
    this._hud.xpBar.fillStyle(0x60a0ff, 1);
    this._hud.xpBar.fillRect(0, 36, W * progress, 4);
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
    if (genre) genre.selectedIndex = 0;
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
 
    if (this._hud.xpLabel) {
      this._hud.xpLabel.setText(`⚡ ${data.player.xp} XP`);
    }
    if (this._hud.goldLabel) {
      this._hud.goldLabel.setText(`💰 ${data.player.gold}`);
    }
    if (this._hud.levelLabel) {
      this._hud.levelLabel.setText(`Niv.${levelInfo.level}`);
    }
 
    this._drawXPBar(levelInfo.progress);
  }
 
  // ── Redimensionnement (changement d'orientation) ──────────
  _onResize(gameSize) {
    // Phaser recalcule automatiquement la taille du canvas.
    // On doit juste repositionner les éléments HUD fixes.
    // Pour une version complète, recréer les éléments HUD ici.
    console.log('[UIScene] Redimensionnement :', gameSize.width, 'x', gameSize.height);
  }
}