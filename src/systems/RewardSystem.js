/**
 * ════════════════════════════════════════════════════════════
 *  Pixel-Reader Odyssey – Système de récompenses
 *  src/systems/RewardSystem.js
 *
 *  Gère toutes les récompenses du joueur :
 *   - Calcul XP + Or (délègue à GameConfig)
 *   - Détection de passage de niveau
 *   - Affichage des notifications in-game
 *   - Gestion des succès (achievements)
 * ════════════════════════════════════════════════════════════
 */
 
import { calculateRewards, calculateLevel } from '../config/GameConfig.js';
import { saveSystem }                       from './SaveSystem.js';
import { bookTracker, ACHIEVEMENTS }        from './BookTracker.js';
 
export class RewardSystem {
  /**
   * @param {Phaser.Scene} uiScene – Référence à UIScene pour afficher les notifs
   */
  constructor(uiScene) {
    this.uiScene = uiScene;
  }
 
  // ── Accorder les récompenses d'un livre ───────────────────
  /**
   * Calcule, accorde et affiche les récompenses.
   * @param {{ pages, rating, title, genre }} bookData
   * @returns {{ xp, gold, bonus, levelUp: boolean }}
   */
  grantBookRewards(bookData) {
    const data         = saveSystem.getData();
    const levelBefore  = calculateLevel(data.player.xp);
    const rewards      = calculateRewards(bookData.pages, bookData.rating);
 
    // Appliquer les récompenses (SaveSystem s'en charge via addBook,
    // mais on re-calcule le niveau ici pour détecter le level-up)
    const levelAfter   = calculateLevel(data.player.xp); // après addBook
 
    const levelUp = levelAfter.level > levelBefore.level;
 
    // Vérifier les nouveaux succès
    const newAchievements = bookTracker.checkNewAchievements();
 
    return {
      ...rewards,
      levelUp,
      newLevel: levelAfter.level,
      newLevelName: levelAfter.levelName,
      achievements: newAchievements,
    };
  }
 
  // ── Afficher la notification de récompenses ───────────────
  /**
   * @param {Phaser.Scene} scene      – Scène cible (UIScene)
   * @param {object} rewards          – Résultat de grantBookRewards
   * @param {string} bookTitle
   */
  showRewardNotification(scene, rewards, bookTitle) {
    const W = scene.scale.width;
    const H = scene.scale.height;
 
    // Panneau principal
    const panel = scene.add.container(W / 2, H / 2 - 30).setDepth(500);
 
    const panelW = 260;
    const panelH = rewards.levelUp ? 170 : 130;
 
    const bg = scene.add.graphics();
    bg.fillStyle(0x080818, 0.98);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(3, 0xf0c040, 1);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);
    // Coins décorés
    const cs = 6;
    bg.fillStyle(0xf0c040, 1);
    [[-panelW/2, -panelH/2], [panelW/2-cs, -panelH/2],
     [-panelW/2, panelH/2-cs], [panelW/2-cs, panelH/2-cs]].forEach(([cx, cy]) => {
      bg.fillRect(cx, cy, cs, cs);
    });
    panel.add(bg);
 
    let currentY = -panelH / 2 + 12;
 
    // Titre
    const titleTxt = scene.add.text(0, currentY, '📚 LECTURE VALIDÉE !', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '8px',
      color:      '#f0c040',
    }).setOrigin(0.5, 0);
    panel.add(titleTxt);
    currentY += 20;
 
    // Titre du livre
    const short = bookTitle.length > 20 ? bookTitle.substring(0, 18) + '…' : bookTitle;
    panel.add(scene.add.text(0, currentY, `"${short}"`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '6px',
      color:      '#c0c0e0',
    }).setOrigin(0.5, 0));
    currentY += 18;
 
    // XP et Or côte à côte
    panel.add(scene.add.text(-50, currentY, `⚡ +${rewards.xp} XP`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#80d0ff',
    }).setOrigin(0.5, 0));
    panel.add(scene.add.text(50, currentY, `💰 +${rewards.gold}`, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '10px',
      color:      '#f0c040',
    }).setOrigin(0.5, 0));
    currentY += 22;
 
    // Bonus
    panel.add(scene.add.text(0, currentY, rewards.bonus, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize:   '5px',
      color:      '#80ff80',
    }).setOrigin(0.5, 0));
    currentY += 16;
 
    // Level-up
    if (rewards.levelUp) {
      const lvlTxt = scene.add.text(0, currentY, `🏆 NIVEAU ${rewards.newLevel} !`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '9px',
        color:      '#ffd700',
      }).setOrigin(0.5, 0);
      panel.add(lvlTxt);
 
      // Clignotement du texte niveau
      scene.tweens.add({
        targets:  lvlTxt,
        alpha:    0.3,
        yoyo:     true,
        repeat:   4,
        duration: 200,
      });
      currentY += 20;
 
      panel.add(scene.add.text(0, currentY, rewards.newLevelName, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize:   '6px',
        color:      '#c0a000',
      }).setOrigin(0.5, 0));
    }
 
    // Animation entrée
    panel.setAlpha(0).setScale(0.7);
    scene.tweens.add({
      targets:  panel,
      alpha:    1,
      scaleX:   1,
      scaleY:   1,
      duration: 350,
      ease:     'Back.easeOut',
    });
 
    // Auto-fermeture
    const displayTime = rewards.levelUp ? 3000 : 2200;
    scene.time.delayedCall(displayTime, () => {
      scene.tweens.add({
        targets:    panel,
        alpha:      0,
        y:          panel.y - 40,
        duration:   400,
        ease:       'Sine.easeIn',
        onComplete: () => {
          panel.destroy();
          // Afficher les succès ensuite
          if (rewards.achievements?.length > 0) {
            this.showAchievements(scene, rewards.achievements);
          }
        },
      });
    });
 
    return panel;
  }
 
  // ── Afficher les succès débloqués ─────────────────────────
  showAchievements(scene, achievements) {
    achievements.forEach((ach, index) => {
      scene.time.delayedCall(index * 1200, () => {
        const W = scene.scale.width;
 
        const toast = scene.add.container(W / 2, 80).setDepth(600);
 
        const bg = scene.add.graphics();
        bg.fillStyle(0x0a2010, 0.95);
        bg.fillRect(-140, -24, 280, 48);
        bg.lineStyle(2, 0x2ecc71, 1);
        bg.strokeRect(-140, -24, 280, 48);
        toast.add(bg);
 
        toast.add(scene.add.text(0, -12, `🏅 SUCCÈS DÉBLOQUÉ !`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize:   '6px',
          color:      '#2ecc71',
        }).setOrigin(0.5));
 
        toast.add(scene.add.text(0, 4, `${ach.emoji} ${ach.title}`, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize:   '7px',
          color:      '#ffffff',
        }).setOrigin(0.5));
 
        toast.setAlpha(0).setY(60);
        scene.tweens.add({
          targets: toast, alpha: 1, y: 80, duration: 300, ease: 'Back.easeOut',
        });
 
        scene.time.delayedCall(2000, () => {
          scene.tweens.add({
            targets: toast, alpha: 0, y: 60, duration: 300,
            onComplete: () => toast.destroy(),
          });
        });
      });
    });
  }
}