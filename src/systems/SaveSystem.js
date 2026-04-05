/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Système de sauvegarde
 *  src/systems/SaveSystem.js
 *
 *  Persiste toutes les données du joueur dans le localStorage
 *  du navigateur mobile (données conservées entre les sessions).
 *
 *  Structure de la sauvegarde :
 *  {
 *    version:   number,        // Version du format de sauvegarde
 *    player: {
 *      xp:      number,
 *      gold:    number,
 *      level:   number,
 *      name:    string,
 *    },
 *    books:     Book[],        // Liste des livres lus
 *    world: {
 *      buildings: Building[], // Bâtiments placés sur la carte
 *      gridWidth: number,
 *      gridHeight: number,
 *    },
 *    stats: {
 *      totalPages:    number,
 *      totalBooks:    number,
 *      firstReadDate: string,
 *      lastReadDate:  string,
 *    }
 *  }
 * ════════════════════════════════════════════════════════════
 */
 
// Clé utilisée dans localStorage
const SAVE_KEY     = 'pixelreader_save_v1';
const SAVE_VERSION = 1;
 
// ── Structure par défaut d'une nouvelle partie ───────────────
const DEFAULT_SAVE = {
  version: SAVE_VERSION,
  player: {
    name:  'Lecteur',
    xp:    0,
    gold:  10,   // Petit cadeau de départ !
    level: 1,
  },
  books:   [],   // Tableau de livres { id, title, author, pages, genre, rating, date, rewards }
  world: {
    buildings: [], // Tableau de bâtiments { id, bookId, genre, gridX, gridY, placedAt }
    gridWidth:  20,
    gridHeight: 12,
  },
  stats: {
    totalPages:    0,
    totalBooks:    0,
    firstReadDate: null,
    lastReadDate:  null,
  },
};
 
// ════════════════════════════════════════════════════════════
export class SaveSystem {
  constructor() {
    // Cache en mémoire pour éviter trop de lectures localStorage
    this._cache = null;
  }
 
  // ── Charger la sauvegarde (ou créer une nouvelle) ─────────
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
 
      if (!raw) {
        console.log('[SaveSystem] Aucune sauvegarde trouvée → nouvelle partie.');
        this._cache = this._deepClone(DEFAULT_SAVE);
        return this._cache;
      }
 
      const parsed = JSON.parse(raw);
 
      // Migration si version différente
      if (parsed.version !== SAVE_VERSION) {
        console.warn('[SaveSystem] Version de sauvegarde différente, migration...');
        this._cache = this._migrate(parsed);
      } else {
        // Fusion avec le défaut pour s'assurer que toutes les clés existent
        this._cache = this._merge(DEFAULT_SAVE, parsed);
      }
 
      console.log('[SaveSystem] Sauvegarde chargée.', this._cache.stats);
      return this._cache;
 
    } catch (err) {
      console.error('[SaveSystem] Erreur de chargement :', err);
      this._cache = this._deepClone(DEFAULT_SAVE);
      return this._cache;
    }
  }
 
  // ── Sauvegarder les données ────────────────────────────────
  save(data) {
    try {
      const toSave = data || this._cache;
      if (!toSave) return false;
 
      toSave.version      = SAVE_VERSION;
      toSave._savedAt     = new Date().toISOString();
 
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
      this._cache = toSave;
 
      console.log('[SaveSystem] ✅ Sauvegarde réussie.');
      return true;
 
    } catch (err) {
      // localStorage plein ou navigation privée
      console.error('[SaveSystem] ❌ Erreur de sauvegarde :', err);
      return false;
    }
  }
 
  // ── Obtenir les données courantes (depuis le cache) ────────
  getData() {
    if (!this._cache) this.load();
    return this._cache;
  }
 
  // ── Ajouter un livre et mettre à jour le joueur ────────────
  /**
   * @param {{ title, author, pages, genre, rating }} bookData
   * @param {{ xp, gold }} rewards – Résultat de calculateRewards()
   * @returns {{ book, building }} Les objets créés
   */
  addBook(bookData, rewards) {
    const data = this.getData();
    const now  = new Date().toISOString();
 
    // Créer l'objet livre
    const book = {
      id:     `book_${Date.now()}`,
      title:  bookData.title  || 'Titre inconnu',
      author: bookData.author || '',
      pages:  Number(bookData.pages)  || 0,
      genre:  bookData.genre  || 'Other',
      rating: Number(bookData.rating) || 3,
      date:   now,
      rewards: {
        xp:   rewards.xp,
        gold: rewards.gold,
      },
    };
 
    // Créer le bâtiment correspondant sur la grille
    const building = {
      id:       `building_${Date.now()}`,
      bookId:   book.id,
      genre:    book.genre,
      gridX:    this._findFreeCell(data.world),
      gridY:    null, // sera calculé par _findFreeCell
      placedAt: now,
    };
 
    // _findFreeCell retourne { x, y }
    const cell  = this._findFreeCell(data.world);
    building.gridX = cell.x;
    building.gridY = cell.y;
 
    // Mettre à jour les données
    data.books.push(book);
    data.world.buildings.push(building);
 
    // Mettre à jour le joueur
    data.player.xp   += rewards.xp;
    data.player.gold += rewards.gold;
 
    // Mettre à jour les stats
    data.stats.totalBooks++;
    data.stats.totalPages  += book.pages;
    data.stats.lastReadDate = now;
    if (!data.stats.firstReadDate) {
      data.stats.firstReadDate = now;
    }
 
    // Sauvegarder automatiquement
    this.save(data);
 
    return { book, building };
  }
 
  // ── Trouver une cellule libre sur la grille ────────────────
  _findFreeCell(world) {
    const { buildings, gridWidth, gridHeight } = world;
 
    // Ensemble des cellules occupées
    const occupied = new Set(buildings.map(b => `${b.gridX},${b.gridY}`));
 
    // Chercher une cellule libre, ligne par ligne
    for (let y = 1; y < gridHeight - 1; y++) {
      for (let x = 1; x < gridWidth - 1; x++) {
        if (!occupied.has(`${x},${y}`)) {
          return { x, y };
        }
      }
    }
 
    // Grille pleine : retourner une position aléatoire (ne devrait pas arriver vite)
    console.warn('[SaveSystem] Grille pleine, expansion nécessaire.');
    return {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight),
    };
  }
 
  // ── Réinitialiser la sauvegarde (avec confirmation) ────────
  reset() {
    localStorage.removeItem(SAVE_KEY);
    this._cache = this._deepClone(DEFAULT_SAVE);
    console.log('[SaveSystem] Sauvegarde réinitialisée.');
    return this._cache;
  }
 
  // ── Exporter la sauvegarde en JSON (partage / backup) ──────
  exportJSON() {
    return JSON.stringify(this.getData(), null, 2);
  }
 
  // ── Importer une sauvegarde JSON ───────────────────────────
  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      this._cache  = this._merge(DEFAULT_SAVE, parsed);
      this.save(this._cache);
      return true;
    } catch (err) {
      console.error('[SaveSystem] Import invalide :', err);
      return false;
    }
  }
 
  // ── Utilitaires privés ─────────────────────────────────────
 
  // Clone profond pour éviter les mutations de l'objet défaut
  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
 
  // Fusion récursive (les valeurs existantes de `target` écrasent `source`)
  _merge(source, target) {
    const result = this._deepClone(source);
    for (const key of Object.keys(target)) {
      if (
        target[key] !== null &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key]) &&
        key in result
      ) {
        result[key] = this._merge(result[key], target[key]);
      } else {
        result[key] = target[key];
      }
    }
    return result;
  }
 
  // Migration basique si le format de sauvegarde change
  _migrate(oldData) {
    console.log('[SaveSystem] Migration depuis version', oldData.version);
    // Pour l'instant on repart du défaut en gardant les livres si possible
    const fresh = this._deepClone(DEFAULT_SAVE);
    if (Array.isArray(oldData.books)) fresh.books = oldData.books;
    return fresh;
  }
}
 
// ── Instance singleton exportée ───────────────────────────────
export const saveSystem = new SaveSystem();