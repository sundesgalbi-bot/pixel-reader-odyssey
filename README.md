# 📚 Pixel-Reader Odyssey
 
> Transforme tes lectures en un monde virtuel en Pixel Art 2D.
> Une PWA (Progressive Web App) jouable sur mobile, hébergée sur GitHub Pages.
 
---
 
## 🚀 Guide de déploiement complet
 
### Étape 1 — Prérequis
 
Assure-toi d'avoir **Git** installé sur ton ordinateur.
Vérifie avec : `git --version`
 
Tu as besoin d'un compte **GitHub** : https://github.com
 
---
 
### Étape 2 — Créer le dépôt GitHub
 
1. Va sur https://github.com/new
2. Nomme-le : `pixel-reader-odyssey`
3. Laisse-le **Public** (requis pour GitHub Pages gratuit)
4. **Ne coche pas** "Add README" (on va pousser notre code)
5. Clique sur **Create repository**
 
GitHub t'affichera une URL de type :
```
https://github.com/TON_USERNAME/pixel-reader-odyssey.git
```
Copie-la — tu en as besoin à l'étape suivante.
 
---
 
### Étape 3 — Commandes Git à taper dans le terminal
 
```bash
# 1. Navigue dans le dossier du projet
cd pixel-reader-odyssey
 
# 2. Initialise Git
git init
 
# 3. Configure ton identité Git (si pas déjà fait)
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
 
# 4. Ajoute tous les fichiers au suivi Git
git add .
 
# 5. Crée le premier commit
git commit -m "feat: premier commit Pixel-Reader Odyssey 🚀"
 
# 6. Renomme la branche en 'main' (standard actuel)
git branch -M main
 
# 7. Connecte ton dépôt local au dépôt GitHub distant
#    ⚠️ Remplace TON_USERNAME par ton vrai nom d'utilisateur GitHub
git remote add origin https://github.com/TON_USERNAME/pixel-reader-odyssey.git
 
# 8. Pousse le code sur GitHub
git push -u origin main
```
 
Après le push, GitHub Actions va automatiquement :
- Détecter le fichier `.github/workflows/deploy.yml`
- Créer la branche `gh-pages`
- Déployer ton application
 
---
 
### Étape 4 — Activer GitHub Pages dans les réglages
 
1. Va sur ton dépôt GitHub : `https://github.com/TON_USERNAME/pixel-reader-odyssey`
2. Clique sur l'onglet **Settings** (⚙️ Paramètres)
3. Dans le menu latéral gauche, clique sur **Pages**
4. Sous "Build and deployment" :
   - **Source** : sélectionne `Deploy from a branch`
   - **Branch** : sélectionne `gh-pages` / `/ (root)`
5. Clique sur **Save**
 
Attends 2-3 minutes, puis ton application sera disponible sur :
```
https://TON_USERNAME.github.io/pixel-reader-odyssey/
```
 
---
 
### Étape 5 — Installer sur l'écran d'accueil mobile
 
#### Sur Android (Chrome) :
1. Ouvre l'URL dans Chrome
2. Attends quelques secondes → une bannière "Ajouter à l'écran d'accueil" apparaît
3. Ou : menu ⋮ → **Ajouter à l'écran d'accueil**
4. L'app se lance désormais en plein écran, sans barre d'URL
 
#### Sur iPhone/iPad (Safari) :
1. Ouvre l'URL dans **Safari** (obligatoire, pas Chrome)
2. Tape le bouton **Partager** (carré avec flèche ↑)
3. Défile et choisis **Sur l'écran d'accueil**
4. Confirme avec **Ajouter**
 
---
 
### Étape 6 — Mettre à jour l'application
 
À chaque modification de code :
```bash
git add .
git commit -m "feat: description de ta modification"
git push
```
GitHub Actions redéploie automatiquement en 1-2 minutes.
 
---
 
## 📁 Structure du projet
 
```
pixel-reader-odyssey/
├── index.html                    ← App shell + formulaire HTML
├── manifest.json                 ← Configuration PWA
├── service-worker.js             ← Cache hors-ligne
├── README.md                     ← Ce fichier
├── .github/
│   └── workflows/
│       └── deploy.yml            ← CI/CD GitHub Actions
├── assets/
│   ├── icons/                    ← icon-192.png, icon-512.png
│   ├── tilemaps/                 ← Fichiers Tiled (.json + .png) — futurs assets
│   ├── sprites/buildings/        ← Spritesheets pixel art — futurs assets
│   └── audio/                    ← Sons — futurs assets
└── src/
    ├── main.js                   ← Config Phaser + montage des scènes
    ├── scenes/
    │   ├── BootScene.js          ← Génération procédurale des textures
    │   ├── WorldScene.js         ← City builder (grille + bâtiments)
    │   └── UIScene.js            ← HUD + bouton + formulaire
    ├── systems/
    │   └── SaveSystem.js         ← Persistance localStorage + calculateRewards()
    └── data/
        └── GenreConfig.js        ← Dictionnaire genres → bâtiments + couleurs
```
 
---
 
## 🎮 Ajouter tes icônes PWA
 
L'application a besoin de deux icônes PNG pour être installable :
- `assets/icons/icon-192.png` (192×192 pixels)
- `assets/icons/icon-512.png` (512×512 pixels)
 
Tu peux créer un logo pixel art simple avec :
- **Aseprite** (payant, ~20€) — référence du pixel art
- **Libresprite** (gratuit, fork d'Aseprite) — https://github.com/LibreSprite/LibreSprite
- **Piskel** (gratuit, en ligne) — https://www.piskelapp.com
 
---
 
## 🔮 Roadmap
 
- [ ] Vrais assets PNG pixel art (bâtiments, terrain)
- [ ] Sons d'ambiance (musique 8-bit, effets de construction)
- [ ] Système de quêtes ("Lis 5 livres Fantasy pour débloquer le Château")
- [ ] Export/Import de sauvegarde JSON
- [ ] Synchronisation Supabase (multi-device)
- [ ] Animations idle CSS/Phaser pour les bâtiments
- [ ] Mode "Bibliothèque" : liste de tous les livres lus avec stats
 
---
 
## 🛠 Technologies
 
| Technologie | Rôle | Version |
|---|---|---|
| Phaser 3 | Moteur de jeu 2D (WebGL/Canvas) | 3.60.0 |
| PWA (Service Worker) | Hors-ligne + installation mobile | — |
| LocalStorage | Persistance des données | — |
| GitHub Actions | CI/CD automatique | — |
| GitHub Pages | Hébergement gratuit | — |
 
---
 
*Construit avec ❤️ et beaucoup de livres.*