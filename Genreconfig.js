// ─────────────────────────────────────────────────────────────────────────────
// Fichier : src/data/GenreConfig.js
// Rôle    : Dictionnaire central qui associe chaque genre littéraire à :
//           - Une couleur de bâtiment (wall + roof)
//           - Un type de bâtiment
//           - Un biome
//           - Un emoji pour l'interface
//           - Des multiplicateurs de récompenses
// ─────────────────────────────────────────────────────────────────────────────
 
export const GENRE_CONFIG = {
 
  Fantasy: {
    label:        'Fantasy',
    emoji:        '⚔️',
    building:     'Tour de magie',
    biome:        'Forêt enchantée',
    color:        0x7F77DD,   // Violet magique (murs)
    roofColor:    0x534AB7,   // Violet foncé (toit)
    xpMultiplier: 1.2,        // +20% XP (genre populaire qui encourage la lecture longue)
    goldMultiplier: 1.0,
    // Noms des niveaux d'évolution du bâtiment
    levels: [
      'Cabane du sorcier',
      'Tour d\'apprenti',
      'Tour magique',
      'Grand Sanctuaire',
      'Citadelle Légendaire',
    ],
  },
 
  SciFi: {
    label:        'Science-Fiction',
    emoji:        '🚀',
    building:     'Station spatiale',
    biome:        'Désert cristallisé',
    color:        0x378ADD,   // Bleu technologique
    roofColor:    0x185FA5,   // Bleu profond
    xpMultiplier: 1.1,
    goldMultiplier: 1.2,      // +20% Or (genre souvent dense en idées)
    levels: [
      'Abri de survie',
      'Module de recherche',
      'Laboratoire',
      'Station orbitale',
      'Méga-station',
    ],
  },
 
  Policier: {
    label:        'Policier / Thriller',
    emoji:        '🔍',
    building:     'Commissariat',
    biome:        'Ville nocturne',
    color:        0x555577,   // Gris ardoise (ambiance sombre)
    roofColor:    0x333355,   // Quasi-noir
    xpMultiplier: 1.0,
    goldMultiplier: 1.1,
    levels: [
      'Ruelle sombre',
      'Bureau d\'enquêteur',
      'Commissariat',
      'Quartier général',
      'Tour de surveillance',
    ],
  },
 
  Romance: {
    label:        'Romance',
    emoji:        '💖',
    building:     'Manoir fleuri',
    biome:        'Campagne vallonnée',
    color:        0xD4537E,   // Rose soutenu
    roofColor:    0x993556,   // Rose foncé
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    levels: [
      'Cottage fleuri',
      'Maison de campagne',
      'Manoir romantique',
      'Château des amoureux',
      'Palais des Cœurs',
    ],
  },
 
  NonFiction: {
    label:        'Non-fiction',
    emoji:        '📊',
    building:     'Bibliothèque',
    biome:        'Plaine dorée',
    color:        0xBA7517,   // Ambre / bois
    roofColor:    0x854F0B,   // Bois foncé
    xpMultiplier: 1.3,        // +30% XP (encourager les lectures instructives)
    goldMultiplier: 1.1,
    levels: [
      'Livret de notes',
      'Salle de lecture',
      'Bibliothèque',
      'Archives royales',
      'Grande Bibliothèque',
    ],
  },
 
  Horreur: {
    label:        'Horreur',
    emoji:        '👻',
    building:     'Manoir hanté',
    biome:        'Marais brumeux',
    color:        0x444466,   // Gris-violet spectral
    roofColor:    0x222240,   // Nuit absolue
    xpMultiplier: 1.1,
    goldMultiplier: 1.2,      // Récompense les courageux
    levels: [
      'Cabane abandonnée',
      'Maison hantée',
      'Manoir des spectres',
      'Château maudit',
      'Forteresse des Ténèbres',
    ],
  },
 
  Histoire: {
    label:        'Histoire',
    emoji:        '🏛️',
    building:     'Temple antique',
    biome:        'Ruines antiques',
    color:        0xC4A857,   // Or antique
    roofColor:    0x8A7030,   // Bronze
    xpMultiplier: 1.2,
    goldMultiplier: 1.3,      // Les historiens méritent leurs récompenses
    levels: [
      'Stèle gravée',
      'Temple en ruines',
      'Temple restauré',
      'Acropole',
      'Cité Éternelle',
    ],
  },
 
  DevPerso: {
    label:        'Développement perso',
    emoji:        '🌿',
    building:     'Dojo zen',
    biome:        'Montagne zen',
    color:        0x3a7d44,   // Vert nature
    roofColor:    0x1e4d2b,   // Vert forêt
    xpMultiplier: 1.4,        // +40% XP (investissement en soi = bonus maximal)
    goldMultiplier: 1.2,
    levels: [
      'Pierre de méditation',
      'Dojo de bois',
      'Temple de la sérénité',
      'Sanctuaire du savoir',
      'Montagne de l\'Éveil',
    ],
  },
 
};
 
// ── Règles d'évolution des bâtiments ─────────────────────────────────────────
// Seuils de pages cumulées pour passer au niveau suivant dans un genre
export const EVOLUTION_THRESHOLDS = [
  0,    // Niveau 1 : dès le premier livre
  100,  // Niveau 2 : 100 pages
  300,  // Niveau 3 : 300 pages
  700,  // Niveau 4 : 700 pages
  1500, // Niveau 5 : 1500 pages (monument légendaire)
];
 
/**
 * Retourne le niveau d'évolution (0-4) en fonction des pages lues dans un genre.
 * @param {number} totalPages - Total de pages lues dans ce genre
 * @returns {number} Niveau entre 0 et 4
 */
export function getBuildingLevel(totalPages) {
  for (let i = EVOLUTION_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPages >= EVOLUTION_THRESHOLDS[i]) return i;
  }
  return 0;
}