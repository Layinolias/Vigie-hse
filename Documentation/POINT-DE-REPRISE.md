# Point de reprise — 23 septembre 2026

Fichier de passage de relais entre sessions. **À relire en premier après une compaction ou en début de
session**, avec `CLAUDE.md`. Le reste de l'état durable est dans `ETAT-DU-PROJET.md`,
`ROADMAP-MODULES-FUTURS.md` et `QUESTIONS-METIER-EN-ATTENTE.md` — ne pas les dupliquer ici.

## Travail en cours, non terminé

_Rien en cours. **Campagne d'echappement terminee le 2026-09-23** : les seize pages qui affichent
des enregistrements inseraient leur texte tel quel dans du HTML ; toutes echappent desormais (commits
`0fad9f7` et `445d67a`, detail dans `BUGS-CONNUS.md`). Outil de campagne : `sweep.js` dans le scratchpad
(sonde / propose / applique / compare / detail) — a reecrire si une nouvelle session en a besoin.
Auparavant : Les réponses Q8, Q9 et Q10 du préventeur (2026-09-21) sont consignées dans
`QUESTIONS-METIER-EN-ATTENTE.md` et **toutes les trois mises en œuvre et déployées** : seuil « au moins
400 h » (`50ec301`), accueil au poste — type, délai de 8 j, butoir, alerte (`852fbb5`), base documentaire —
trame en 4 sections, types de document créés par le préventeur, afficher/masquer (`7c60848`). Plus aucune
question métier en attente. Auparavant : la correction du bouton « Réinitialiser », testée, commitée et poussée
(`638a09e`, 20 septembre 2026) — sur 10 pages, `fService.value = "all"` est désormais posé
explicitement après `fillServiceOptions()`, qui conservait la valeur courante du filtre Service.
`accueil-poste.html`, `document-unique.html` et `registre-at-mp.html` étaient déjà corrects ;
`verifications-periodiques.html` n'a pas de filtre Service. Harnais `test-reset.js` : les 13 pages
ayant `#btnReset` et `#fService` reviennent bien à « Tous ». Reste la vérification en direct, qui
demande une session ouverte par l'utilisateur._

## Ce qui revient à l'utilisateur (je ne peux pas le faire)

- **Épingles de partage** : la lecture du Poste de pilotage du 2026-09-21 confirme que **les visiteurs
  voient une version épinglée, plus ancienne que la version publiée**. À corriger depuis le menu
  **Partager** de chaque page (Poste de pilotage, Cahier du préventeur, Checklist QA) — je ne peux pas le
  faire moi-même. Sans cela, le préventeur et les testeurs travaillent sur des chiffres périmés.
- **Tests en direct** : ils exigent une session ouverte par l'utilisateur (je ne saisis pas de mot de
  passe et je ne me déconnecte jamais du panneau navigateur). Modules 12 et 8 jamais testés en direct.

## Reste à faire (hors travail en cours)

- ~~Revue de code des modules 12 et 8~~ : faite le 2026-09-21 (`2e1df61`). Deux défauts trouvés et corrigés
  dans la base documentaire (retrait d'un type de document qui revenait au rechargement ; filtre laissant
  deviner un document masqué). Leçon retenue : tester la **persistance après rechargement**, pas seulement
  l'état immédiat du stockage.
- Tests en direct des modules 12 et 8 (session ouverte par l'utilisateur nécessaire).
- ~~Module 5 (Pénibilité)~~ et ~~module 13 (Dialogue social)~~ : construits le 2026-09-25 après les réponses
  Q15 et Q16 (`penibilite.html`, `dialogue-social.html`, comptes anonymisés). Deux points d'interprétation
  restent à faire confirmer par le préventeur (« égalé = atteint », « moins de 3 ») — voir
  `QUESTIONS-METIER-EN-ATTENTE.md`.
- ~~Étape P1c~~ : faite le 2026-09-25 (périmètre des lectures, HTTPS, refus d'ouvrir au réseau tant que ce
  n'est pas sûr, journal signé, sauvegardes — `PLAN-MISE-EN-PRODUCTION.md` §4 quater). Suite : P2, un
  pilote — un vrai poste du réseau avec un certificat au vrai nom, sauvegardes recopiées hors du disque.
- **Paquet pour le poste du préventeur** : prêt le 2026-09-25 (`LIVRAISON-POSTE.md`) ; aucun encore remis. Avant d'y mettre de vraies données de santé : avis du délégué à la protection des données (question 14).
- **Q11 et Q12 repondues et traitees le 2026-09-23** : les 9 risques du Registre AT/MP ouvrent une fiche ;
  l'impression generique suffit (mises en page dediees gardees en reserve dans la roadmap). Aucune question
  n'est plus en attente sur le Cahier.
- Autres liens contextuels : produit chimique → sa fiche, module de suivi → article pertinent.

## Où sont les tests

Les harnais jsdom (`test-bd.js`, `test-accueil.js`, `test-rdv.js`, `test-liens.js`, `test-reset.js`,
`test-taxo.js`, `test-q8.js`, `test-q9.js`, `test-q10.js`, `usage-normal.js` (24 pages × 5 comptes avec les
vraies données DATATEST et le vrai SheetJS — `npm i jsdom xlsx`), `audit-exports.js` (chaque export relu, en-têtes et
périmètre du manager), `cmp-echeance.js` (échéances avant/après), `tz-echeance.js` (six fuseaux), `test-impression.js` (189 contrôles de l'impression), `cmp-utc.js` (chaque page avant/après, horloge figée à l'heure UTC puis à 0 h 30 à Paris), `test-stockage.js` (VigieStore : accès unique, registre, repli si stockage refusé), `aller-retour.js` (export → import de
chaque module, comparé feuille par feuille et champ par champ), `test-import-dossiers.js` (aussi `avant` : doit échouer sur
l'ancienne version), `test-import-rh.js`, `test-csv.js` (7 formats de fichier importés), `test-admin-ref.js` (référentiels, jauge), `test-serveur.js` (serveur P1a de bout en bout, base jetable — compare au relevé du même parcours en mode navigateur), `test-fusion.js` (20 cas de fusion à trois), `test-droits.js` (droits d'écriture du serveur, 5 comptes), `test-perimetre.js` (lectures filtrées au périmètre, greffe des écritures, journal signé), `test-perimetre-photo.js` (`preparer`, puis `photo avant` / `photo apres` et `compare-photos.js` : les 25 pages vues par deux comptes limités, avant/après un changement du serveur), `test-reseau.js` (HTTPS avec le certificat de test `tls/`, refus de s'ouvrir, types servis, sauvegardes et restauration), `test-mise-a-jour.js <commit>` (une base remplie par l'ancienne version reprise par la nouvelle — à passer avant chaque paquet, `LIVRAISON-POSTE.md`), `test-paquet.js` (le paquet décompressé et lancé comme par l'utilisateur), `mesure-ecritures.js` (qui écrit quoi au chargement des pages), `harnais-serveur.js` + `xhr-sync-aide.js` (outils communs : requêtes synchrones fidèles au navigateur, un pot de cookies par personne — le XHR synchrone de jsdom mélange les sessions entre fenêtres), `test-reimport-analyses.js` (aussi `avant`), `taille.js` (caractères par enregistrement), `cmp-utc.js prive` (navigation privée stricte), `audit-docs.js` (documentation confrontée au code :
pages, composants, clés, permissions, fichiers cités — à relancer après chaque module), `serve.js` (serveur local pour le
panneau navigateur : le fichier ouvert directement n'a pas de stockage), `sweep.js`, `audit2.js`,
`check-script-tags.js`, `node_modules/jsdom`…) vivent dans le **scratchpad de la session**, pas dans le
dépôt : une nouvelle session en reçoit un vide et devra les réécrire. Modèle : charger uniquement les
`<script src>` déclarés par la page, `process.env.TZ='Pacific/Auckland'` pour révéler les décalages UTC,
`VirtualConsole` pour détecter les redirections, `process.exit()` à la fin (sinon le script ne rend pas
la main à cause des horloges des pages).
