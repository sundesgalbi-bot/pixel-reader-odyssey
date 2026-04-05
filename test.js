// Test simple pour vérifier si les modules ES6 marchent
console.log('Test des modules ES6');

import { TILE_SIZE } from './config/GameConfig.js';
console.log('TILE_SIZE importé:', TILE_SIZE);

export const test = 'ok';