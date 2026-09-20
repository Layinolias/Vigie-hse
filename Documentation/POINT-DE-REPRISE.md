# Point de reprise — 20 septembre 2026

Fichier de passage de relais entre sessions. **À relire en premier après une compaction ou en début de
session**, avec `CLAUDE.md`. Le reste de l'état durable est dans `ETAT-DU-PROJET.md`,
`ROADMAP-MODULES-FUTURS.md` et `QUESTIONS-METIER-EN-ATTENTE.md` — ne pas les dupliquer ici.

## Travail en cours, non terminé

_Rien en cours. La correction du bouton « Réinitialiser » a été testée, commitée et poussée
(`638a09e`, 20 septembre 2026) : sur 10 pages, `fService.value = "all"` est désormais posé
explicitement après `fillServiceOptions()`, qui conservait la valeur courante du filtre Service.
`accueil-poste.html`, `document-unique.html` et `registre-at-mp.html` étaient déjà corrects ;
`verifications-periodiques.html` n'a pas de filtre Service. Harnais `test-reset.js` : les 13 pages
ayant `#btnReset` et `#fService` reviennent bien à « Tous ». Reste la vérification en direct, qui
demande une session ouverte par l'utilisateur._

## Ce qui revient à l'utilisateur (je ne peux pas le faire)

- **Cahier du préventeur** : les visiteurs voient une **version épinglée à 7 questions**. Q8, Q9 et Q10
  sont publiées mais invisibles pour le préventeur tant que l'épingle n'est pas déplacée depuis le menu
  **Partager** de la page. Vérifier aussi l'épingle du Poste de pilotage.
- **Tests en direct** : ils exigent une session ouverte par l'utilisateur (je ne saisis pas de mot de
  passe et je ne me déconnecte jamais du panneau navigateur). Modules 12 et 8 jamais testés en direct.

## Reste à faire (hors travail en cours)

- Revue de code des modules 12 (Accueil au poste) et 8 (Base documentaire), jamais relus.
- Modules 5 (Pénibilité) et 13 (Dialogue social) : bloqués, respectivement par la réponse à Q5/Q8-Q10 et
  par la refonte des rôles (jalon J0).
- Autres liens contextuels vers la base documentaire (produit chimique → sa fiche, etc.).

## Où sont les tests

Les harnais jsdom (`test-bd.js`, `test-accueil.js`, `test-rdv.js`, `test-liens.js`, `audit2.js`,
`check-script-tags.js`, `node_modules/jsdom`…) vivent dans le **scratchpad de la session**, pas dans le
dépôt : une nouvelle session en reçoit un vide et devra les réécrire. Modèle : charger uniquement les
`<script src>` déclarés par la page, `process.env.TZ='Pacific/Auckland'` pour révéler les décalages UTC,
`VirtualConsole` pour détecter les redirections, `process.exit()` à la fin (sinon le script ne rend pas
la main à cause des horloges des pages).
