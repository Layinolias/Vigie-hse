# Point de reprise — 1er octobre 2026

Fichier de passage de relais entre sessions. **À relire en premier après une compaction ou en début de
session**, avec `CLAUDE.md`. Le reste de l'état durable est dans `ETAT-DU-PROJET.md`,
`ROADMAP-MODULES-FUTURS.md` et `QUESTIONS-METIER-EN-ATTENTE.md` — ne pas les dupliquer ici.

## Travail en cours, non terminé

_Rien en cours. Dernières livraisons (2026-09-29) : Q17 (suivi médical réservé à l'encadrement, permission
« Santé & Visites »), outil de restauration (`Restaurer une sauvegarde.bat`), polices embarquées, onglet
« Données d'une personne » (droit d'accès), météo facultative, journal des consultations des données de santé,
revue de code de la journée corrigée (`a9d5b66`), puis FDS et mesures de prévention visibles de tous dans les
Produits chimiques, et « Fiches utiles » sur les pages de suivi. Paquet `livraison/VIGIE-HSE-2026-09-29.zip` remis à l'utilisateur (test de mise à jour
depuis `08a2585` passé) ; dossier pour l'avocat : `livraison/VIGIE-HSE-dossier-RGPD-HDS.pdf`._

**Fait le 2026-09-30 — organisation configurable (J0), fusionnée dans `main` par la PR Layinolias/Vigie-hse#1** (`3c29371` ; `gh` installé et connecté depuis, voir la mémoire) : composant `assets/organisation.js`, panneau Administration → Référentiels → Organisation, 23 pages basculées, tests `test-organisation.js`, `test-org-admin.js`, `test-org-pages.js`, `test-org-serveur.js`, et photo-org.js (photos avant/après ; scratchpad, hors dépôt). Après fusion : site en ligne vérifié, test du paquet 17/17, test de mise à jour depuis `a9d5b66` (le paquet remis) 8/8, checklist en ligne republiée (162 points), paquet rebâti.

**Fait le 2026-09-30 — revue générale, fusionnée dans `main` par la PR Layinolias/Vigie-hse#3** (`d76c9b3` ; site en ligne vérifié, paquet `livraison/VIGIE-HSE-2026-09-30.zip` rebâti sur `d76c9b3`) : sécurité (`d5c82fe` — échappement complété sur 16 pages, serveur durci) puis simplification (`53978c3` — menu latéral commun `assets/menu-lateral.js`, code mort retiré, ≈ 2 700 lignes en moins) ; détail dans `BUGS-CONNUS.md`. Outils du scratchpad (hors dépôt) : sonde-xss.js + sonde-xss-resume.js (sonde d'injection générale), test-revue-serveur.js, test-menu.js (comportement du menu contre HEAD), nav-visibilite.js + nav-comparer.js (liens visibles par compte), test-guillemets.js, code-mort.js, patch.js (remplacements exacts vérifiés). Test du paquet 17/17, mise à jour depuis `a9d5b66` 8/8, checklist à 165 points.

**Fait le 2026-09-30 — secteur (J0, vocabulaire), branche `vocabulaire-secteur`** : Administration → Référentiels → Organisation → Secteur « Collectivité territoriale » / « Entreprise privée » (décidé avec l'utilisateur : un seul choix qui bascule tous les mots). `VigieOrga.mots()` et `[data-mots]` (`assets/organisation.js`) sur les 26 pages ; exports « Salarié », imports qui relisent les deux ; le serveur transmet le secteur à l'accueil et à la connexion. **Question 18** posée au préventeur (CITIS, statut/cadre d'emploi/grade, décision de la collectivité, pénibilité selon le statut, actualités, RSST). Outils du scratchpad : test-mots.js (49), test-secteur-serveur.js (11), test-import-salarie.js (9, échoue sur `main`), photo-mots.js (98 visites identiques à `main` en secteur collectivité ; `restes` pour le secteur entreprise), `SECTEUR=entreprise node aller-retour.js`. Fusionné dans `main` par la PR Layinolias/Vigie-hse#4 (`6359e21`), site en ligne vérifié, Cahier (Q18), checklist et poste de pilotage republiés.

**Fait le 2026-09-30 — styles et icônes communs, branche `css-icones-communs`** (demandé par l'utilisateur à la suite du secteur) : `assets/commun.css` (76 règles identiques de 17 pages, liée juste avant leur `<style>`) et `assets/icones.js` (55 icônes, sprite inséré par `VigieMenu.init`, retiré des 24 pages à menu) — ≈ 2 100 lignes en moins. Vérifié : style calculé de chaque élément identique à `main` dans un vrai navigateur (17 pages × bureau, téléphone, sombre ; 24 pages avec les icônes), photos jsdom 98 visites identiques hors l'icône « Importer » d'Analyse d'accident, qui manquait. Outils du scratchpad : mesure-css.js, extraire-commun.js, extraire-icones.js, empreinte-navigateur.js (à coller dans le panneau, sur deux serveurs : `main` extrait sur le port 8766), photo-css.js. Restent les 7 pages aux styles dérivés (ROADMAP, dette technique). Fusionné dans `main` par la PR Layinolias/Vigie-hse#5 (`093887e`) ; GitHub Pages n'avait pas lancé de publication pour cette fusion — demandée à la main (`gh api -X POST repos/Layinolias/Vigie-hse/pages/builds`), à refaire si le site reste sur l'ancienne version. Paquet `livraison/VIGIE-HSE-2026-09-30.zip` rebâti sur `093887e` : test du paquet 17/17, mise à jour depuis `a9d5b66` 8/8. Checklist en ligne (168 points) et poste de pilotage republiés.

**Fait le 2026-10-01 — profils de droits (J0, permissions), fusionnés dans `main` par la PR Layinolias/Vigie-hse#6** (`8ea0af8` ; site en ligne vérifié fichier par fichier ; paquet `livraison/VIGIE-HSE-2026-10-01.zip` rebâti, test de mise à jour passé depuis `093887e`) (choisi par l'utilisateur : plusieurs profils par compte aux droits cumulés ; services par compte pour tout profil) : `assets/droits.js` (catalogue de 21 modules à niveaux ordonnés, six profils préréglés, résolution, conversion, garde anti-verrouillage — lu par les pages ET le serveur), clé `vigie_hse_profils`, serveur (`droits.js`, `lecture.js`, `consultations.js`, `comptes.js`) et menu sur les niveaux, 22 pages sans plus aucun `role ===`, `login.html`, Administration → Profils (grille module × niveau) et comptes à profils cumulés, conversion automatique des anciens comptes à la première ouverture d'Administration. Mesuré : ancien et nouveau serveur identiques sur 148 comptes × 42 registres ; photo de 24 pages × 7 comptes (168 visites) identique à `main` sauf l'onglet Profils et les filtres du Document unique (les deux voulus). Détail : `ETAT-DU-PROJET.md` §7. **Pour l'installation de l'ami de l'utilisateur** : son `PREV1` n'a pas la permission « Santé & Visites » ; à la conversion il recevra donc Agent + un profil « Droits particuliers — PREV1 » (et non Préventeur) — lui donner le profil Préventeur dans Administration pour compléter. Hors périmètre noté dans la ROADMAP (J0) : retirer côté serveur les clés d'un module à « Aucun » ; limite de services par module. **Tests (hors dépôt, dans le scratchpad)** : les harnais qui pilotaient les anciens champs d'Administration (anonymisation, q17, dialogue social) ont été portés sur les profils ; `test-rdv.js` échoue seulement les premiers jours d'un mois (il cherche la case de la veille de la veille dans le mois affiché — vrai aussi pour l'ancien code) ; `harnais-serveur.js` charge maintenant les assets de `H.racineAssets` (l'ancienne version dans `test-mise-a-jour.js`), sans quoi les anciennes pages tournent avec les nouveaux composants.

**Fait le 2026-10-01 (suite) — données par module côté serveur, fusionné par la PR Layinolias/Vigie-hse#7** (`4329775` ; paquet `livraison/VIGIE-HSE-2026-10-01.zip` rebâti, tests de paquet 17/17 et de mise à jour 8/8 repassés) (choisi par l'utilisateur pour finir les permissions) : `serveur/lecture.js` ne transmet plus les 13 registres qu'une seule page lit (`PAGE_UNIQUE` : accueil au poste, pénibilité, dialogue social, documents, EPI, trames d'inspection, modèles de convocation) à un compte sans le niveau « consulter » du module. Mesuré par une photo serveur de 25 pages × 6 comptes avant/après (`test-lecture-photo.js`) et par `test-donnees-par-module.js` (scratchpad).

**Fait le 2026-10-01 (suite 2) — petits correctifs de droits, branche `petits-correctifs-droits`** : trois des quatre incohérences d'origine notées après les profils sont corrigées — « Nouvelle déclaration » reste visible d'un compte « Déclarer » dans le Registre AT/MP (sans import ni export), « Vider le journal de saisie » est caché dans `saisie-rh.html` à qui ne gère pas le registre (le serveur le refusait), l'export « Données d'une personne » écrit les profils par leur nom. La quatrième est **conservée volontairement** : un compte « Dossiers AT/MP » / « Analyse d'accident » reçoit le registre complet mais le Registre AT/MP lui montre la vue réduite (les colonnes de maladie professionnelle restent réservées à `gérer`) ; la changer est une ligne (`visRole` de `registre-at-mp.html`) si le préventeur le demande. Test : `test-petits-correctifs.js` (21 points, 6 échouent sur l'ancien code). Checklist : 176 points.

**Décidé le 2026-09-29 : pas de chiffrement des données au repos pour l'instant** (l'utilisateur, après
explication du risque de perte sans code de secours). Modèle retenu si on le fait un jour, et alternative
BitLocker : `PLAN-MISE-EN-PRODUCTION.md` §6 et §8. Ne pas le relancer sans nouvelle demande.

**Installation existante de l'ami de l'utilisateur** : son compte PREV1 n'a pas la nouvelle permission
« Santé & Visites » — à donner dans Administration (seuls les comptes créés depuis l'ont d'office).

## En attente d'autres personnes

- **Avocat** (dossier PDF) : durées de conservation, dont celle du journal des consultations (365 j par défaut,
  `VIGIE_CONSULTATIONS_JOURS`), HDS, questions du §8 ; chiffrement au repos attendu ou non.
- **Délégué à la protection des données** : avis avant toute vraie donnée de santé (question 14).
- **Date de remise du paquet** à noter dans `LIVRAISON-POSTE.md` quand l'utilisateur la donne.

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
- ~~Autres liens contextuels~~ : faits le 2026-09-29 — FDS des produits chimiques, et « Fiches utiles » sur les pages de suivi, choisies par le rédacteur (`assets/fiches-utiles.js`). Reste au préventeur à proposer ses articles sur les pages.

## Où sont les tests

Les harnais jsdom (`test-bd.js`, `test-accueil.js`, `test-rdv.js`, `test-liens.js`, `test-reset.js`,
`test-taxo.js`, `test-q8.js`, `test-q9.js`, `test-q10.js`, `usage-normal.js` (24 pages × 5 comptes avec les
vraies données DATATEST et le vrai SheetJS — `npm i jsdom xlsx`), `audit-exports.js` (chaque export relu, en-têtes et
périmètre du manager), `cmp-echeance.js` (échéances avant/après), `tz-echeance.js` (six fuseaux), `test-impression.js` (189 contrôles de l'impression), `cmp-utc.js` (chaque page avant/après, horloge figée à l'heure UTC puis à 0 h 30 à Paris), `test-stockage.js` (VigieStore : accès unique, registre, repli si stockage refusé), `aller-retour.js` (export → import de
chaque module, comparé feuille par feuille et champ par champ), `test-import-dossiers.js` (aussi `avant` : doit échouer sur
l'ancienne version), `test-import-rh.js`, `test-csv.js` (7 formats de fichier importés), `test-admin-ref.js` (référentiels, jauge), `test-serveur.js` (serveur P1a de bout en bout, base jetable — compare au relevé du même parcours en mode navigateur), `test-fusion.js` (20 cas de fusion à trois), `test-droits.js` (droits d'écriture du serveur, 5 comptes), `test-perimetre.js` (lectures filtrées au périmètre, greffe des écritures, journal signé), `test-perimetre-photo.js` (`preparer`, puis `photo avant` / `photo apres` et `compare-photos.js` : les 25 pages vues par deux comptes limités, avant/après un changement du serveur), `test-reseau.js` (HTTPS avec le certificat de test `tls/`, refus de s'ouvrir, types servis, sauvegardes et restauration), `test-lecture.js` (droits de lecture : ce que reçoit chaque compte, ajouts greffés), `test-lecture-photo.js` (`photo <nom>` : 25 pages × six comptes, à comparer par `compare-photos.js`), `mesure-lectures.js` (quelles clés lit chaque page, par compte), `test-consultations.js` (journal des consultations des données de santé, sur un vrai serveur), `test-meteo.js` (météo facultative : aucune requête sans ville), `test-personne.js` (Administration → Données d'une personne  — éprouvé par mutation : il échoue quand les mots de passe ne sont plus écartés ou le contenu plus échappé), `test-restauration.js` (outil de restauration, essayé comme un utilisateur, `.bat` compris), `test-mise-a-jour.js <commit>` (une base remplie par l'ancienne version reprise par la nouvelle — à passer avant chaque paquet, `LIVRAISON-POSTE.md`), `test-paquet.js` (le paquet décompressé et lancé comme par l'utilisateur), `mesure-ecritures.js` (qui écrit quoi au chargement des pages), `harnais-serveur.js` + `xhr-sync-aide.js` (outils communs : requêtes synchrones fidèles au navigateur, un pot de cookies par personne — le XHR synchrone de jsdom mélange les sessions entre fenêtres), `test-reimport-analyses.js` (aussi `avant`), `taille.js` (caractères par enregistrement), `cmp-utc.js prive` (navigation privée stricte), `audit-docs.js` (documentation confrontée au code :
pages, composants, clés, permissions, fichiers cités — à relancer après chaque module), `serve.js` (serveur local pour le
panneau navigateur : le fichier ouvert directement n'a pas de stockage), `sweep.js`, `audit2.js`,
`check-script-tags.js`, `node_modules/jsdom`…) vivent dans le **scratchpad de la session**, pas dans le
dépôt : une nouvelle session en reçoit un vide et devra les réécrire. Modèle : charger uniquement les
`<script src>` déclarés par la page, `process.env.TZ='Pacific/Auckland'` pour révéler les décalages UTC,
`VirtualConsole` pour détecter les redirections, `process.exit()` à la fin (sinon le script ne rend pas
la main à cause des horloges des pages).
