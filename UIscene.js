
// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/scenes/UIScene.js
// Rôle    : HUD superposé (toujours visible).
//           Affiche XP, Or, nombre de livres.
//           Gère le formulaire HTML "Ajouter un livre" et ses interactions.
// ─────────────────────────────────────────────────────────────────────────────
 
import SaveSystem        from '../systems/SaveSystem.js';
import { calculateRewards } from '../systems/SaveSystem.js';
import { GENRE_CONFIG }  from '../data/GenreConfig.js';
 
export default class UIScene extends Phaser.Scene {
 
  constructor() {
    super({ key: 'UIScene', active: false }); // active:false = lancée via scene.launch()
 
    // Éléments Phaser du HUD
    this._hudXP   = null;
    this._hudGold = null;
    this._hudBooks = null;
    this._selectedRating = 3; // Note par défaut
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  create
  // ══════════════════════════════════════════════════════════════════════════
  create() {
    // ── HUD en haut de l'écran ────────────────────────────────────────────
    this._createHUD();
 
    // ── Bouton flottant "+" (bas droit) ───────────────────────────────────
    this._createAddButton();
 
    // ── Initialise le formulaire HTML ─────────────────────────────────────
    this._initHTMLForm();
 
    // ── Expose les fonctions au DOM (appelées depuis les boutons HTML) ─────
    window.submitBook    = () => this._onSubmitBook();
    window.closeBookForm = () => this._closeForm();
 
    // ── Rafraîchit le HUD quand la fenêtre est redimensionnée ────────────
    this.scale.on('resize', this._repositionHUD, this);
 
    console.log('[UIScene] HUD prêt.');
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  API publique : mise à jour du HUD
  // ══════════════════════════════════════════════════════════════════════════
 
  updateHUD() {
    const state = SaveSystem.getState();
    if (this._hudXP)    this._hudXP.setText(`✨ ${state.xp.toLocaleString()} XP`);
    if (this._hudGold)  this._hudGold.setText(`🪙 ${state.gold.toLocaleString()} Or`);
    if (this._hudBooks) this._hudBooks.setText(`📚 ${state.stats.totalBooksRead}`);
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Méthodes privées — HUD
  // ══════════════════════════════════════════════════════════════════════════
 
  _createHUD() {
    const state   = SaveSystem.getState();
    const W       = this.scale.width;
    const STYLE   = {
      fontSize:   '10px',
      fontFamily: 'Courier New, monospace',
      color:      '#EDE8FF',
      stroke:     '#1a1040',
      strokeThickness: 3,
    };
 
    // Fond semi-transparent de la barre HUD
    this._hudBg = this.add.graphics();
    this._hudBg.fillStyle(0x1a1040, 0.7);
    this._hudBg.fillRect(0, 0, W, 22);
    this._hudBg.setScrollFactor(0).setDepth(100);
 
    // Statistiques
    this._hudXP = this.add.text(8, 11, `✨ ${state.xp} XP`, STYLE)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
 
    this._hudGold = this.add.text(120, 11, `🪙 ${state.gold} Or`, STYLE)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
 
    this._hudBooks = this.add.text(230, 11, `📚 ${state.stats.totalBooksRead}`, STYLE)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);
 
    // Titre centré
    this.add.text(W / 2, 11, 'PIXEL-READER ODYSSEY', {
      fontSize:   '8px',
      fontFamily: 'Courier New, monospace',
      color:      '#AFA9EC',
      stroke:     '#1a1040',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);
  }
 
  _createAddButton() {
    const W = this.scale.width;
    const H = this.scale.height;
 
    // Bouton image (texture générée dans BootScene)
    this._addBtn = this.add.image(W - 44, H - 44, 'btn_add')
      .setScrollFactor(0)
      .setDepth(200)
      .setInteractive({ useHandCursor: true });
 
    // Animation de pulsation légère (attire l'attention)
    this.tweens.add({
      targets:  this._addBtn,
      scaleX:   1.08,
      scaleY:   1.08,
      duration: 900,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
 
    // Feedback tactile au clic
    this._addBtn.on('pointerdown', () => {
      this._addBtn.setScale(0.9);
    });
 
    this._addBtn.on('pointerup', () => {
      this._addBtn.setScale(1.0);
      this._openForm();
    });
  }
 
  _repositionHUD() {
    const W = this.scale.width;
    const H = this.scale.height;
    if (this._hudBg)  { this._hudBg.clear(); this._hudBg.fillStyle(0x1a1040, 0.7); this._hudBg.fillRect(0, 0, W, 22); }
    if (this._addBtn) { this._addBtn.setPosition(W - 44, H - 44); }
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Méthodes privées — Formulaire HTML
  // ══════════════════════════════════════════════════════════════════════════
 
  _initHTMLForm() {
    // Génère les étoiles de notation dynamiquement
    const container = document.getElementById('star-rating');
    if (!container) return;
 
    container.innerHTML = '';
    for (let i = 5; i >= 1; i--) {
      const input = document.createElement('input');
      input.type  = 'radio';
      input.name  = 'rating';
      input.id    = `star-${i}`;
      input.value = i;
      if (i === 3) input.checked = true; // Note par défaut = 3
 
      const label = document.createElement('label');
      label.htmlFor   = `star-${i}`;
      label.textContent = '★';
      label.title     = `${i} étoile${i > 1 ? 's' : ''}`;
 
      input.addEventListener('change', () => {
        this._selectedRating = i;
        this._updateStarsDisplay();
      });
 
      container.appendChild(input);
      container.appendChild(label);
    }
 
    // Prévisualisation de récompenses quand les valeurs changent
    const pagesInput = document.getElementById('f-pages');
    const genreSelect = document.getElementById('f-genre');
 
    const updatePreview = () => {
      const pages = parseInt(pagesInput?.value) || 0;
      const genre = genreSelect?.value || 'NonFiction';
      if (pages > 0) {
        const { xp, gold } = calculateRewards(pages, this._selectedRating, genre);
        // Affiche dans le bouton de soumission
        const btn = document.querySelector('.btn-primary');
        if (btn) btn.textContent = `CONSTRUIRE ! (+${xp} XP, +${gold} 🪙)`;
      }
    };
 
    pagesInput?.addEventListener('input', updatePreview);
    genreSelect?.addEventListener('change', updatePreview);
  }
 
  _updateStarsDisplay() {
    // Mise à jour visuelle des étoiles CSS via les inputs radio
    const inputs = document.querySelectorAll('#star-rating input[type="radio"]');
    inputs.forEach(input => {
      if (parseInt(input.value) === this._selectedRating) {
        input.checked = true;
      }
    });
  }
 
  _openForm() {
    // Remet le formulaire à zéro
    const fields = ['f-title', 'f-author', 'f-pages'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
 
    this._selectedRating = 3;
    this._updateStarsDisplay();
 
    const btn = document.querySelector('.btn-primary');
    if (btn) btn.textContent = 'CONSTRUIRE !';
 
    // Affiche l'overlay
    const overlay = document.getElementById('book-overlay');
    if (overlay) {
      overlay.classList.add('active');
      // Focus sur le champ titre pour faciliter la saisie mobile
      setTimeout(() => document.getElementById('f-title')?.focus(), 100);
    }
  }
 
  _closeForm() {
    const overlay = document.getElementById('book-overlay');
    if (overlay) overlay.classList.remove('active');
  }
 
  /**
   * Appelé quand l'utilisateur clique sur "CONSTRUIRE !".
   * Valide le formulaire, ajoute le livre et déclenche les effets.
   */
  _onSubmitBook() {
    // ── Lecture des valeurs ───────────────────────────────────────────────
    const title  = document.getElementById('f-title')?.value?.trim();
    const author = document.getElementById('f-author')?.value?.trim() || 'Auteur inconnu';
    const pages  = parseInt(document.getElementById('f-pages')?.value);
    const genre  = document.getElementById('f-genre')?.value;
    const rating = this._selectedRating;
 
    // ── Validation ────────────────────────────────────────────────────────
    if (!title) {
      this._shakeField('f-title');
      this._showToast('⚠️ Le titre est requis');
      return;
    }
    if (!pages || pages < 1 || pages > 9999) {
      this._shakeField('f-pages');
      this._showToast('⚠️ Nombre de pages invalide (1-9999)');
      return;
    }
 
    // ── Calcul des récompenses ────────────────────────────────────────────
    const { xp, gold } = calculateRewards(pages, rating, genre);
 
    // ── Sauvegarde ────────────────────────────────────────────────────────
    // Ajoute le livre (SaveSystem.addBook gère le côté async de l'import GenreConfig)
    const state = SaveSystem.getState();
 
    const book = {
      id:      `book_${Date.now()}`,
      title, author, pages, genre, rating,
      addedAt: new Date().toISOString(),
    };
 
    state.books.push(book);
    state.xp   += xp;
    state.gold += gold;
    state.stats.totalBooksRead++;
    state.stats.totalPagesRead  += pages;
    state.stats.totalXpEarned   += xp;
    state.stats.totalGoldEarned += gold;
 
    if (!state.stats.pagesByGenre[genre]) {
      state.stats.pagesByGenre[genre] = 0;
    }
    state.stats.pagesByGenre[genre] += pages;
 
    SaveSystem.save();
 
    // ── Fermeture du formulaire ───────────────────────────────────────────
    this._closeForm();
 
    // ── Mise à jour du HUD ────────────────────────────────────────────────
    this.updateHUD();
 
    // ── Notification ─────────────────────────────────────────────────────
    const cfg = GENRE_CONFIG[genre];
    this._showToast(`${cfg?.emoji ?? '📖'} "${title}" ajouté ! +${xp} XP, +${gold} 🪙`);
 
    // ── Notifie WorldScene via le bus global ──────────────────────────────
    this.game.events.emit('book-added', {
      genre, xp, gold,
      pagesInGenre: state.stats.pagesByGenre[genre],
      bookId:       book.id,
    });
 
    // ── Animation flottante sur le HUD ────────────────────────────────────
    this._spawnRewardText(`+${xp} XP`, 0xF2A623);
    this.time.delayedCall(300, () => this._spawnRewardText(`+${gold} Or`, 0xF2E68A));
 
    console.log(`[UIScene] Livre soumis : "${title}" — ${xp} XP, ${gold} Or`);
  }
 
  // ── Effets visuels ────────────────────────────────────────────────────────
 
  /** Fait vibrer un champ en cas d'erreur de validation */
  _shakeField(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.style.borderColor = '#E85D24';
    el.style.animation   = 'none';
 
    // Ajoute et retire une classe CSS pour déclencher la shake animation
    el.style.transform = 'translateX(-4px)';
    setTimeout(() => { el.style.transform = 'translateX(4px)'; },  80);
    setTimeout(() => { el.style.transform = 'translateX(-3px)'; }, 160);
    setTimeout(() => { el.style.transform = 'translateX(0)'; el.style.borderColor = ''; }, 240);
  }
 
  /** Affiche un toast de notification en bas de l'écran */
  _showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
 
    toast.textContent = message;
    toast.classList.add('show');
 
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
 
  /** Fait apparaître un texte flottant de récompense dans la scène Phaser */
  _spawnRewardText(text, color) {
    const W = this.scale.width;
    const H = this.scale.height;
 
    const t = this.add.text(W / 2, H / 2, text, {
      fontSize:   '14px',
      fontFamily: 'Courier New, monospace',
      color:      `#${color.toString(16).padStart(6, '0')}`,
      stroke:     '#1a1040',
      strokeThickness: 4,
      fontStyle:  'bold',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(500);
 
    this.tweens.add({
      targets:  t,
      y:        H / 2 - 60,
      alpha:    0,
      scale:    1.4,
      duration: 1200,
      ease:     'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
 