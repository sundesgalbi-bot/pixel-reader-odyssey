// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/systems/SaveSystem.js
// Rôle    : Gestion de la sauvegarde locale via localStorage.
//           Les données restent sur le téléphone/navigateur de l'utilisateur.
//           Aucun serveur requis — compatible GitHub Pages.
// ─────────────────────────────────────────────────────────────────────────────
 
const SAVE_KEY    = 'pixel_reader_save_v1'; // Clé localStorage (versionnée)
const SAVE_VERSION = 1;                     // Incrémente si la structure change
 
// ── État par défaut (nouvelle partie) ────────────────────────────────────────
const DEFAULT_STATE = {
  version:   SAVE_VERSION,
  createdAt: null,        // Date de création du monde
  updatedAt: null,        // Dernière modification
 
  // Monnaie
  xp:   0,
  gold: 0,
 
  // Bibliothèque : liste des livres enregistrés
  // Structure d'un livre :
  // { id, title, author, pages, genre, rating, addedAt }
  books: [],
 
  // État du monde : bâtiments placés sur la grille
  // Structure d'un bâtiment :
  // { id, genre, tileX, tileY, level, pagesContributed }
  buildings: [],
 
  // Statistiques globales
  stats: {
    totalBooksRead:  0,
    totalPagesRead:  0,
    totalXpEarned:   0,
    totalGoldEarned: 0,
    // Pages lues par genre (pour calculer l'évolution des bâtiments)
    pagesByGenre: {},
  },
};
 
// ─────────────────────────────────────────────────────────────────────────────
//  Classe SaveSystem
// ─────────────────────────────────────────────────────────────────────────────
export default class SaveSystem {
 
  // Référence en mémoire de l'état courant (cache pour éviter les lectures répétées)
  static _state = null;
 
  // ── init : charge ou crée une nouvelle sauvegarde ────────────────────────
  static init() {
    const saved = this._readFromStorage();
 
    if (saved && saved.version === SAVE_VERSION) {
      // Sauvegarde existante et compatible — on la charge
      this._state = saved;
      console.log('[SaveSystem] Sauvegarde chargée.', {
        livres: saved.books.length,
        bâtiments: saved.buildings.length,
        xp: saved.xp,
        or: saved.gold,
      });
    } else if (saved && saved.version !== SAVE_VERSION) {
      // Sauvegarde d'une version antérieure — migration
      console.warn('[SaveSystem] Version obsolète, migration en cours...');
      this._state = this._migrate(saved);
      this.save();
    } else {
      // Première visite : état vierge
      console.log('[SaveSystem] Première visite — création d\'un nouveau monde !');
      this._state = this._createFreshState();
      this.save();
    }
 
    return this._state;
  }
 
  // ── Lecture de l'état courant ─────────────────────────────────────────────
  static getState() {
    if (!this._state) this.init();
    return this._state;
  }
 
  // ── Sauvegarde l'état courant dans localStorage ───────────────────────────
  static save() {
    if (!this._state) return false;
 
    this._state.updatedAt = new Date().toISOString();
 
    try {
      const json = JSON.stringify(this._state);
      localStorage.setItem(SAVE_KEY, json);
      return true;
    } catch (err) {
      // localStorage plein (quota ~5 Mo sur la plupart des navigateurs)
      console.error('[SaveSystem] Erreur de sauvegarde :', err);
      return false;
    }
  }
 
  // ── Ajoute un livre et met à jour les statistiques ────────────────────────
  /**
   * @param {Object} bookData - { title, author, pages, genre, rating }
   * @returns {{ xpGained, goldGained, newBuildingLevel }} Récompenses obtenues
   */
  static addBook(bookData) {
    const state = this.getState();
 
    // ── 1. Créer l'entrée livre ───────────────────────────────────────────
    const book = {
      id:      `book_${Date.now()}`,
      title:   bookData.title  || 'Livre sans titre',
      author:  bookData.author || 'Auteur inconnu',
      pages:   parseInt(bookData.pages)  || 0,
      genre:   bookData.genre  || 'NonFiction',
      rating:  parseInt(bookData.rating) || 3,
      addedAt: new Date().toISOString(),
    };
 
    // ── 2. Calculer les récompenses ───────────────────────────────────────
    const { xp, gold } = calculateRewards(book.pages, book.rating, book.genre);
 
    // ── 3. Mettre à jour l'état ───────────────────────────────────────────
    state.books.push(book);
    state.xp   += xp;
    state.gold += gold;
 
    // Statistiques globales
    state.stats.totalBooksRead++;
    state.stats.totalPagesRead  += book.pages;
    state.stats.totalXpEarned   += xp;
    state.stats.totalGoldEarned += gold;
 
    // Pages par genre
    if (!state.stats.pagesByGenre[book.genre]) {
      state.stats.pagesByGenre[book.genre] = 0;
    }
    state.stats.pagesByGenre[book.genre] += book.pages;
 
    // ── 4. Niveau de bâtiment calculé côté appelant (WorldScene) ───────────
    const pagesInGenre = state.stats.pagesByGenre[book.genre];
 
    // ── 5. Sauvegarder ───────────────────────────────────────────────────
    this.save();
 
    console.log(`[SaveSystem] Livre ajouté : "${book.title}" → +${xp} XP, +${gold} Or`);
 
    return { xp, gold, bookId: book.id, pagesInGenre };
  }
 
  // ── Place un bâtiment sur la grille ──────────────────────────────────────
  /**
   * @param {string} genre  - Genre du bâtiment
   * @param {number} tileX  - Position X sur la grille
   * @param {number} tileY  - Position Y sur la grille
   * @param {number} level  - Niveau du bâtiment (0-4)
   */
  static placeBuilding(genre, tileX, tileY, level = 0) {
    const state = this.getState();
 
    // Vérifie qu'aucun bâtiment n'occupe déjà cette case
    const occupied = state.buildings.some(b => b.tileX === tileX && b.tileY === tileY);
    if (occupied) {
      console.warn(`[SaveSystem] Case (${tileX}, ${tileY}) déjà occupée !`);
      return null;
    }
 
    const building = {
      id:    `bld_${Date.now()}`,
      genre,
      tileX,
      tileY,
      level,
    };
 
    state.buildings.push(building);
    this.save();
 
    return building;
  }
 
  // ── Met à jour le niveau d'un bâtiment ───────────────────────────────────
  static upgradeBuilding(buildingId, newLevel) {
    const state    = this.getState();
    const building = state.buildings.find(b => b.id === buildingId);
 
    if (!building) {
      console.warn(`[SaveSystem] Bâtiment "${buildingId}" introuvable.`);
      return false;
    }
 
    building.level = newLevel;
    this.save();
 
    return true;
  }
 
  // ── Réinitialise complètement la sauvegarde ───────────────────────────────
  static reset() {
    this._state = this._createFreshState();
    this.save();
    console.log('[SaveSystem] Monde réinitialisé.');
  }
 
  // ── Exporte la sauvegarde en JSON (pour backup manuel) ───────────────────
  static export() {
    return JSON.stringify(this.getState(), null, 2);
  }
 
  // ── Importe une sauvegarde JSON ───────────────────────────────────────────
  static import(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      this._state = data;
      this.save();
      return true;
    } catch {
      console.error('[SaveSystem] Import invalide.');
      return false;
    }
  }
 
  // ══════════════════════════════════════════════════════════════════════════
  //  Méthodes privées
  // ══════════════════════════════════════════════════════════════════════════
 
  static _readFromStorage() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
 
  static _createFreshState() {
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)), // Deep clone
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
 
  /** Migration simple : fusionne les données existantes dans le nouveau schéma */
  static _migrate(oldData) {
    console.log(`[SaveSystem] Migration v${oldData.version} → v${SAVE_VERSION}`);
    return {
      ...this._createFreshState(),
      books:     oldData.books     || [],
      buildings: oldData.buildings || [],
      xp:        oldData.xp        || 0,
      gold:      oldData.gold      || 0,
      version:   SAVE_VERSION,
    };
  }
}
 
// ─────────────────────────────────────────────────────────────────────────────
//  Fonction standalone exportée : calculateRewards
//  (aussi importable directement depuis d'autres modules)
// ─────────────────────────────────────────────────────────────────────────────
 
/**
 * Calcule les récompenses XP et Or pour un livre lu.
 *
 * Formule :
 *   XP de base  = pages × 10
 *   Or de base  = pages × 5
 *   Multiplicateur de note : ★1=0.7 | ★2=0.9 | ★3=1.0 | ★4=1.3 | ★5=1.8
 *   Bonus de genre : défini dans GENRE_CONFIG
 *
 * @param {number} pages   - Nombre de pages du livre
 * @param {number} rating  - Note de 1 à 5
 * @param {string} genre   - Genre du livre (clé de GENRE_CONFIG)
 * @returns {{ xp: number, gold: number }}
 */
export function calculateRewards(pages, rating = 3, genre = 'NonFiction') {
  const PAGE_TO_XP   = 10;
  const PAGE_TO_GOLD = 5;
 
  // Multiplicateurs selon la note personnelle
  const RATING_MULT = {
    1: 0.7,   // Livre décevant — peu motivant
    2: 0.9,   // Livre moyen
    3: 1.0,   // Livre correct
    4: 1.3,   // Excellent livre
    5: 1.8,   // Chef d'œuvre — récompense généreuse
  };
 
  // Récupère les multiplicateurs du genre (valeur par défaut = 1.0)
  let genreXpMult  = 1.0;
  let genreGoldMult = 1.0;
 
  // Import synchrone depuis le dictionnaire (déjà en mémoire module)
  // Note : on ne peut pas faire d'import dynamique ici, on utilise
  // une copie inline des multiplicateurs pour éviter les dépendances circulaires
  const GENRE_MULTS = {
    Fantasy:    { xp: 1.2, gold: 1.0 },
    SciFi:      { xp: 1.1, gold: 1.2 },
    Policier:   { xp: 1.0, gold: 1.1 },
    Romance:    { xp: 1.0, gold: 1.0 },
    NonFiction: { xp: 1.3, gold: 1.1 },
    Horreur:    { xp: 1.1, gold: 1.2 },
    Histoire:   { xp: 1.2, gold: 1.3 },
    DevPerso:   { xp: 1.4, gold: 1.2 },
  };
 
  if (GENRE_MULTS[genre]) {
    genreXpMult   = GENRE_MULTS[genre].xp;
    genreGoldMult = GENRE_MULTS[genre].gold;
  }
 
  const ratingMult = RATING_MULT[rating] ?? 1.0;
 
  const xp   = Math.floor(pages * PAGE_TO_XP   * ratingMult * genreXpMult);
  const gold = Math.floor(pages * PAGE_TO_GOLD  * ratingMult * genreGoldMult);
 
  return { xp, gold };
}
 