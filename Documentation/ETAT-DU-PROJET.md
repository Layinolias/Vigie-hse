# VIGIE HSE — État du projet

Document de référence. Objectif : permettre à **n'importe qui** — la collectivité, un développeur humain qui découvre le projet, ou une future session d'IA (Claude ou autre) — de reprendre ce projet sans avoir suivi les échanges qui l'ont produit.

Dernière mise à jour de ce document : voir date de dernière modification du fichier. Version active du projet au moment de la rédaction : **V0.1.1.2**.

---

## 1. Le projet en une phrase

Un dashboard HSE (Hygiène-Sécurité-Environnement) "VIGIE HSE" pour une collectivité territoriale (Ville de Verchamps + Agglomération de Verchamps), couvrant le registre AT/MP, le Document Unique (DUERP), et une suite d'outils de prévention connexes — construit comme un **prototype fonctionnel sans backend**, pensé pour être démontré/testé localement avant tout raccordement à une vraie base de données.

## 2. Ce que ce n'est PAS

- **Pas d'application de production** : aucune authentification réelle (mots de passe en clair, comparaison côté client), aucune base de données serveur, aucune API. Tout vit dans le `localStorage` du navigateur de chaque utilisateur.
- **Pas synchronisé entre utilisateurs** : deux personnes ouvrant l'app sur deux machines différentes ne voient pas les mêmes données saisies — chaque navigateur a sa propre copie locale.
- **Ne pas déployer tel quel en ligne** pour un usage réel avec des données d'agents (RGPD). C'est un démonstrateur d'ergonomie, d'architecture fonctionnelle et de modèle de données, à faire reprendre par une vraie stack (backend + base de données + authentification) avant mise en production réelle.

## 3. Stack technique

- **HTML/CSS/JavaScript vanilla**, aucun framework (pas de React/Vue), aucune étape de build, aucun bundler. Chaque page est un fichier `.html` autonome (CSS et JS inline dans le même fichier).
- **Persistance** : `localStorage` (données) + `sessionStorage` (session de connexion).
- **Import/export Excel** : [SheetJS](https://sheetjs.com/) (`xlsx.full.min.js`, chargé depuis cdnjs, version épinglée `0.18.5`).
- **Polices** : Google Fonts — Barlow Condensed (titres), IBM Plex Sans (texte courant), IBM Plex Mono (chiffres/données).
- **Icônes** : sprite SVG artisanal inline (`<symbol id="i-...">`) dans chaque page, pas de bibliothèque externe.
- Navigation entre pages : simples liens `<a href="...">`, pas de routeur.

### Pourquoi cette stack ?

Décision volontaire pour rester démontrable immédiatement (double-clic sur un `.html`, aucune installation) et itérable très vite avec une IA en pair-programming. Le jour où le projet passe en vraie production, cette architecture devra être portée vers une vraie stack (voir section 9, "Prochaines étapes techniques").

## 4. Comment lancer / tester le projet

**Ouvrir directement les fichiers `.html` du dossier de la version active (`V0.1.1.2`) dans un navigateur** (double-clic, ou `file://...`). Pour des données partagées entre onglets, navigateurs et comptes de ce poste : `node serveur/serveur.js` puis http://localhost:8780 (serveur local, `PLAN-MISE-EN-PRODUCTION.md` §4 bis). Ne PAS passer par un lien hébergé de type Artifact/Claude — Cloudflare bloque l'accès à `localStorage` dans ce contexte, ce qui casse toute la persistance (bug rencontré et documenté durant la construction du projet).

Comptes de test (voir aussi §7) :

| Identifiant | Mot de passe | Rôle |
|---|---|---|
| `admin@verchamps.fr` | `admin1234` | admin — accès total + Administration |
| `manager@verchamps.fr` | `manager1234` | manager — lecture seule, scopé aux services Voirie + Espace Vert |
| `RH1`, `RH2` | `1234` | rh — création/édition complète |
| `AG1`, `AG2` | `1234` | ag — lecture seule, tous services |

## 5. Arborescence des versions

```
Projet HSE/
├── V0.1/              ← version originale figée (module Registre AT/MP seul, look "Jarvis" sombre)
├── V0.1.1/             ← 1ère refonte visuelle "HSE Soft Tech" (pastel, sidebar+topbar), même périmètre fonctionnel que V0.1
├── V0.1.1.1/           ← + authentification par rôles (admin/manager), panneau Administration, cockpit (météo, actus), Plan d'Actions, Santé & Visites
├── V0.1.1.2/           ← ACTIVE. Stabilisations + Registre Santé & Sécurité (RSST) + Vérifications Périodiques + widgets météo/score dans la topbar + actus secteur sourcées
├── future modules.txt  ← notes brutes de l'utilisateur (backlog) — voir Documentation/ROADMAP-MODULES-FUTURS.md pour la version organisée
└── Documentation/      ← ce dossier
```

**Règle suivie tout du long : chaque nouvelle version doit conserver 100% des capacités de la précédente ("zéro régression").** Ne jamais retirer une fonctionnalité existante sans que l'utilisateur le demande explicitement.

Chaque version est un dossier autonome et complet (pas de dépendance croisée). Pour repartir d'une nouvelle itération majeure, copier le dossier de la version active vers `V0.1.1.3` (ou la convention `X.Y.Z` suivante) plutôt que d'éditer `V0.1.1.2` pour des changements très structurants — garder `V0.1.1.2` comme un point de restauration fiable tant qu'une nouvelle version n'est pas validée.

## 6. Fichiers de `V0.1.1.2` et rôle de chacun

| Fichier | Rôle |
|---|---|
| `login.html` | Écran de connexion. Lit les comptes depuis `vigie_hse_users` (localStorage), pas en dur. |
| `index.html` | Page vitrine publique, avant connexion (V0.5.0) : présentation du produit, grille des modules **dans l'ordre du menu latéral** (19 cartes au 2026-09-23 — en ajouter une à chaque nouveau module, avec son symbole recopié depuis le sprite de `dashboard.html`), les comptes de démonstration dont `PREV1`, l'avertissement « prototype » (pas de serveur, données locales au navigateur, données fictives, authentification simplifiée) et le bouton « Réinitialiser les données de démonstration » (`localStorage.clear()` : toutes les clés, y compris celles des modules à venir). Le cockpit (météo, Score HSE, KPI, Flash Info, tendance AT/MP) est `dashboard.html`. |
| `registre-at-mp.html` | Registre des accidents du travail / maladies professionnelles — table filtrable, CRUD, import/export Excel. Depuis le 2026-09-23, la colonne « Risque » porte une pastille « fiche » vers la famille correspondante de la Base documentaire (même mécanisme que le Document Unique, via `VigieRisques.trouver()`) ; tri et filtres de la colonne portent toujours sur le libellé brut. |
| `saisie-rh.html` | Formulaire de déclaration/édition d'un AT/MP (accès rh/admin). |
| `document-unique.html` | Registre DUERP — évaluations de risques par service, cotation, table filtrable, CRUD, import/export Excel. |
| `saisie-duerp.html` | Formulaire d'évaluation/édition d'un risque DUERP (accès rh/admin). |
| `plan-actions.html` | Plan d'Actions — agrège les actions issues du DUERP (Élevé/Critique) et d'Inspection/Audit (non-conformités), + création manuelle. |
| `sante-visites.html` | Santé & Visites — 3 onglets : **Suivi** de la surveillance médicale (périodicité, échéance, surveillance renforcée par habilitation), **Agenda & RDV** (2026-09-19 : grille mensuelle, RDV médicaux `vigie_hse_rdv_medicaux`, convocation générée/copiée/imprimée, statut « Réalisé » → proposition de mise à jour de la dernière visite, KPI RDV à venir), **Modèles de convocation** (`vigie_hse_modeles_convocation`, RH/admin). Les RDV s'écrivent par fusion de leur part (RH limité à des services : jamais d'écrasement des autres) ; la forme de `vigie_hse_visites` n'a pas changé. Voir `ROADMAP-MODULES-FUTURS.md` module 7. |
| `registre-sst.html` | Registre Santé & Sécurité (RSST réglementaire) — observations remontées par les agents, traitées par RH/admin. |
| `verifications-periodiques.html` | Suivi des contrôles techniques réglementaires (électricité, extincteurs, ascenseurs, etc.). |
| `inspection-audit.html` | Trames de contrôle réutilisables + inspections réalisées ; les non-conformités alimentent le Plan d'Actions. |
| `produits-chimiques.html` | Inventaire des produits chimiques par service, pictogrammes CLP, suivi des FDS. |
| `formation-habilitation.html` | Suivi des habilitations par agent (CACES, habilitation électrique, SST...) et de leurs échéances de renouvellement. |
| `epi-dotation.html` | EPI/vêtements de travail — catalogue, stock, dotation par agent, cycles de lavage/entretien. |
| `reporting.html` | Indicateurs & reporting KPI (accès rh/admin). |
| `administration.html` | Panneau admin (accès admin uniquement) : Utilisateurs, Référentiels (listes déroulantes éditables), Flash Info, Veille réglementaire, Journal d'audit. Depuis le 2026-09-23 : **export / import des référentiels** (feuille « Référentiels » : Liste · Valeur · Définition ; l'import ajoute les valeurs absentes, doublons reconnus malgré casse et accents, et n'en retire jamais — premier fichier du kit de reprise) et **jauge de l'espace de stockage** du navigateur (alerte à 70 %, rouge à 90 %, modules les plus lourds). |
| `dossiers-atmp-citis.html` | Suivi administratif des dossiers AT/MP et maladies professionnelles : checklist documentaire (CMI, prolongations, certificat final, IPP, enquête/coûts), arrêtés d'imputabilité/CITIS avec workflow de signature. Accès via le modèle de permissions granulaires (§7) plutôt que par rôle fixe — voir aussi `ROADMAP-MODULES-FUTURS.md` module 18. Depuis le 2026-09-23, l'export se réimporte sans perte : dates, références et conclusions en fin de feuille « Dossiers », feuille « Prolongations » ; à l'import, une colonne absente du fichier ne modifie pas le dossier enregistré, et une vraie date Excel est lue comme une date. |
| `accident-analyse.html` | Analyse des causes d'un accident (arbre des causes INRS, 5 Pourquoi ou Ishikawa au choix par analyse), rattachée à chaque événement du Registre AT/MP ; actions correctives remontant au Plan d'Actions (`origine:"Analyse"`). Accès via permission granulaire `accident-analyse` — voir `ROADMAP-MODULES-FUTURS.md` module 15. Depuis le 2026-09-23, l'**arbre causal** s'exporte et se réimporte (feuilles « Faits » — avec « Découle du fait n° » —, « Pourquoi », « Ishikawa ») ; réimporter un fichier ne duplique plus les actions correctives (reconnues à leur description, identifiant conservé pour le Plan d'actions). |
| `urgences-exercices.html` | Registre chronologique des exercices d'urgence (évacuation incendie, intrusion, risque environnemental) — periodicité saisie au cas par cas (pas de valeur réglementaire figée), échéance "prochain exercice dû" calculée par site+type sur le dernier exercice de chaque groupe. Actions correctives remontant au Plan d'Actions (`origine:"Urgence"`). Accès via permission granulaire `urgences` — voir `ROADMAP-MODULES-FUTURS.md` module 16. |
| `gestion-rh.html` | Gestion RH (2026-09-19) — roster canonique des agents (`vigie_hse_agents`, remplace les dérivations indépendantes de `sante-visites.html`/`formation-habilitation.html`/`epi-dotation.html`), organigramme (rattachement `managerId`, garde-fou anti-cycle), saisie d'heures travaillées agrégées par service/mois (`vigie_hse_heures_travaillees`), et TF/TG "réel" calculé dessus — coexiste avec le TF/TG "estimé" (850×1607h) sans le remplacer. Accès via permission granulaire `gestion-rh` — voir `ROADMAP-MODULES-FUTURS.md` module 14. Depuis le 2026-09-23 : **import des agents** (agent reconnu à son nom + prénom + service ; responsable rattaché par son nom avec le garde-fou anti-boucle ; colonne absente = valeur conservée ; périmètre d'un RH limité respecté) et **export / import des heures travaillées** (une ligne déjà présente pour le même mois, collectivité et service est ignorée : jamais de double comptage dans le TF/TG réel). |
| `accueil-poste.html` | Accueil au poste (2026-09-19, étendu le 2026-09-21 après la réponse Q9) — parcours d'accueil sécurité d'un nouvel agent : registre des accueils (`vigie_hse_accueils`), **type d'accueil** (référentiel `typesAccueil`), points copiés depuis un modèle à la création (instantané), cases à cocher avec date/auteur, points spécifiques au poste, statut À faire/En cours/Terminé, **date butoir = arrivée + délai (8 j par défaut, réglage global `vigie_hse_accueil_delai` recopié sur chaque accueil), colonne « Échéance » triable/filtrable, tuile KPI et panneau d'alerte listant les accueils dépassés**, fiche imprimable avec zones de signature, export `.xlsx`, onglet « Modèles de parcours » (`vigie_hse_modeles_accueil`, always-merge, modèle par défaut neutre non supprimable). Accès via permission granulaire `accueil-poste` — voir `ROADMAP-MODULES-FUTURS.md` module 12. |
| `base-documentaire.html` | Base documentaire (2026-09-19, étendue le 2026-09-21 après la réponse Q10) — wiki d'articles (`vigie_hse_wiki`, recherche plein texte côté client sur les quatre sections, statut Publié/Brouillon, 33 fiches « Familles de risque » amorcées, **trame en 4 sections : Définition · Exemples de situation · Le danger · Mesures de prévention**, les trois dernières annoncées « à compléter par le préventeur » tant qu'elles sont vides) + registre de documents officiels (`vigie_hse_documents`, liens http(s) seulement, pas de stockage de fichier, **types de document créés par les rédacteurs eux-mêmes** (`vigie_hse_doc_types`) et **bascule afficher/masquer** par document). **Lecture ouverte à tout compte connecté**, rédaction RH/admin ou permission `documentation` — voir `ROADMAP-MODULES-FUTURS.md` module 8. Lien dans la section « Ressources » de la sidebar (visible de tous). **Ouverture directe d'une fiche par `base-documentaire.html?fiche=<id>`** (liens contextuels depuis le Document Unique) : message explicite si la fiche n'existe pas, ou si elle est en brouillon et que le compte n'a pas le droit de rédaction. |
| `entreprises-exterieures.html` | Entreprises extérieures & Plan de Prévention (2026-09-19) — registre CRUD des interventions (`vigie_hse_interventions_ee`) : inspection commune préalable en champs intégrés simples (date, participants, risques), plan de prévention en texte libre (mesures, consignes, responsabilités), verdict « plan obligatoire » **par intervention** (**au moins** 400 h estimées — réponse Q8 du 2026-09-21, une intervention de 400 h pile est signalée —, ou case « Travaux dangereux » cochée manuellement — la liste réglementaire n'est jamais devinée), cumul par entreprise/année à titre indicatif. Actions correctives remontant au Plan d'Actions (`origine:"Prévention EE"`). Habilitations des intervenants extérieurs volontairement non tracées (hors périmètre, réponse Q7). Accès via permission granulaire `entreprises-ext` — voir `ROADMAP-MODULES-FUTURS.md` module 17. |
| `assets/tri-filtres.js` | Composant partagé (2026-09-14) — tri et filtres de colonne façon tableur, réutilisable sur n'importe quelle page à tableau. Voir §6 bis ci-dessous. |
| `assets/roster.js` | Composant partagé (2026-09-16, étendu le 2026-09-19 avec `esc`, `loadActiveAgents(myServices)` et `bindAgentPicker(select, myServices, onPick)` : sélecteur « Choisir un agent » des 4 formulaires, limité aux services du compte) — `VigieRoster.hashStr`/`VigieRoster.dedupeByAgent`, hash déterministe et dédoublonnage d'un roster d'agents (historique — `sante-visites.html`/`formation-habilitation.html`/`epi-dotation.html`/`saisie-rh.html` proposent en plus un sélecteur d'agent alimenté par `vigie_hse_agents` (`gestion-rh.html`), mais gardent leurs propres enregistrements avec nom/prénom/service en clair : aucune dérivation retirée). |
| `assets/hse-formulas.js` | Composant partagé (2026-09-18, étendu le 2026-09-19) — `VigieFormules` : formule TF/TG "estimé" (`tauxFrequence`/`tauxGravite`, EFFECTIF×HEURES_AN) partagée entre `reporting.html`/`registre-at-mp.html`, et formule TF/TG "réel" (`tauxFrequenceReel`/`tauxGraviteReel`, basée sur les heures saisies dans `gestion-rh.html`) utilisée par ces deux mêmes pages + `gestion-rh.html`, avec `sommeHeures(heures, filtres)` : un seul jeu de filtres (période, année, service, collectivité, services du manager scopé) pour que le dénominateur couvre toujours le même périmètre que le numérateur. |
| `assets/habilitations-ref.js` | Composant partagé (2026-09-18) — table des types d'habilitation & durées de validité standard (`VigieHabilitations.HAB_TYPES`/`HAB_DUREE`), partagée entre `formation-habilitation.html` (référentiel source) et `sante-visites.html` (plafond de périodicité pour la surveillance renforcée). |
| `assets/risques-ref.js` | Composant partagé (2026-09-19, étendu le 2026-09-20) — `VigieRisques.FAMILLES` : taxonomie des familles de risque (nom + définition courte), copie de `RISK_TAXONOMY_DEFAULT` ; plus `slug()`, `trouver()`, `idFiche()` et `lienFiche()`, **seule source de l'identifiant de fiche wiki** (`wiki-risque-<slug>`) : `base-documentaire.html` amorce ses fiches avec, `document-unique.html` et `saisie-duerp.html` y renvoient. `trouver()` compare par slug, donc un libellé importé (« Chute de plain pied ») retrouve la famille officielle (« Chute de plain-pied ») ; il consulte ensuite une table `EQUIVALENCES` réservée aux libellés d'autres référentiels qui désignent **sans ambiguïté** une famille (Registre AT/MP : « Routier » → « Routiers », « Activité Physique » → « Activité Physique (TMS) », et, tranchés par le préventeur à la question 11, « Chute d'objet » → « Effondrements et aux chutes d'objets », « Déplacement » → « Déplacement dans les locaux ») — tout rapprochement discutable passe d'abord par le préventeur ; une famille ajoutée à la main dans les référentiels ne correspond à aucune fiche et ne produit donc aucun lien. Depuis le 2026-09-20, `administration.html`, `document-unique.html` et `saisie-duerp.html` construisent leur `RISK_TAXONOMY_DEFAULT` depuis ce fichier (`VigieRisques.FAMILLES.map(f => [f[0], f[1]])` — **par copie**, l'éditeur de référentiels d'`administration.html` modifiant son tableau) : plus aucune copie inline de la liste. |
| `assets/echeance.js` | Composant partagé (2026-09-18) — `VigieEcheance.classify(dateBase, periodiciteMois)` : calcul de prochaine échéance + classement À jour/À programmer/En retard (seuil 60 jours), partagé entre `urgences-exercices.html`, `verifications-periodiques.html`, `formation-habilitation.html`, `sante-visites.html`. Depuis le 2026-09-23, lit et écrit ses dates à l'heure locale via `assets/dates-locales.js`, **qui doit être chargé avant lui**. |
| `serveur/serveur.js`, `serveur/base-sqlite.js`, `serveur/comptes.js`, `serveur/droits.js` | Serveur local (étapes P1a et P1b, 2026-09-24) — `node serveur/serveur.js` puis http://localhost:8780 : sert les pages en y glissant l'état de la base, API `GET /api/donnees`, `PUT`/`DELETE /api/donnees/:cle` (en-têtes `X-Vigie` et `X-Vigie-Revision`, 409 si révision périmée), `POST /api/effacer` (copie de la base avant). Base SQLite (`node:sqlite`, intégré à Node ≥ 22.5) dans `serveur/donnees/vigie.db`, hors dépôt. N'écoute que 127.0.0.1 (réseau : P1c, avec HTTPS). Seul `serveur/base-sqlite.js` connaît la base. **P1b** : `comptes.js` — `POST /api/connexion` / `/api/deconnexion`, empreintes scrypt dans la table `empreintes` (jamais de mot de passe dans `vigie_hse_users`), sessions par cookie HttpOnly (table `sessions`, jeton haché), pause après 5 échecs, premier lancement depuis ce poste ; sans session, 302 vers `login.html` et 401 pour l'API. `droits.js` — niveau complet / ajout / aucun par registre et par compte, refus 403 tracé ; `resume()` est injecté dans la page (`__VIGIE_SERVEUR__.droits`). |
| `assets/stockage.js` | Composant partagé (2026-09-23) — `VigieStore.getItem/setItem/removeItem/clear`, **seul accès au stockage** de toute l'application (règle 14 de `CLAUDE.md`) : même sémantique que `localStorage`, que les pages n'appellent plus. Chargé en **premier script** de chaque page. Porte le registre `VigieStore.CLES` des 38 clés (nature : `donnees` / `parametres` / `journal` / `preference` ; drapeau `sensible` pour les données de santé, à valider avec un délégué à la protection des données). Si le navigateur refuse le stockage, bascule sur une mémoire de page et affiche un bandeau « rien ne sera conservé » (`VigieStore.persistant()` vaut alors `false`). **Mode serveur** (2026-09-24) : servie par `serveur/serveur.js`, la page reçoit l'état de la base dans `window.__VIGIE_SERVEUR__` et `VigieStore` lit cet état, écrit par l'API (synchrone), fusionne les écritures simultanées enregistrement par enregistrement (bandeau `#vigie-conflit` si le même champ a changé des deux côtés, `#vigie-serveur-injoignable` si le serveur ne répond pas) ; les clés « preference » restent locales ; `VigieStore.mode()` vaut `serveur`, `navigateur` ou `memoire`. Voir `PLAN-MISE-EN-PRODUCTION.md` §4 bis. Stockage plein (environ 5 millions de caractères par site) : bandeau « la dernière modification n'a PAS été enregistrée », l'erreur étant relancée à la page comme avant ; `VigieStore.occupation()` mesure l'espace utilisé. |
| `assets/import-fichier.js` | Composant partagé (2026-09-23) — `VigieImport.lireClasseur(buf)` : **toutes** les lectures de fichier importé (28, 14 pages, y compris l'auto-chargement DATATEST) y passent. Tableur (`.xlsx`, `.xls`, `.ods`) lu tel quel ; texte (`.csv`) décodé d'abord — BOM → UTF-8, sinon UTF-8 s'il est valide, sinon Windows-1252 — puis lu par SheetJS (séparateur `;` ou `,`). Réponse Q13 : « tout type de fichier est à prévoir ». |
| `assets/dates-locales.js` | Composant partagé (2026-09-23) — `VigieDates.lire("AAAA-MM-JJ")` (minuit local), `VigieDates.iso(date)` ("AAAA-MM-JJ" local), `VigieDates.aujourdhui()`. Utilisé par `assets/echeance.js`, par le calcul de renouvellement de `epi-dotation.html`, par la date des noms de fichiers d'export, et par **toute date du jour** de l'application (19 pages le chargent). Voir le piège « dates en UTC » au §11 et la règle 13 de `CLAUDE.md`. |
| `assets/impression.js` | Composant partagé (2026-09-23) — `VigieImpression.brancher(idExport, { table })` ajoute un bouton « Imprimer / PDF » juste après un bouton d'export Excel, et suit sa visibilité (pas d'export, pas d'impression). Imprime une **copie** du tableau affiché (mêmes lignes, sans boutons ni champs, colonnes restées vides retirées) sous un en-tête : titre, date et heure, compte, nombre de lignes, filtres de la barre et filtres de colonne actifs ; A4 paysage. Le style d'impression n'est injecté que le temps de l'impression (il ne gêne ni la convocation ni la fiche d'accueil). Branché sur 18 tableaux de 14 pages ; le Registre AT/MP et le Document Unique gardent leur impression propre, la Base documentaire n'en a pas (question 12). |

### 6 bis. Composant partagé `assets/tri-filtres.js` (tri & filtres de colonne)

Jusqu'ici chaque page était strictement autonome (CSS et JS en ligne, dupliqués). Ce composant est la **première exception assumée** : le chantier « tri & filtres façon Excel » devait être construit une seule fois plutôt que dupliqué sur chaque page à tableau.

Il reste compatible avec les contraintes du projet : script classique (pas de module ES), donc il fonctionne aussi bien en `file://` qu'en HTTP, sans étape de build ni dépendance. **Il injecte lui-même sa feuille de style**, construite sur les variables CSS déjà définies par chaque page (`--surface-el`, `--border`, `--accent`…) — il suit donc automatiquement le thème clair/sombre sans fichier CSS partagé à maintenir.

**Pour l'ajouter à une page :**
```html
<script src="assets/tri-filtres.js"></script>
```
```js
const tri = VigieTri.create({
  columns: VISIBLE_COLUMNS.map(c => ({ key:c.key, label:c.label, noFilter:!!c.noFilter, value:COLUMN_VALUES[c.key] })),
  onChange: () => render(),
});
tri.decorate($("theadFields"));   // après chaque (re)construction de l'en-tête
rows = tri.apply(rows);           // dans render(), après les filtres globaux de la page
tri.reset();                      // à câbler sur le bouton "Réinitialiser" de la page
```

- `value(row)` est **optionnel** : par défaut le composant lit `row[key]`. Il faut le fournir pour toute colonne dont la valeur affichée est calculée (badge, champ dérivé) — on trie et on filtre toujours sur la **valeur métier, jamais sur le HTML rendu**. Exemple dans `registre-at-mp.html` : la constante `COLUMN_VALUES` couvre `arretStatut` et `joursArret`.
- `noFilter:true` neutralise une colonne (utilisé pour la colonne Actions).
- Comportements repris du tableur : tri à 3 états (croissant → décroissant → annulé), tri numérique ou texte français détecté automatiquement, **valeurs vides toujours en fin quel que soit le sens**, filtres cumulés en ET, et options d'une colonne calculées sur les lignes filtrées par les *autres* colonnes (une colonne filtrée conserve toutes ses propres options).
- **Déployé sur les 10 pages à tableau** (2026-09-14) : `registre-at-mp.html`, `document-unique.html`, `plan-actions.html`, `registre-sst.html`, `verifications-periodiques.html`, `produits-chimiques.html`, `formation-habilitation.html`, `sante-visites.html`, `inspection-audit.html`, et `epi-dotation.html` (4 tableaux, donc 4 instances indépendantes). Le tableau de cotation du DUERP, qui est une référence statique, n'est volontairement pas équipé.
- **Deux formes d'intégration** selon la page : `registre-at-mp.html` génère ses en-têtes en JS (on lui passe `VISIBLE_COLUMNS`, et `decorate()` est rappelé à chaque reconstruction de l'en-tête) ; les neuf autres ont un `<thead>` écrit en dur (on ajoute un `id` sur la ligne d'en-têtes et on déclare la liste ordonnée des colonnes à la main). **Dans les deux cas, l'ordre déclaré doit suivre exactement celui des `<th>`** — un décalage trierait silencieusement la mauvaise colonne, sans erreur visible. Vérifier après toute modification d'en-tête.
- ⚠️ **Cache navigateur** : GitHub Pages sert ce fichier avec `max-age=600`. Après une modification, un visiteur peut donc garder l'ancienne version jusqu'à 10 minutes (les pages HTML ont la même politique). En test, forcer un rechargement dur pour ne pas déboguer une version périmée.

## 7. Modèle de rôles

| Rôle | Portée | Peut créer/éditer | Notes |
|---|---|---|---|
| `admin` | Tous services | Tout, + accès à Administration | Superset de `rh` |
| `rh` | Tous services | AT/MP, DUERP, Plan d'Actions, Santé & Visites, Vérifications Périodiques | Pas d'accès à Administration |
| `manager` | Scopé à `session.services` (liste de noms de service, ou `["*"]` = tout) | RSST uniquement (peut y déposer une observation) | Lecture seule ailleurs, données filtrées à ses services |
| `ag` | Tous services (lecture) | RSST uniquement (peut y déposer une observation) | Lecture seule partout ailleurs, colonnes personnelles/RH masquées (RGPD) |

Le **RSST fait exception** : c'est un registre ouvert où n'importe quel rôle peut déposer une observation (avec option d'anonymat) — c'est la nature même de ce registre réglementaire (tout agent peut signaler). Seuls `rh`/`admin` peuvent y répondre et le clôturer.

Le scoping `manager` (`session.services`) est vérifié dans chaque page consommant des données de service — chercher `session.services` dans le code pour voir le pattern exact.

### Permissions granulaires par module (nouveau, 2026-09-13, étendu 2026-09-14)

En plus des 4 rôles fixes ci-dessus, un utilisateur peut recevoir des **permissions additionnelles par module**, stockées dans `u.modulePermissions` (`vigie_hse_users`) et copiées dans `session.modulePermissions` à la connexion (`login.html`) :
```js
modulePermissions: {
  "atmp-admin": "read" | "write",        // Dossiers AT/MP & CITIS
  "atmp-declare": "write",               // Déclarer un AT/MP (saisie-rh.html) — booléen, pas de niveau lecture
  "accident-analyse": "read" | "write",  // Analyse d'accident
  "urgences": "read" | "write",          // Situations d'urgence & exercices
  "gestion-rh": "read" | "write",        // Gestion RH (roster, organigramme, heures, TF/TG réel)
  "entreprises-ext": "read" | "write",   // Entreprises extérieures & Plan de Prévention
  "accueil-poste": "read" | "write",     // Accueil au poste
  "documentation": "write",              // Base documentaire — rédaction seulement (booléen, comme atmp-declare) ; la lecture est ouverte à tous
}  // clé absente ou "none" = aucun accès sur ce module
```
- N'affecte **aucun** module existant — couche strictement additive.
- Huit modules câblés sur ce mécanisme à ce jour :
  - `dossiers-atmp-citis.html` (clé `"atmp-admin"`, read/write) — premier cas d'usage, 2026-09-13.
  - `saisie-rh.html` (clé `"atmp-declare"`, booléen `"write"`/absent) — permet à un manager/agent de déclarer un AT/MP sans avoir le rôle rh/admin. Répond au retour alpha "rendre paramétrable qui a le droit de déclarer un accident".
  - `accident-analyse.html` (clé `"accident-analyse"`, read/write) — module 15, voir `ROADMAP-MODULES-FUTURS.md`.
  - `urgences-exercices.html` (clé `"urgences"`, read/write) — module 16, voir `ROADMAP-MODULES-FUTURS.md`.
  - `gestion-rh.html` (clé `"gestion-rh"`, read/write) — module 14, voir `ROADMAP-MODULES-FUTURS.md`.
  - `entreprises-exterieures.html` (clé `"entreprises-ext"`, read/write) — module 17, voir `ROADMAP-MODULES-FUTURS.md`.
  - `accueil-poste.html` (clé `"accueil-poste"`, read/write) — module 12, voir `ROADMAP-MODULES-FUTURS.md`.
  - `base-documentaire.html` (clé `"documentation"`, booléen `"write"`/absent) — module 8 ; **cas particulier** : la lecture est ouverte à tous, la permission ne gouverne que la rédaction (aucune redirection pour un compte sans permission).
- Un `admin`/`rh` a toujours accès complet (`write`) à ces huit modules via son rôle ; un `manager`/`ag` n'y accède que si la permission lui a été explicitement accordée dans `administration.html` (onglet Utilisateurs).
- Géré dans `administration.html` (formulaire utilisateur, champs `uAtmpAdminPerm`/`uAtmpDeclarePerm`/`uAccidentAnalysePerm`/`uUrgencesPerm`/`uGestionRhPerm`/`uEntreprisesExtPerm`/`uAccueilPostePerm`/`uDocumentationPerm`) — pas encore une UI générique par module (ça reste à faire si d'autres modules adoptent ce mécanisme, voir la réflexion sur la refonte des permissions dans `ROADMAP-MODULES-FUTURS.md`, section J0).
- **En mode serveur (P1b, 2026-09-24), ces règles sont aussi appliquées par le serveur** (`serveur/droits.js`) : un compte ne peut plus écrire par l'API ce que son écran ne lui permet pas. Tout changement de règle dans une page doit être répercuté dans `droits.js` — sinon le serveur refuse et la page affiche « votre compte n'a pas le droit… » (c'est d'ailleurs ainsi qu'un écart se repère).
- Pattern d'accès reproductible dans le code de chaque page : `const canAtmpAdmin = role === "admin" || role === "rh" || !!(session.modulePermissions && session.modulePermissions["atmp-admin"]);` — même principe transposable à un futur module avec une autre clé.
- **Sidebar à deux niveaux** : les liens dont la visibilité dépend d'une permission granulaire (pas seulement du rôle) ont chacun leur propre `id` et sont masqués/affichés individuellement (`display:none` par défaut, révélé par JS), plutôt que la section entière — évite d'afficher un lien qu'un détenteur d'une seule des permissions ne pourrait pas utiliser (ex. "Déclarer un AT/MP" et "Évaluer un risque" dans la section "Espace RH" sont maintenant deux toggles indépendants, pas un seul pour toute la section).

## 8. Modèle de données — clés `localStorage`

Toutes ces clés sont lues et écrites par `VigieStore` (`assets/stockage.js`), dont le registre `VigieStore.CLES` classe chacune (données, paramètres, journal, préférence d'appareil) et signale les données sensibles — c'est la liste que la future synchronisation avec un serveur reprendra.

| Clé | Contenu | Écrite depuis |
|---|---|---|
| `vigie_hse_session` *(sessionStorage, pas localStorage)* | `{user, role}` de la session en cours | `login.html` |
| `vigie_hse_users` | Comptes utilisateurs (email/login, rôle, services, actif/inactif, mot de passe en clair) | `administration.html` (onglet Utilisateurs), lu par `login.html` |
| `vigie_hse_dataset` | Enregistrements AT/MP. Depuis 2026-09-13 : `dateDebutArret`/`dateFinArret` (saisies) + `joursArret`/`statutArret` ("En cours"/"Clôturé", calculés) remplacent l'ancien champ libre "nombre de jours" — les enregistrements plus anciens sans ces deux dates gardent leur `joursArret` hérité, affiché avec un statut "En cours" par défaut. | `saisie-rh.html`, lu/édité par `registre-at-mp.html` |
| `vigie_hse_rh_log` | Journal de saisie local (feed) côté formulaire AT/MP | `saisie-rh.html` |
| `vigie_hse_duerp_dataset` | Évaluations DUERP. Depuis 2026-09-14 : `dateEvaluation` (ISO, fixée à la création, préservée sur modification) pour permettre le filtrage par période dans `reporting.html` — présente uniquement sur les évaluations saisies manuellement via `saisie-duerp.html` depuis cette date ; les évaluations importées (Excel ou `DATATEST/`) n'en ont pas et restent donc toujours comptabilisées quelle que soit la période choisie. | `saisie-duerp.html`, lu/édité par `document-unique.html`, `plan-actions.html`, `reporting.html` |
| `vigie_hse_duerp_log` | Journal de saisie local (feed) côté formulaire DUERP | `saisie-duerp.html` |
| `vigie_hse_referentials` | Listes déroulantes éditables (risques, sièges, natures, statuts RH, services Ville/Agglo, familles DUERP) | `administration.html` (onglet Référentiels), lu par tous les formulaires/filtres |
| `vigie_hse_news` | Flash Info interne (actus rédigées par l'admin) | `administration.html` (onglet Flash Info), affiché sur `dashboard.html` |
| `vigie_hse_veille` | Veille réglementaire / actualités du secteur HSE (titre, source, date ISO, catégorie, résumé, url, statut "À lire"/"Lu"/"Archivé") — remplace depuis 2026-09-13 l'ancien tableau codé en dur `SECTOR_NEWS` | `administration.html` (onglet Veille réglementaire, CRUD complet), affiché sur `dashboard.html` (statut "Archivé" masqué côté cockpit) |
| `vigie_hse_audit_log` | Journal d'audit global (création/modification/suppression, tous modules) | Toute page qui modifie des données, lu par `administration.html` (onglet Journal) |
| `vigie_hse_actions` | Actions du Plan d'Actions | `plan-actions.html` |
| `vigie_hse_visites` | Fiches de suivi santé/visites médicales | `sante-visites.html` |
| `vigie_hse_rdv_medicaux` | Rendez-vous médicaux `{id, visiteId, nom, prenom, service, collectivite, date "YYYY-MM-DD", heure "HH:MM", lieu, medecin, statutConvocation ("À convoquer"\|"Convoqué"\|"Confirmé"\|"Réalisé"\|"Annulé"), notes, auteur, dateCreation}` — identité copiée depuis la fiche de suivi (affichage + périmètre par service) ; écriture par fusion de sa part | `sante-visites.html` (onglet Agenda & RDV) |
| `vigie_hse_modeles_convocation` | Modèles de convocation `{id, nom, objet, corps}` avec champs `{{prenom}} {{nom}} {{service}} {{collectivite}} {{typeVisite}} {{date}} {{heure}} {{lieu}} {{medecin}}` — always-merge, modèle par défaut d'id `tpl-defaut` non supprimable (modifiable) | `sante-visites.html` (onglet Modèles de convocation) |
| `vigie_hse_rsst` | Observations du Registre Santé & Sécurité | `registre-sst.html` |
| `vigie_hse_atmp_dossiers` | Checklist documentaire par dossier AT/MP (CMI, prolongations, certificat final, IPP, enquête/coûts), une entrée par `atmpId` | `dossiers-atmp-citis.html` |
| `vigie_hse_atmp_arretes` | Arrêtés d'imputabilité/CITIS (type, statut de signature, dates, autorité), plusieurs par `atmpId` | `dossiers-atmp-citis.html` |
| `vigie_hse_analyses_accident` | Analyse des causes d'un accident (méthode Arbre des causes/5 Pourquoi/Ishikawa au choix, conclusion, actions correctives), une entrée par `atmpId` | `accident-analyse.html`, actions correctives lues par `plan-actions.html` (`origine:"Analyse"`) |
| `vigie_hse_exercices_urgence` | Registre chronologique des exercices d'urgence (site, type, date, périodicité saisie au cas par cas, constatations, actions correctives) — **append-only**, jamais réécrit en place (un exercice = une nouvelle entrée, contrairement à `vigie_hse_verifications`/`vigie_hse_habilitations` qui gardent un état courant par équipement/habilitation) | `urgences-exercices.html`, actions correctives lues par `plan-actions.html` (`origine:"Urgence"`) |
| `vigie_hse_verifications` | Équipements et leur historique de vérification périodique | `verifications-periodiques.html` |
| `vigie_hse_weather_location` | Ville choisie manuellement pour le widget météo (`{name, admin1, country, lat, lon}`) | `dashboard.html` |
| `vigie_hse_produits_chimiques` | Inventaire des produits chimiques (produit, fournisseur, collectivité, service, quantité et unité, pictogrammes, `dateMajFDS`, `lienFDS`, `mesuresPrevention`) | `produits-chimiques.html`, lu par `reporting.html` |
| `vigie_hse_inspection_trames` | Trames d'inspection (nom + liste des points à contrôler) | `inspection-audit.html` |
| `vigie_hse_inspections` | Inspections réalisées (`trameId`, date, collectivité, service, `inspecteur`, réponse par point conforme / non conforme, `statutGlobal`) — un point non conforme génère une action dans le Plan d'actions | `inspection-audit.html`, lu par `plan-actions.html` et `reporting.html` |
| `vigie_hse_epi_catalogue` | Catalogue des EPI (nom, catégorie, norme, `dureeVieMois`, nombre de lavages maximal, `ficheTechnique`) | `epi-dotation.html` (onglet Catalogue), lu par `reporting.html` |
| `vigie_hse_epi_stock` | Stock par article et taille (`articleId`, taille, `quantiteStock`, `seuilAlerte`) | `epi-dotation.html` (onglet Stock) |
| `vigie_hse_epi_dotations` | Remises d'EPI aux agents (agent, collectivité, service, `articleId`, taille, `dateRemise` ; la date de renouvellement se calcule depuis `dureeVieMois`) | `epi-dotation.html` (onglet Dotations), lu par `reporting.html` |
| `vigie_hse_epi_lavages` | Journal d'entretien (`dotationId`, `dateLavage` ; le cumul est comparé au maximum du catalogue) | `epi-dotation.html` (onglet Entretien & Lavage) |
| `vigie_hse_sidebar_locked` | Préférence d'affichage : menu latéral épinglé ouvert (`"1"`) | toutes les pages à menu latéral |
| `vigie_hse_mobile_notice_dismissed` *(sessionStorage)* | Bandeau « version mobile simplifiée » refermé pour la session | les pages de module, sur petit écran |
| `vigie_hse_agents` | Roster canonique des agents (nom, prénom, service, collectivité, `managerId` — rattachement hiérarchique, actif, date d'entrée) — CRUD classique, pas append-only | `gestion-rh.html`, consulté (sélecteur d'agent, pré-remplissage) par `saisie-rh.html`, `sante-visites.html`, `formation-habilitation.html`, `epi-dotation.html` |
| `vigie_hse_heures_travaillees` | Heures travaillées, saisie **agrégée** par service/collectivité/mois (pas un pointage individuel) — **append-only** | `gestion-rh.html`, consulté par `registre-at-mp.html`/`reporting.html` (calcul du TF/TG "réel") |
| `vigie_hse_wiki` | Articles de la Base documentaire `{id, titre, theme, motsCles, contenu (= Définition), exemples, danger, prevention, statut "Publié"\|"Brouillon", source, auteur, modifiePar, dateCreation, dateMaj}` — les trois sections ajoutées le 2026-09-21 sont facultatives : un article qui n'en a pas n'affiche que sa définition (seules les fiches de famille de risque signalent les sections vides à rédiger) — always-merge : une fiche par famille de risque (`source:"famille-risque"`, id `wiki-risque-<slug>`, non supprimable) amorcée depuis `assets/risques-ref.js`, le stockage prime ; les brouillons sont masqués aux lecteurs | `base-documentaire.html` |
| `vigie_hse_documents` | Registre de documents officiels `{id, titre, categorie (= type), reference, version, dateDocument, statut "En vigueur"\|"Obsolète", masque, lien (http/https seulement), description, auteur, dateCreation}` — métadonnées uniquement, le fichier n'est pas stocké ; `masque:true` retire le document de la vue des lecteurs sans le supprimer (distinct d'« Obsolète », qui qualifie le document lui-même) | `base-documentaire.html` |
| `vigie_hse_doc_types` | Types de document (tableau de chaînes) — always-merge : les 10 types livrés sont des **exemples permanents**, toujours rétablis au chargement et non supprimables (même principe que le modèle de parcours par défaut d'`accueil-poste.html`) ; seuls les types ajoutés par un rédacteur se retirent, et ce retrait tient au rechargement puisque la liste livrée ne les réintroduit pas. Un type retiré reste affiché sur les documents qui le portent | `base-documentaire.html` (onglet Documents officiels) |
| `vigie_hse_accueils` | Accueils au poste `{id, nom, prenom, collectivite, service, poste, typeAccueil, dateArrivee, delaiJours, referent, modeleId, modeleNom, items:[{id, libelle, fait, dateFait, faitPar, commentaire, specifique}], dateCloture, auteur, dateCreation}` — points copiés du modèle à la création ; statut (À faire/En cours/Terminé), **date butoir (`dateArrivee` + `delaiJours`) et échéance (dans les délais / en retard / fait hors délai) tous calculés**, jamais stockés ; `delaiJours` est figé à la création depuis le réglage global, pour qu'un changement de réglage ne déplace pas les butoirs déjà annoncés ; écriture par fusion de sa part pour un compte limité à des services | `accueil-poste.html` |
| `vigie_hse_modeles_accueil` | Modèles de parcours d'accueil `{id, nom, description, points:[{id, libelle}]}` — always-merge, modèle par défaut d'id `tpl-accueil-defaut` non supprimable (modifiable, rétablissable) | `accueil-poste.html` (onglet Modèles de parcours) |
| `vigie_hse_accueil_delai` | Délai de réalisation d'un accueil, en jours (nombre brut, `"8"` par défaut — standard indiqué par le préventeur, réponse Q9). Sert de valeur par défaut aux nouveaux accueils, qui en gardent chacun une copie | `accueil-poste.html` (onglet Modèles de parcours) |
| `vigie_hse_interventions_ee` | Interventions d'entreprises extérieures (entreprise en texte libre — pas de 2ᵉ CRUD —, site, dates, heures estimées, case « travaux dangereux », inspection commune préalable, plan de prévention en texte libre, actions correctives) — CRUD classique | `entreprises-exterieures.html`, actions correctives lues par `plan-actions.html` (`origine:"Prévention EE"`) |

**"Actualités du secteur HSE"** (sur `dashboard.html`) est éditable depuis `administration.html` (onglet Veille réglementaire, clé `vigie_hse_veille`) depuis 2026-09-13 — avant cette date c'était une liste codée en dur dans le fichier du cockpit. Le seed initial reprend les 7 mêmes actus réelles (INRS, Weka, Préventica, Inforisque, portail Fonction publique) avec de vrais liens externes ; comme pour Flash Info, le seed ne se recharge jamais si l'admin vide la liste volontairement (pattern "seed une seule fois", pas "always-merge" — voir §9, ce module fait partie des exceptions volontaires).

## 9. Pattern architectural clé : fusion seed + stockage ("always-merge")

**Le pattern le plus important à comprendre avant de toucher au code.** Chaque module a un tableau `SEED_XXX` codé en dur (les données de démo/réelles initiales) et une fonction `loadDataset()` (nom variable selon fichier) qui, à chaque chargement de page :

1. Lit ce qui est déjà en `localStorage` (peut être vide, partiel, ou modifié par l'utilisateur).
2. Pour chaque enregistrement du `SEED`, utilise la version stockée si elle existe (id identique), sinon prend la version seed telle quelle.
3. Ajoute à la suite tout enregistrement stocké dont l'id n'est PAS dans le seed (= créé par l'utilisateur).
4. Réécrit immédiatement ce résultat fusionné dans le `localStorage`.

**Pourquoi c'est comme ça et pas plus simple ("si vide, on seed") :** une version précédente ne réenclenchait le seed que si le stockage était totalement vide, ce qui provoquait des bugs difficiles à diagnostiquer (données "disparues" après un test précédent qui avait laissé un état partiel en `localStorage`). Le pattern "always-merge" est auto-réparateur : peu importe l'état du navigateur, les données seed réapparaissent toujours, tout en préservant les modifications/ajouts de l'utilisateur. **Ne jamais revenir à un pattern "seed si vide".**

Les IDs des seeds sont **stables et déterministes** (ex. `pa-<id du risque DUERP source>` pour une action auto-générée, hash du nom+service pour une fiche de visite) — c'est ce qui permet à la fusion de fonctionner sur plusieurs rechargements sans dupliquer ni perdre des données.

## 10. Système de design

- Palette pastel douce définie en custom properties CSS (`--bg`, `--surface`, `--accent`, `--success`, `--warning`, `--danger`, `--critical`, etc.), avec équivalents clair/sombre.
- Support thème clair/sombre via `@media (prefers-color-scheme: dark)` + attribut `data-theme` (le triptyque `:root` / media query / `[data-theme]` est répété dans CHAQUE fichier, pas de feuille de style partagée).
- Layout sidebar (250px, rétractable au survol sur desktop ≥981px, tiroir off-canvas sur mobile) + topbar (60px, sticky).
- Composant récent : en-têtes de page compacts et sticky (`.page-summary`) fusionnant logo/titre/description/KPI sur une ligne — en cours de généralisation à tous les modules (voir §12, travaux en cours).
- Chaque page a son propre bloc `<style>` — **pas de CSS partagé entre fichiers**. Toute évolution du design system doit être répercutée fichier par fichier (risque d'incohérence si on oublie un fichier — voir §11).

## 11. Pièges connus / leçons apprises

- **Artifact hébergé = localStorage cassé.** Toujours tester en ouvrant les fichiers `.html` en local, jamais via un lien Artifact.
- **Parsing Excel sans logiciel installé** : ce projet a été construit sur une machine sans Excel/LibreOffice/Python. Les fichiers `.xlsx` ont été parsés en PowerShell pur (dézippage + parsing XML `xl/sharedStrings.xml` / `xl/worksheets/sheetN.xml`). Les `.xls` (format binaire OLE2 ancien) sont **illisibles** avec cette méthode — il faut demander à l'utilisateur de les réenregistrer en `.xlsx`.
- **Encodage PowerShell** : toujours lire/écrire les fichiers avec `[System.IO.File]::ReadAllText/WriteAllText` + `New-Object System.Text.UTF8Encoding($false)` — `Get-Content`/`Out-File` par défaut corrompent les accents français ("Ã©" etc.).
- **Fichiers HTML volumineux** : certains fichiers dépassent la limite de tokens de l'outil de lecture à cause des tableaux `SEED` massifs. Technique de contournement : créer une copie "lisible" avec les lignes de plus de ~2000 caractères tronquées, la lire, éditer le vrai fichier séparément. Pour insérer un gros tableau de données dans un nouveau fichier, utiliser un placeholder texte (`__SEED_XXX__`) écrit via l'outil d'édition, puis le remplacer par le vrai contenu via un script PowerShell (`.Replace()`) — évite de faire transiter des dizaines de milliers de caractères de données à travers le contexte de conversation.
- **Édition en masse par regex non ancrée = risque de corruption.** Un remplacement regex trop large a un jour corrompu des liens `<a>` et injecté un `<symbol>` égaré dans un `<defs>` non lié, en cherchant à modifier toutes les sidebars en une passe. Depuis : édits ciblés fichier par fichier, avec vérification systématique de l'équilibre des accolades/parenthèses/crochets JS après coup (voir §13).
- **Texte d'enregistrement injecté dans `innerHTML`.** Jusqu'au 2026-09-23, les seize pages qui affichent des données inséraient le texte de leurs enregistrements tel quel dans un gabarit HTML : un libellé contenant une balise était rendu comme une vraie balise, avec ses attributs événementiels. Les données venant des imports Excel, des formulaires et des référentiels, rien n'était sûr. Toutes ces pages déclarent maintenant `const esc = (s) => …` en tête de script et l'appliquent à chaque interpolation de texte. **Trois pièges** repérés à cette occasion : les colonnes déclarées hors gabarit (`render:r => r.champ || ""`), les fonctions de date qui renvoient la chaîne d'origine quand la valeur n'est pas une date ISO, et les ternaires qui concatènent un champ. À l'inverse, **ne pas** échapper les messages du journal d'audit, des `confirm()` et des affectations `textContent`.
- **Dates « AAAA-MM-JJ » calculées en UTC.** `new Date("2026-01-20")` vaut minuit **UTC**, et `toISOString()` repasse en UTC. En France (UTC+1/+2) cela donne la veille entre minuit et 2 h du matin, et — plus grave — après un calcul de mois qui franchit le passage à l'heure d'été, la veille **à toute heure** : jusqu'au 2026-09-23, les échéances de quatre modules et le renouvellement des EPI s'affichaient un jour trop tôt (2026-01-20 + 6 mois → 2026-07-19). Pour lire, écrire ou calculer une date du jour, passer par `assets/dates-locales.js` (ou un équivalent local comme `parseLocal`/`addDays` d'`accueil-poste.html`). Depuis le 2026-09-23, **plus aucun** `toISOString().slice(0,10)` ne reste dans les pages (61 remplacés — voir `BUGS-CONNUS.md`) ; `toISOString()` entier reste correct pour un **horodatage** (journal d'audit, `maj`), qui est un instant et non une date calendaire.
- **Export Excel d'une feuille vide sans en-têtes.** `XLSX.utils.json_to_sheet([])` produit une feuille **sans ligne d'en-têtes** : un registre vide s'exportait en fichier blanc, inutilisable comme modèle d'import. Chaque export passe désormais la liste de ses colonnes (`json_to_sheet(lignes, { header: [...] })`) ; en ajoutant une colonne à un export, l'ajouter aussi à cette liste (sinon elle manquera seulement quand la feuille est vide).
- **Délégation à des agents en arrière-plan** : un agent a un jour continué à travailler ~2h après la fin de sa tâche assignée, en inventant lui-même des suites non demandées, jusqu'à échouer sur une limite de débit. Depuis, toute délégation à un agent en arrière-plan (`fork`) est bornée explicitement ("fais exactement ceci, puis ARRÊTE-TOI, n'invente rien au-delà"), et son travail est systématiquement re-vérifié indépendamment (pas seulement son propre rapport) avant d'être présenté comme terminé.

## 12. Travaux en cours / derniers événements (au moment de la rédaction)

- Modules RSST et Vérifications Périodiques : terminés et vérifiés.
- Séparation Flash Info interne / Actualités du secteur HSE : terminée.
- Widgets météo (Open-Meteo, Verchamps) et Score HSE compact intégrés à la topbar de `dashboard.html` (anciennement `index.html`), cliquables (météo → portail Météo France, score → ancre vers le détail sur la page).
- Généralisation de l'en-tête compact/sticky (`.page-summary`) à tous les modules : terminée.
- Modules Indicateurs & Reporting KPI, Mode démonstration, Exports professionnels (PDF/Excel généralisé), EPI/dotation, Dashboard mobile simplifié : tous terminés — voir `ROADMAP-MODULES-FUTURS.md` pour le détail par module.
- Menu latéral : bouton "épingler" pour empêcher le repli automatique, et zone de navigation rendue défilante indépendamment de l'en-tête/pied de sidebar (corrige un cas où trop d'éléments de menu rendaient le bouton de déconnexion inatteignable sur un écran bas).
- Réponses du préventeur aux questions 4 à 7 du Cahier reçues et consignées le 2026-09-16 (`QUESTIONS-METIER-EN-ATTENTE.md`) : Q4 mise en œuvre le jour même (surveillance médicale renforcée par habilitation, `sante-visites.html`) ; Q5/Q6/Q7 reportées dans `ROADMAP-MODULES-FUTURS.md` (modules 5, 16, 17 — pas encore construits).
- **État au 2026-09-15** : la checklist QA V1 (75 points à l'époque) a été déroulée intégralement — constats dans `ROADMAP-MODULES-FUTURS.md` et `BUGS-CONNUS.md` (3 corrigés le jour même).
- **Du 2026-09-16 au 2026-09-23** : modules 7 (agenda et convocations), 8, 12, 14, 16 et 17 livrés ; les douze questions du Cahier sont répondues et mises en œuvre (Q8 à Q12 le 2026-09-23) ; campagne d'échappement HTML sur les seize pages de données (règle 11 de `CLAUDE.md`) ; critères de gel V1 vérifiés un à un — aucune erreur JS en usage normal, exports Excel relus (en-têtes des feuilles vides), impression / PDF sur tous les registres (`assets/impression.js`), échéances corrigées du décalage d'heure d'été (`assets/dates-locales.js`), page vitrine remise à jour.
- **2026-09-24** : étape P1a — serveur local avec base SQLite (`serveur/`), `VigieStore` en mode serveur, fusion des écritures simultanées ; aucune page modifiée hormis les textes de réinitialisation et la jauge de stockage d'Administration. Puis étape P1b — connexion vérifiée par le serveur, mots de passe hachés, droits d'écriture appliqués par le serveur (`login.html` passe par le serveur en mode serveur, la vitrine renvoie la réinitialisation vers Administration). En mesurant les écritures, un bogue des référentiels corrigé (quatre pages effaçaient la liste des types d'accueil).
- **État courant (2026-09-23)** : checklist QA V1 à 120 points, à dérouler de nouveau en direct ; aucune question métier en attente. Restent avant le gel `v1.0.0` : le test en conditions réelles sur l'hébergement et la présentation à un professionnel externe — voir `PLAN-VERSIONS-V1.md`.

## 13. Comment vérifier qu'un fichier n'est pas cassé après édition

Depuis le 2026-09-18 environ, Node est disponible et c'est la méthode de référence :

1. **Syntaxe** : passer chaque bloc `<script>` inline de chaque page modifiée à `new Function(...)` sous Node (une erreur de syntaxe lève une exception qui nomme le bloc), et chaque fichier de `assets/`.
2. **Balises de composants** : vérifier que chaque page qui utilise un composant partagé (`VigieTri`, `VigieDates`, `VigieImpression`…) charge bien son `<script src="assets/…">`, et que `dates-locales.js` précède `echeance.js`.
3. **Comportement** : harnais jsdom (pages réellement exécutées, avec les vrais fichiers `DATATEST/` lus par le vrai SheetJS, une session de compte de test injectée). Ils vivent hors du dépôt, dans le scratchpad de la session — liste et rôle de chacun dans `POINT-DE-REPRISE.md`. Toujours éprouver un harnais sur un cas qui doit échouer avant de croire son « zéro erreur ».
4. **À l'œil** : le panneau navigateur de l'application ouvre un fichier local sans stockage ; servir le dossier en `http://localhost:8765` avec `Documentation/outils/serveur-local.js` (configuration « vigie-local » de `.claude/launch.json`) pour tester une page avec une session.

L'ancienne méthode — compter accolades, parenthèses et crochets de chaque bloc `<script>` par une regex PowerShell — reste un dépannage quand Node manque ; un déséquilibre n'y est pas toujours une vraie erreur (une chaîne contenant `" ("` fausse le compte).

## 14. Prochaines étapes

Voir `ROADMAP-MODULES-FUTURS.md` dans ce même dossier pour le backlog détaillé des modules à construire, avec statut et annotations.

Prochaines étapes techniques à garder en tête pour une vraie mise en production (au-delà du backlog fonctionnel) :
- Remplacer `localStorage` par un vrai backend + base de données (le pattern "always-merge seed+stored" devra être repensé — il n'a de sens que pour un stockage local par navigateur).
- Vraie authentification (hash de mot de passe, sessions serveur).
- RGPD : chiffrement/anonymisation réelle des données personnelles, pas seulement du masquage d'affichage par rôle.
- CSS partagé (actuellement dupliqué dans chaque fichier — un changement de design system implique d'éditer chaque page une par une).
