/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Système de suivi des lectures
 *  src/systems/BookTracker.js
 *
 *  Centralise toute la logique métier liée aux livres :
 *   - Validation des données d'un livre
 *   - Calcul de statistiques avancées
 *   - Détection des succès (achievements)
 *   - Filtrage et tri de la bibliothèque
 * ════════════════════════════════════════════════════════════
 */
 
import { saveSystem }    from './SaveSystem.js';
import { calculateLevel, GENRE_BUILDINGS } from '../config/GameConfig.js';
 
// ── Définition des succès débloquables ───────────────────────
export const ACHIEVEMENTS = [
  {
    id:          'first_book',
    title:       'Premier Pas',
    description: 'Ajouter son premier livre',
    emoji:       '📖',
    condition:   (stats) => stats.totalBooks >= 1,
  },
  {
    id:          'bookworm',
    title:       'Rat de Bibliothèque',
    description: '10 livres lus',
    emoji:       '🐭',
    condition:   (stats) => stats.totalBooks >= 10,
  },
  {
    id:          'page_turner',
    title:       'Tourneurs de Pages',
    description: '1 000 pages lues',
    emoji:       '📄',
    condition:   (stats) => stats.totalPages >= 1000,
  },
  {
    id:          'marathon_reader',
    title:       'Marathon Lecteur',
    description: '10 000 pages lues',
    emoji:       '🏃',
    condition:   (stats) => stats.totalPages >= 10000,
  },
  {
    id:          'genre_explorer',
    title:       'Explorateur',
    description: 'Lire dans 5 genres différents',
    emoji:       '🗺️',
    condition:   (stats) => stats.uniqueGenres >= 5,
  },
  {
    id:          'perfectionist',
    title:       'Perfectionniste',
    description: '3 livres notés 5 étoiles',
    emoji:       '⭐',
    condition:   (stats) => stats.fiveStarBooks >= 3,
  },
  {
    id:          'epic_reader',
    title:       'Lecteur Épique',
    description: 'Lire un livre de 1000+ pages',
    emoji:       '🏆',
    condition:   (stats) => stats.longestBook >= 1000,
  },
  {
    id:          'architect',
    title:       'Architecte du Monde',
    description: '20 bâtiments construits',
    emoji:       '🏙️',
    condition:   (stats) => stats.totalBooks >= 20,
  },
];
 
// ════════════════════════════════════════════════════════════
export class BookTracker {
  constructor() {
    this._data = null;
  }
 
  // ── Charger/rafraîchir les données ────────────────────────
  _refresh() {
    this._data = saveSystem.getData();
  }
 
  // ── Valider les données d'entrée d'un livre ───────────────
  /**
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate({ title, pages, genre, rating }) {
    const errors = [];
 
    if (!title || title.trim().length < 1) {
      errors.push('Le titre est obligatoire.');
    }
    if (title && title.trim().length > 100) {
      errors.push('Le titre ne peut pas dépasser 100 caractères.');
    }
 
    const numPages = Number(pages);
    if (!pages || isNaN(numPages) || numPages < 1) {
      errors.push('Le nombre de pages doit être supérieur à 0.');
    }
    if (numPages > 99999) {
      errors.push('Nombre de pages invalide (max 99 999).');
    }
 
    if (!genre || !(genre in GENRE_BUILDINGS)) {
      errors.push('Genre invalide.');
    }
 
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      errors.push('La note doit être entre 1 et 5.');
    }
 
    return { valid: errors.length === 0, errors };
  }
 
  // ── Calculer les statistiques avancées ────────────────────
  getStats() {
    this._refresh();
    const books = this._data.books || [];
 
    if (books.length === 0) {
      return {
        totalBooks:    0,
        totalPages:    0,
        totalXP:       0,
        totalGold:     0,
        avgRating:     0,
        avgPages:      0,
        uniqueGenres:  0,
        fiveStarBooks: 0,
        longestBook:   0,
        shortestBook:  0,
        genreBreakdown: {},
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topGenre:      null,
        monthlyReads:  {},
        currentStreak: 0,
      };
    }
 
    const genreCount    = {};
    const ratingCount   = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const monthlyReads  = {};
    let totalXP         = 0;
    let totalGold       = 0;
    let fiveStarBooks   = 0;
    let longestBook     = 0;
    let shortestBook    = Infinity;
    let totalRating     = 0;
 
    books.forEach(book => {
      // Genre
      genreCount[book.genre] = (genreCount[book.genre] || 0) + 1;
 
      // Note
      ratingCount[book.rating] = (ratingCount[book.rating] || 0) + 1;
      totalRating += book.rating;
      if (book.rating === 5) fiveStarBooks++;
 
      // Pages
      if (book.pages > longestBook)   longestBook  = book.pages;
      if (book.pages < shortestBook)  shortestBook = book.pages;
 
      // Récompenses
      totalXP   += book.rewards?.xp   || 0;
      totalGold += book.rewards?.gold || 0;
 
      // Lectures par mois
      if (book.date) {
        const d   = new Date(book.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyReads[key] = (monthlyReads[key] || 0) + 1;
      }
    });
 
    // Genre le plus lu
    const topGenre = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
 
    return {
      totalBooks:      books.length,
      totalPages:      this._data.stats.totalPages,
      totalXP,
      totalGold,
      avgRating:       parseFloat((totalRating / books.length).toFixed(1)),
      avgPages:        Math.round(this._data.stats.totalPages / books.length),
      uniqueGenres:    Object.keys(genreCount).length,
      fiveStarBooks,
      longestBook,
      shortestBook:    shortestBook === Infinity ? 0 : shortestBook,
      genreBreakdown:  genreCount,
      ratingBreakdown: ratingCount,
      topGenre,
      monthlyReads,
    };
  }
 
  // ── Vérifier et retourner les nouveaux succès débloqués ───
  /**
   * @returns {Achievement[]} Liste des succès nouvellement débloqués
   */
  checkNewAchievements() {
    this._refresh();
    const stats      = this.getStats();
    const unlocked   = new Set(this._data.player.achievements || []);
    const newlyUnlocked = [];
 
    for (const achievement of ACHIEVEMENTS) {
      if (!unlocked.has(achievement.id) && achievement.condition(stats)) {
        newlyUnlocked.push(achievement);
        unlocked.add(achievement.id);
      }
    }
 
    // Sauvegarder les nouveaux succès
    if (newlyUnlocked.length > 0) {
      this._data.player.achievements = [...unlocked];
      saveSystem.save(this._data);
    }
 
    return newlyUnlocked;
  }
 
  // ── Filtrer les livres ────────────────────────────────────
  /**
   * @param {{ genre?: string, rating?: number, sortBy?: 'date'|'title'|'pages'|'rating' }} options
   */
  filterBooks({ genre, rating, sortBy = 'date' } = {}) {
    this._refresh();
    let books = [...(this._data.books || [])];
 
    if (genre)  books = books.filter(b => b.genre === genre);
    if (rating) books = books.filter(b => b.rating === rating);
 
    const sorters = {
      date:   (a, b) => new Date(b.date) - new Date(a.date),
      title:  (a, b) => a.title.localeCompare(b.title),
      pages:  (a, b) => b.pages - a.pages,
      rating: (a, b) => b.rating - a.rating,
    };
 
    return books.sort(sorters[sortBy] || sorters.date);
  }
 
  // ── Rechercher un livre par titre ou auteur ───────────────
  search(query) {
    if (!query || query.trim().length < 2) return [];
    this._refresh();
    const q = query.toLowerCase().trim();
    return this._data.books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q))
    );
  }
 
  // ── Supprimer un livre (avec nettoyage du bâtiment) ───────
  deleteBook(bookId) {
    this._refresh();
 
    const bookIndex     = this._data.books.findIndex(b => b.id === bookId);
    const buildingIndex = this._data.world.buildings.findIndex(b => b.bookId === bookId);
 
    if (bookIndex === -1) {
      console.warn('[BookTracker] Livre introuvable :', bookId);
      return false;
    }
 
    const book = this._data.books[bookIndex];
 
    // Retirer le livre et son bâtiment
    this._data.books.splice(bookIndex, 1);
    if (buildingIndex !== -1) {
      this._data.world.buildings.splice(buildingIndex, 1);
    }
 
    // Mettre à jour les stats
    this._data.stats.totalBooks  = Math.max(0, this._data.stats.totalBooks - 1);
    this._data.stats.totalPages  = Math.max(0, this._data.stats.totalPages - (book.pages || 0));
 
    // Retirer les récompenses (optionnel – on les garde pour garder l'équité)
    // this._data.player.xp   -= book.rewards?.xp || 0;
    // this._data.player.gold -= book.rewards?.gold || 0;
 
    saveSystem.save(this._data);
    console.log('[BookTracker] Livre supprimé :', book.title);
    return { bookId, buildingBookId: bookId };
  }
}
 
// ── Instance singleton ────────────────────────────────────────
export const bookTracker = new BookTracker();