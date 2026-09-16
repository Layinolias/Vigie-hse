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

**Ouvrir directement les fichiers `.html` du dossier de la version active (`V0.1.1.2`) dans un navigateur** (double-clic, ou `file://...`). Ne PAS passer par un lien hébergé de type Artifact/Claude — Cloudflare bloque l'accès à `localStorage` dans ce contexte, ce qui casse toute la persistance (bug rencontré et documenté durant la construction du projet).

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
| `index.html` | Cockpit/dashboard : météo Verchamps en direct, Score HSE, KPI globaux, Flash Info (interne + actus secteur), tendance AT/MP, grille des modules. |
| `registre-at-mp.html` | Registre des accidents du travail / maladies professionnelles — table filtrable, CRUD, import/export Excel. |
| `saisie-rh.html` | Formulaire de déclaration/édition d'un AT/MP (accès rh/admin). |
| `document-unique.html` | Registre DUERP — évaluations de risques par service, cotation, table filtrable, CRUD, import/export Excel. |
| `saisie-duerp.html` | Formulaire d'évaluation/édition d'un risque DUERP (accès rh/admin). |
| `plan-actions.html` | Plan d'Actions — agrège les actions issues du DUERP (Élevé/Critique) et d'Inspection/Audit (non-conformités), + création manuelle. |
| `sante-visites.html` | Santé & Visites — suivi de la surveillance médicale (roster dérivé du Registre AT/MP, à compléter). |
| `registre-sst.html` | Registre Santé & Sécurité (RSST réglementaire) — observations remontées par les agents, traitées par RH/admin. |
| `verifications-periodiques.html` | Suivi des contrôles techniques réglementaires (électricité, extincteurs, ascenseurs, etc.). |
| `inspection-audit.html` | Trames de contrôle réutilisables + inspections réalisées ; les non-conformités alimentent le Plan d'Actions. |
| `produits-chimiques.html` | Inventaire des produits chimiques par service, pictogrammes CLP, suivi des FDS. |
| `formation-habilitation.html` | Suivi des habilitations par agent (CACES, habilitation électrique, SST...) et de leurs échéances de renouvellement. |
| `epi-dotation.html` | EPI/vêtements de travail — catalogue, stock, dotation par agent, cycles de lavage/entretien. |
| `reporting.html` | Indicateurs & reporting KPI (accès rh/admin). |
| `administration.html` | Panneau admin (accès admin uniquement) : Utilisateurs, Référentiels (listes déroulantes éditables), Flash Info, Veille réglementaire, Journal d'audit. |
| `dossiers-atmp-citis.html` | Suivi administratif des dossiers AT/MP et maladies professionnelles : checklist documentaire (CMI, prolongations, certificat final, IPP, enquête/coûts), arrêtés d'imputabilité/CITIS avec workflow de signature. Accès via le modèle de permissions granulaires (§7) plutôt que par rôle fixe — voir aussi `ROADMAP-MODULES-FUTURS.md` module 18. |
| `accident-analyse.html` | Analyse des causes d'un accident (arbre des causes INRS, 5 Pourquoi ou Ishikawa au choix par analyse), rattachée à chaque événement du Registre AT/MP ; actions correctives remontant au Plan d'Actions (`origine:"Analyse"`). Accès via permission granulaire `accident-analyse` — voir `ROADMAP-MODULES-FUTURS.md` module 15. |
| `assets/tri-filtres.js` | **Premier fichier JS partagé du projet** (2026-09-14) — composant de tri et de filtres de colonne façon tableur, réutilisable sur n'importe quelle page à tableau. Voir §6 bis ci-dessous. |

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
}  // clé absente ou "none" = aucun accès sur ce module
```
- N'affecte **aucun** module existant — couche strictement additive.
- Trois modules câblés sur ce mécanisme à ce jour :
  - `dossiers-atmp-citis.html` (clé `"atmp-admin"`, read/write) — premier cas d'usage, 2026-09-13.
  - `saisie-rh.html` (clé `"atmp-declare"`, booléen `"write"`/absent) — permet à un manager/agent de déclarer un AT/MP sans avoir le rôle rh/admin. Répond au retour alpha "rendre paramétrable qui a le droit de déclarer un accident".
  - `accident-analyse.html` (clé `"accident-analyse"`, read/write) — module 15, voir `ROADMAP-MODULES-FUTURS.md`.
- Un `admin`/`rh` a toujours accès complet (`write`) à ces trois modules via son rôle ; un `manager`/`ag` n'y accède que si la permission lui a été explicitement accordée dans `administration.html` (onglet Utilisateurs).
- Géré dans `administration.html` (formulaire utilisateur, champs `uAtmpAdminPerm`/`uAtmpDeclarePerm`/`uAccidentAnalysePerm`) — pas encore une UI générique par module (ça reste à faire si d'autres modules adoptent ce mécanisme, voir la réflexion sur la refonte des permissions dans `ROADMAP-MODULES-FUTURS.md`, section J0).
- Pattern d'accès reproductible dans le code de chaque page : `const canAtmpAdmin = role === "admin" || role === "rh" || !!(session.modulePermissions && session.modulePermissions["atmp-admin"]);` — même principe transposable à un futur module avec une autre clé.
- **Sidebar à deux niveaux** : les liens dont la visibilité dépend d'une permission granulaire (pas seulement du rôle) ont chacun leur propre `id` et sont masqués/affichés individuellement (`display:none` par défaut, révélé par JS), plutôt que la section entière — évite d'afficher un lien qu'un détenteur d'une seule des permissions ne pourrait pas utiliser (ex. "Déclarer un AT/MP" et "Évaluer un risque" dans la section "Espace RH" sont maintenant deux toggles indépendants, pas un seul pour toute la section).

## 8. Modèle de données — clés `localStorage`

| Clé | Contenu | Écrite depuis |
|---|---|---|
| `vigie_hse_session` *(sessionStorage, pas localStorage)* | `{user, role}` de la session en cours | `login.html` |
| `vigie_hse_users` | Comptes utilisateurs (email/login, rôle, services, actif/inactif, mot de passe en clair) | `administration.html` (onglet Utilisateurs), lu par `login.html` |
| `vigie_hse_dataset` | Enregistrements AT/MP. Depuis 2026-09-13 : `dateDebutArret`/`dateFinArret` (saisies) + `joursArret`/`statutArret` ("En cours"/"Clôturé", calculés) remplacent l'ancien champ libre "nombre de jours" — les enregistrements plus anciens sans ces deux dates gardent leur `joursArret` hérité, affiché avec un statut "En cours" par défaut. | `saisie-rh.html`, lu/édité par `registre-at-mp.html` |
| `vigie_hse_rh_log` | Journal de saisie local (feed) côté formulaire AT/MP | `saisie-rh.html` |
| `vigie_hse_duerp_dataset` | Évaluations DUERP. Depuis 2026-09-14 : `dateEvaluation` (ISO, fixée à la création, préservée sur modification) pour permettre le filtrage par période dans `reporting.html` — présente uniquement sur les évaluations saisies manuellement via `saisie-duerp.html` depuis cette date ; les évaluations importées (Excel ou `DATATEST/`) n'en ont pas et restent donc toujours comptabilisées quelle que soit la période choisie. | `saisie-duerp.html`, lu/édité par `document-unique.html`, `plan-actions.html`, `reporting.html` |
| `vigie_hse_duerp_log` | Journal de saisie local (feed) côté formulaire DUERP | `saisie-duerp.html` |
| `vigie_hse_referentials` | Listes déroulantes éditables (risques, sièges, natures, statuts RH, services Ville/Agglo, familles DUERP) | `administration.html` (onglet Référentiels), lu par tous les formulaires/filtres |
| `vigie_hse_news` | Flash Info interne (actus rédigées par l'admin) | `administration.html` (onglet Flash Info), affiché sur `index.html` |
| `vigie_hse_veille` | Veille réglementaire / actualités du secteur HSE (titre, source, date ISO, catégorie, résumé, url, statut "À lire"/"Lu"/"Archivé") — remplace depuis 2026-09-13 l'ancien tableau codé en dur `SECTOR_NEWS` | `administration.html` (onglet Veille réglementaire, CRUD complet), affiché sur `dashboard.html` (statut "Archivé" masqué côté cockpit) |
| `vigie_hse_audit_log` | Journal d'audit global (création/modification/suppression, tous modules) | Toute page qui modifie des données, lu par `administration.html` (onglet Journal) |
| `vigie_hse_actions` | Actions du Plan d'Actions | `plan-actions.html` |
| `vigie_hse_visites` | Fiches de suivi santé/visites médicales | `sante-visites.html` |
| `vigie_hse_rsst` | Observations du Registre Santé & Sécurité | `registre-sst.html` |
| `vigie_hse_atmp_dossiers` | Checklist documentaire par dossier AT/MP (CMI, prolongations, certificat final, IPP, enquête/coûts), une entrée par `atmpId` | `dossiers-atmp-citis.html` |
| `vigie_hse_atmp_arretes` | Arrêtés d'imputabilité/CITIS (type, statut de signature, dates, autorité), plusieurs par `atmpId` | `dossiers-atmp-citis.html` |
| `vigie_hse_analyses_accident` | Analyse des causes d'un accident (méthode Arbre des causes/5 Pourquoi/Ishikawa au choix, conclusion, actions correctives), une entrée par `atmpId` | `accident-analyse.html`, actions correctives lues par `plan-actions.html` (`origine:"Analyse"`) |
| `vigie_hse_verifications` | Équipements et leur historique de vérification périodique | `verifications-periodiques.html` |
| `vigie_hse_weather_location` | Ville choisie manuellement pour le widget météo (`{name, admin1, country, lat, lon}`) | `dashboard.html` |

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
- **Délégation à des agents en arrière-plan** : un agent a un jour continué à travailler ~2h après la fin de sa tâche assignée, en inventant lui-même des suites non demandées, jusqu'à échouer sur une limite de débit. Depuis, toute délégation à un agent en arrière-plan (`fork`) est bornée explicitement ("fais exactement ceci, puis ARRÊTE-TOI, n'invente rien au-delà"), et son travail est systématiquement re-vérifié indépendamment (pas seulement son propre rapport) avant d'être présenté comme terminé.

## 12. Travaux en cours / derniers événements (au moment de la rédaction)

- Modules RSST et Vérifications Périodiques : terminés et vérifiés.
- Séparation Flash Info interne / Actualités du secteur HSE : terminée.
- Widgets météo (Open-Meteo, Verchamps) et Score HSE compact intégrés à la topbar de `index.html`, cliquables (météo → portail Météo France, score → ancre vers le détail sur la page).
- Généralisation de l'en-tête compact/sticky (`.page-summary`) à tous les modules : terminée.
- Modules Indicateurs & Reporting KPI, Mode démonstration, Exports professionnels (PDF/Excel généralisé), EPI/dotation, Dashboard mobile simplifié : tous terminés — voir `ROADMAP-MODULES-FUTURS.md` pour le détail par module.
- Menu latéral : bouton "épingler" pour empêcher le repli automatique, et zone de navigation rendue défilante indépendamment de l'en-tête/pied de sidebar (corrige un cas où trop d'éléments de menu rendaient le bouton de déconnexion inatteignable sur un écran bas).
- Réponses du préventeur aux questions 4 à 7 du Cahier reçues et consignées le 2026-09-16 (`QUESTIONS-METIER-EN-ATTENTE.md`) : Q4 mise en œuvre le jour même (surveillance médicale renforcée par habilitation, `sante-visites.html`) ; Q5/Q6/Q7 reportées dans `ROADMAP-MODULES-FUTURS.md` (modules 5, 16, 17 — pas encore construits).
- **État courant** : la checklist QA V1 (75 points, dont 12 ajoutés le 2026-09-15) a été déroulée intégralement le 2026-09-15 — voir l'entrée datée correspondante dans `ROADMAP-MODULES-FUTURS.md` et `BUGS-CONNUS.md` pour les constats remontés (3 corrigés le jour même). Toutes les questions bloquantes/à anticiper du Cahier (Q1-Q7) sont désormais répondues. Reste avant le gel `v1.0.0` : présentation à un professionnel externe pour un retour à froid — voir `PLAN-VERSIONS-V1.md`.

## 13. Comment vérifier qu'un fichier n'est pas cassé après édition

Pas de Node/navigateur disponible dans cet environnement pour exécuter le JS. Méthode utilisée tout du long : compter les accolades/parenthèses/crochets ouvrants vs fermants dans chaque bloc `<script>` via une regex PowerShell. Un déséquilibre n'est pas toujours une vraie erreur (ex. une chaîne de caractères contenant une parenthèse littérale comme `" ("` faussera le compte) — en cas de déséquilibre, inspecter la ligne concernée avant de conclure à un bug réel.

## 14. Prochaines étapes

Voir `ROADMAP-MODULES-FUTURS.md` dans ce même dossier pour le backlog détaillé des modules à construire, avec statut et annotations.

Prochaines étapes techniques à garder en tête pour une vraie mise en production (au-delà du backlog fonctionnel) :
- Remplacer `localStorage` par un vrai backend + base de données (le pattern "always-merge seed+stored" devra être repensé — il n'a de sens que pour un stockage local par navigateur).
- Vraie authentification (hash de mot de passe, sessions serveur).
- RGPD : chiffrement/anonymisation réelle des données personnelles, pas seulement du masquage d'affichage par rôle.
- CSS partagé (actuellement dupliqué dans chaque fichier — un changement de design system implique d'éditer chaque page une par une).
