# VIGIE HSE — Roadmap des modules futurs

## 🔝 Point de reprise (fin de journée du 2026-09-14)

**Livré ce jour** (16 commits, tout poussé sur `main`) : module 9 (Reporting — période libre, tous les modules réactifs, graphiques par risque), module 15 (Analyse d'accident, 3 méthodes au choix), deux nouvelles permissions granulaires (`atmp-declare`, `accident-analyse`), les 3 derniers points du retour alpha (en-tête du cockpit, icônes DUERP, tri & filtres), et le **déploiement complet du tri/filtres façon tableur sur les 10 pages à tableau**.

**Le backlog des retours alpha est vide.** Modules restants : 5, 7 (extension), 8, 12, 13, 14, 16, 17 — **tous en attente d'un avis métier**, pas d'un arbitrage technique.

**➡️ À faire en reprenant :** lire les réponses du préventeur sur le *Cahier du préventeur* (outil Artifact, `read_db` sur les collections `reponses` et `idees` — lien et procédure en tête de `QUESTIONS-METIER-EN-ATTENTE.md`). Ses premières réponses étaient attendues dans la soirée du 14. Reporter ses décisions dans le registre, ses idées ici, puis mettre en œuvre. Rien d'autre n'est débloqué sans lui.

**Chantiers techniques possibles sans lui, si besoin d'avancer :** dérouler la checklist QA (nécessite un humain dans un vrai navigateur). ~~Factoriser les 3 rosters d'agents dupliqués~~ — fait le 2026-09-16, voir Notes générales en fin de document.

---

## État courant / évolutions du 2026-09-12

- ✅ **Données de test** : les 10 fichiers générés par Gemini (`Documentation/PROMPT-GENERATION-DONNEES-TEST.md`), vérifiés et corrigés, sont dans `DATATEST/`. Chaque module a désormais un vrai bouton "Importer .xlsx", **et** un **auto-chargement automatique** de ces fichiers au chargement de chaque page quand le site est servi en http/https (GitHub Pages) — plus besoin de cliquer un par un. IDs déterministes (`dtst-*`) pour éviter les doublons au rechargement.
- ✅ **Météo sans géolocalisation** : le widget météo (topbar, cockpit) ne demande plus la permission de localisation au navigateur. L'utilisateur choisit lui-même sa ville via une popover de recherche (API de géocodage Open-Meteo), le choix est mémorisé dans le navigateur.
- ✅ **Contenu centré** : sur tous les modules, la zone de contenu principale est maintenant centrée horizontalement sur grand écran (`margin:0 auto` ajouté à `.content`) au lieu de rester collée à gauche.

⚠️ **Rappel important** : l'auto-chargement DATATEST tourne pour **tous les visiteurs**, pas seulement en interne — un nouveau testeur verra directement les données de démo au lieu d'une app vraiment vierge. Le jour où une vraie remise à zéro est nécessaire, vider ou renommer `DATATEST/`.

📋 **Registre des questions métier (créé le 2026-09-14)** : `Documentation/QUESTIONS-METIER-EN-ATTENTE.md` centralise toutes les questions relevant du **métier de la prévention** (réglementation, seuils, façon de lire un indicateur) auxquelles la technique ne peut pas répondre seule — elles sont destinées à un collègue expert HSE. Y sont déjà consignées 2 questions bloquantes (calculs du module Reporting) et 5 questions à anticiper, extraites des sections 5, 7, 16, 17 et 18 de cette roadmap. **Toute nouvelle question de profession rencontrée pendant le développement doit y être ajoutée** plutôt que tranchée à l'aveugle ; la roadmap ne garde que les décisions produit/technique.

## ✅ Vérification sur le site déployé (2026-09-13)

Passage QA effectué directement sur `https://layinolias.github.io/Vigie-hse/` (navigateur automatisé) :
- Auto-chargement DATATEST confirmé fonctionnel sur AT/MP (25), DUERP (30), Inspection/Audit (3 trames + 15 inspections), RSST (15), EPI Dotation (12 catalogue + 20 dotations), Santé & Visites (15), Produits Chimiques (15).
- **Bug trouvé et corrigé** (commit `a7d34e9`) : dans 6 fichiers (Registre SST, Santé & Visites, Inspection/Audit, Produits Chimiques, EPI Dotation, Plan d'Actions), les cellules de date Excel remontaient comme objets `Date` JS natifs (SheetJS + `cellDates:true`) et un simple `String(...)` produisait un format illisible (`Wed Jun 17 2026 23:59:59 GMT+0200...`) au lieu de `2026-06-17`. Corrigé avec un parseur de date dédié dans chaque import (manuel + auto-chargement). Re-vérifié après correction : toutes les dates s'affichent proprement.
- Météo : confirmé, aucune demande de géolocalisation ; popover de recherche de ville fonctionnelle.
- Centrage : confirmé sur grand écran (1920px testé), contenu centré avec marges symétriques.

**Reste à faire** : dérouler le reste de `Documentation/CHECKLIST-QA-V1.md` (rôles manager/RH/AG, responsive mobile, multi-navigateur) — nécessite un humain pour les parties non automatisables (vrai téléphone, Safari, etc.).

## ✅ Checklist QA V1 déroulée intégralement (2026-09-15)

Les 63 points de `Documentation/CHECKLIST-QA-V1.md` ont été cochés un par un dans un vrai navigateur par le porteur du projet, via la version cliquable en ligne (`https://claude.ai/artifact/NJNe2DQgKFo3gvDfrtYPaf`) : parcours complet par rôle (admin, rh, manager, ag, `PREV1`), tri & filtres de colonne, fonctionnalités transverses, responsive mobile, multi-navigateur (Chrome, Firefox, Safari).

**Constats remontés en cours de passage, corrigés le jour même** (détail dans `Documentation/BUGS-CONNUS.md`) :
- Le popover météo (choix de ville) ne se fermait jamais — CSS uniquement, `dashboard.html`.
- Sur une largeur de page réduite (~650-900px, pas encore mobile), le widget météo et le sélecteur Ville/Agglomération/Tous chevauchaient le Score HSE dans la topbar — le seuil d'empilement mobile a été avancé pour couvrir cette zone.
- Import Excel absent sur 2 modules (`dossiers-atmp-citis.html`, `accident-analyse.html`) alors que l'export y était déjà présent — ajouté sur le même modèle que le Registre AT/MP (pour `accident-analyse.html`, seuls les champs plats de l'analyse sont ré-importables, pas l'arbre causal — voir `BUGS-CONNUS.md` pour le détail de ce choix de périmètre).

**Ajout à la checklist elle-même**, demandé pendant le passage (le porteur n'avait vérifié en détail la visibilité des données par rôle que sur le Registre AT/MP) : nouvelle sous-section "Visibilité des données par tableau (tous rôles)" dans `## 3. Parcours complet par rôle`, un point par module à tableau (12 points) — total checklist désormais 75 points.

**Pas encore fait** : présentation à un professionnel HSE externe pour un retour à froid — toujours en recherche, dernier point du gel `v1.0.0` dans `PLAN-VERSIONS-V1.md`.

---

Version organisée et suivie de `future modules.txt` (notes brutes laissées à la racine du dossier `Projet HSE`, conservées telles quelles — ce document-ci en est la réorganisation avec suivi d'avancement et annotations techniques).

**Légende statut :** ❌ Non démarré · 🔶 Base posée / partiellement couvert · ✅ Fait · 💤 En pause

Pour le contexte général du projet (stack, architecture, comment tester), voir `ETAT-DU-PROJET.md` dans ce même dossier.

---

## Vue d'ensemble

**Jalon stratégique** (transverse, distinct des modules fonctionnels ci-dessous — voir section dédiée juste après) :

| Jalon | Statut |
|---|---|
| **J0 — Généralisation commerciale (collectivités + secteur privé)** | ❌ Non démarré — prérequis à toute commercialisation |
| **J1 — Accompagnement certification sécurité (ISO 45001, MASE...)** | ❌ Non démarré — version ultérieure, tour d'horizon des référentiels à faire |
| **J2 — Culture sécurité, remontée presque-accident/incident/accident** | ❌ Non démarré — piste posée, à approfondir plus tard ; premier pas fait dans le Registre AT/MP |

**Modules fonctionnels** :

| # | Module | Statut |
|---|---|---|
| 1 | Veille réglementaire | ✅ Fait — `administration.html` (onglet Veille réglementaire), affiché sur `dashboard.html` |
| 2 | Inspection / Audit | ✅ Fait — `inspection-audit.html`, alimente le Plan d'Actions |
| 3 | Plan d'Actions (hub transverse) | ✅ Fait — agrège désormais DUERP + Inspection/Audit |
| 4 | Gestion des produits chimiques | ✅ Fait — `produits-chimiques.html` |
| 5 | Pénibilité & fiches individuelles | ❌ Non démarré |
| 6 | Formation / Habilitation | ✅ Fait — `formation-habilitation.html` |
| 7 | Santé au travail — planning des visites médicales | 🔶 Base posée — extension prévue |
| 8 | Gestion documentaire (wiki++ HSE) | ❌ Non démarré — vision élargie, contenu fiches de sécurité/familles de risque ajouté 2026-09-12 |
| 9 | Indicateurs & reporting KPI | ✅ Fait — `reporting.html`, sélecteur calendaire + tous modules période-conscients + graphiques par risque (2026-09-14) |
| 10 | EPI, dotation & entretien | ✅ Fait — `epi-dotation.html` |
| 11 | Dashboard mobile simplifié | ✅ Fait |
| 12 | Accueil au poste | ❌ Non démarré (nouveau, retour alpha 2026-09-12) |
| 13 | Dialogue social | ❌ Non démarré (nouveau, retour alpha 2026-09-12) — nécessite un nouveau rôle/compte "Représentant du personnel" |
| 14 | Gestion administrative RH | ✅ Fait (2026-09-19) — `gestion-rh.html`, les deux volets (données RH + organigramme) |
| 15 | Analyse d'accident (arbre des causes) | ✅ Fait (2026-09-14) — `accident-analyse.html`, 3 méthodes au choix, alimente le Plan d'Actions |
| 16 | Situations d'urgence & exercices d'évacuation | ✅ Fait (2026-09-18) — volet "exercices réalisés" ; plans d'urgence par site reportés |
| 17 | Entreprises extérieures & Plan de Prévention | ✅ Fait (2026-09-19) — `entreprises-exterieures.html` ; frontière exacte du seuil 400 h en attente (Q8) |
| 18 | Gestion administrative des dossiers AT/MP & CITIS | ✅ Fait (2026-09-13) — `dossiers-atmp-citis.html`, premier cas d'usage du modèle de permissions granulaires (voir J0) |

---

## J0 — Jalon stratégique : généraliser le produit à un usage commercial (collectivités + secteur privé) — ❌ Non démarré

**Objectif exprimé par l'utilisateur :** faire de VIGIE HSE, au-delà du prototype pour une collectivité (Ville de Verchamps + Agglomération, collectivité fictive de démonstration), un produit **vendable**, générique, adaptable à "une multitude de projets" — aussi bien des collectivités territoriales que des entreprises privées. C'est un jalon *transverse* : il ne s'agit pas d'un module métier de plus, mais d'une étape de normalisation qui conditionne la commercialisation, à traiter avant (ou en parallèle réfléchi de) l'ajout de nouveaux modules métier.

### Bonne nouvelle : le socle réglementaire est déjà commun aux deux mondes

Recherche effectuée : en santé-sécurité au travail, la fonction publique territoriale et le secteur privé sont **tous deux soumis au Code du travail** — le décret n° 85-603 du 10 juin 1985 modifié rend applicables les livres I à V de la 4ᵉ partie du Code du travail aux collectivités territoriales. Concrètement, **le DUERP est une obligation universelle**, pas une spécificité territoriale — le cœur fonctionnel de VIGIE HSE (Registre AT/MP, Document Unique, plan d'actions, vérifications périodiques) est donc déjà pertinent tel quel pour une entreprise privée. Ce qui doit changer, ce n'est pas la logique métier, mais le **vocabulaire, l'organisation, et la personnalisation**.

### Ce qui doit devenir générique — vocabulaire et instances représentatives

Recherche effectuée sur les équivalences terminologiques entre secteur privé et collectivité territoriale :

| Concept | Collectivité territoriale (actuel) | Entreprise privée (équivalent) |
|---|---|---|
| Personnel | Agent | Salarié |
| Structure employeuse | Collectivité | Entreprise |
| Instance représentative globale | CST (Comité Social Territorial) | CSE (Comité Social et Économique) |
| Formation santé-sécurité de cette instance | F3SCT (≥ 200 agents) | CSSCT (≥ 300 salariés) |
| Cadre réglementaire de référence | Décret n° 85-603 (renvoie au Code du travail) | Code du travail directement |

**Implication pour le code :** tous les textes actuellement codés en dur qui supposent une collectivité ("agent", "Ville"/"Agglomération", "F3SCT" dans la description du RSST, "collectivité" comme libellé de champ) devront devenir des **libellés configurables par organisation cliente**, pas des constantes. Le pattern existe déjà partiellement : `vigie_hse_referentials` permet déjà de reconfigurer des listes (services, risques) sans toucher au code — il faudra l'étendre à la terminologie elle-même (noms des champs, des instances, des statuts RH) et pas seulement aux valeurs des listes déroulantes.

### Réflexion actée — refonte complète du système de comptes/rôles/permissions (2026-09-12)

Point soulevé par l'utilisateur suite à un retour de test alpha mentionnant un rôle "Préventeur" qui n'existe pas dans le système actuel (aujourd'hui : 4 rôles fixes codés en dur, `admin`/`rh`/`manager`/`ag`, définis dans `login.html`). Plutôt que d'ajouter des rôles fixes au coup par coup à chaque nouveau besoin (un "Préventeur" pour l'AT/MP, un "Représentant du personnel" pour le futur module Dialogue social — voir module 13 — et probablement d'autres ensuite), l'utilisateur demande une **réflexion de fond**, pas encore un chantier spécifié :

- **Objectif explicite : éviter les doublons de comptes/profils** pour des permissions quasi identiques.
- **Direction envisagée : un modèle de permissions granulaire façon Discord** — des cases à cocher par type d'accès, plutôt que des rôles fixes en dur.
- **Structure envisagée pour une permission unitaire :** création de profil → quel service → quel module → lecture ou écriture (donc un triplet service × module × niveau d'accès, potentiellement répété pour chaque combinaison autorisée).
- **Profils préréglés ET personnalisables** : des profils génériques standards (probablement les 4 rôles actuels comme point de départ, plus Préventeur/Représentant du personnel), mais renommables et dont les permissions restent modifiables — sans empêcher la création de profils entièrement sur-mesure.
- **Lien avec le jalon J0** : cette réflexion rejoint directement le chantier de généralisation du vocabulaire ci-dessus et celui des unités organisationnelles ci-dessous — un système de permissions par (service générique × module × lecture/écriture) est probablement plus facile à généraliser pour un client privé qu'un jeu de rôles nommés spécifiques à une collectivité. À concevoir ensemble plutôt que comme deux chantiers séparés.
- **Non traité pour l'instant** : cette note capture l'intention, pas une spécification. Avant de coder quoi que ce soit, il faudra définir le modèle de données exact (comment représenter un profil et ses permissions dans `vigie_hse_users`/`vigie_hse_referentials`), et si ce chantier doit rester dans l'architecture localStorage actuelle ou attendre le vrai backend multi-tenant (la gestion de permissions fines par tenant est justement le genre de chantier qui bénéficie d'une vraie base de données).
- **✅ Premier cas d'usage réel construit le 2026-09-13, étendu à deux modules de plus le 2026-09-14** : module 18 (Dossiers AT/MP & CITIS) a ouvert la voie avec `u.modulePermissions = { "atmp-admin": "read"|"write" }` ; la session du 2026-09-14 a ajouté `"atmp-declare"` (déclarer un AT/MP, booléen) et `"accident-analyse"` (module 15, read/write) sur le même principe — trois clés indépendantes plutôt qu'un rôle "Préventeur" codé en dur. Toujours câblé module par module (pas encore le tableau générique module × service × lecture/écriture avec UI d'administration dédiée), mais le mécanisme a maintenant fait ses preuves sur plusieurs cas d'usage réels avant de décider si/quand généraliser.

### Ce qui doit devenir générique — structure organisationnelle

Le distingo actuel "Ville / Agglomération" est une **structure à 2 niveaux spécifique à cette collectivité précise** (commune + intercommunalité). Une entreprise privée n'a pas cette dichotomie — elle a plutôt des sites/filiales/directions/agences. Il faut remplacer ce couple figé par une notion générique d'**unités organisationnelles configurables** (nombre variable, hiérarchie libre : ça peut être 1 seule entité, ou une arborescence à plusieurs niveaux selon le client), dont "Ville"/"Agglomération" ne serait qu'une configuration possible parmi d'autres.

**Point à préciser (soulevé 2026-09-12) : la gestion du cycle de vie des services eux-mêmes.** Au-delà du nombre de niveaux hiérarchiques, il faut réfléchir à comment un service est **ajouté, renommé ou supprimé** en cours d'exploitation, une fois des données déjà rattachées à ce service. Aujourd'hui, `administration.html` → Référentiels permet déjà un CRUD basique sur deux listes fixes ("Services — Ville", "Services — Agglomération"), mais uniquement ces deux catégories figées — pas une hiérarchie d'unités organisationnelles générique. À traiter dans le même chantier : que devient un service supprimé s'il est encore référencé par des déclarations AT/MP, évaluations DUERP, dotations EPI, etc. (renommage propagé partout, ou service "archivé" mais conservé pour l'historique) ?

### Ce qui doit devenir générique — contenu éditorial et branding

- ~~Le widget météo de `index.html` est câblé en dur sur une ville fixe~~ — **fait** : il utilise désormais la géolocalisation du navigateur du visiteur (repli sur la localisation IP si refusé), donc déjà générique par construction, pas besoin de configuration par client sur ce point.
- Le panneau "Actualités du secteur HSE" est actuellement composé de 7 actus **orientées fonction publique territoriale** (DUERP collectivités, plan santé fonction publique, arrêts maladie agents territoriaux). Un client privé aurait besoin d'un jeu d'actus différent (actualité Code du travail générale, jurisprudence CSE/CSSCT, actualité INRS — déjà pertinente pour les deux mondes). Prévoir soit deux jeux de contenu (profil "collectivité" / profil "entreprise"), soit un contenu recentré sur ce qui est commun (INRS, veille légale générale) complété par un module éditable par client (rejoint le module 1 "Veille réglementaire" du backlog fonctionnel).
- Nom "VIGIE HSE", palette, logo : à traiter en **marque blanche** — un nom/logo/palette par client, pas un branding figé.

### Chantiers techniques structurants

- **Sortir du localStorage mono-utilisateur vers un vrai backend multi-tenant.** C'est le changement le plus lourd : aujourd'hui chaque navigateur a sa propre copie des données, ce qui est incompatible avec un produit vendu à plusieurs organisations distinctes devant chacune avoir leurs données isolées et partagées entre leurs propres utilisateurs. Implique une vraie base de données, une vraie authentification (actuellement mot de passe en clair côté client — inacceptable pour un produit commercial), et une isolation stricte des données par client (tenant).
- **Paramétrage par client** : un client = sa propre configuration (unités organisationnelles, terminologie, listes de référence, branding, comptes utilisateurs) sans toucher au code — étendre le principe déjà amorcé par `vigie_hse_referentials`/`administration.html` à une vraie couche de configuration par tenant.
- **Le pattern "always-merge seed+stockage"** (voir `ETAT-DU-PROJET.md` §9) devra être repensé : il n'a de sens que pour du stockage local par navigateur. Dans une architecture multi-tenant, l'équivalent sera une configuration d'onboarding par client (données de démarrage éventuelles, pas un "seed" fusionné à chaque chargement de page).

### Paysage concurrentiel (pour se positionner, pas pour copier)

Recherche effectuée sur le marché français des logiciels QHSE : le marché comprend des acteurs comme **BlueKanGo** (acteur français historique, plateforme modulaire QHSE/RSE avec IA, plutôt ETI/grands comptes, entrée de gamme annoncée autour de 49 €/licence/mois mais déploiements complets sur devis), **SafetyCulture** et **Kizeo Forms** (forts sur les audits terrain mais ne couvrant pas tout le spectre QHSE), **Qontinua** et **NOVYSTA** (positionnement tarifaire transparent), **Qualishare**, **Winlassie**. Aucun de ces comparatifs ne mentionne d'offre spécifiquement pensée pour être **à la fois** collectivité et entreprise privée avec le même socle — c'est un angle de différenciation possible pour VIGIE HSE plutôt qu'une fonctionnalité à copier.

### Obligations légales à anticiper en tant qu'éditeur (et non plus simple utilisateur interne)

Vendre ce logiciel à des tiers change le statut RGPD du projet : l'éditeur devient **sous-traitant au sens de l'article 28 du RGPD** pour chacun de ses clients (le client restant responsable de traitement). Recherche effectuée — obligations à prévoir avant toute commercialisation :
- Un contrat de sous-traitance (DPA) par client, précisant finalités, types de données, mesures de sécurité, sort des données en fin de contrat.
- Un registre des activités de traitement (art. 24 RGPD), et possiblement un DPO selon le volume/la sensibilité des données traitées.
- Traçabilité des sous-traitants ultérieurs (hébergeur, service d'email, etc. — actuellement aucun, puisqu'il n'y a pas de backend).
- **Ceci n'est pas un conseil juridique** — à faire valider par un professionnel du droit avant toute commercialisation réelle, en particulier vu le durcissement récent des contrôles CNIL évoqué dans la recherche (sanctions pouvant atteindre 10 M€ ou 2% du chiffre d'affaires mondial pour un éditeur SaaS en faute).

### Pourquoi ce jalon est un prérequis, pas un module parmi d'autres

Chaque nouveau module métier construit *avant* ce jalon (voir liste 1-14 ci-dessous) risque de re-coder en dur les mêmes suppositions "collectivité territoriale" (vocabulaire, Ville/Agglomération, F3SCT...) qu'il faudra ensuite désapprendre. **Recommandation : traiter au minimum la généralisation du vocabulaire et de la structure organisationnelle avant de construire beaucoup plus de modules 1-9**, pour éviter d'avoir à tout reprendre a posteriori. Le passage à un vrai backend multi-tenant, en revanche, peut raisonnablement rester postérieur — il ne bloque pas la conception générique du modèle de données et du vocabulaire, qui peut se préparer dès maintenant dans l'architecture actuelle.

---

## J1 — Jalon complémentaire : accompagnement à la certification sécurité (ISO 45001 et autres) — ❌ Non démarré (version ultérieure)

**Objectif exprimé par l'utilisateur (2026-09-12) :** étudier, pour une version ultérieure (explicitement pas un chantier immédiat), la possibilité d'aider une collectivité/entreprise cliente à obtenir ou conserver une certification de système de management de la santé-sécurité au travail. Confronter ce que VIGIE HSE produit déjà aux exigences de ces référentiels, identifier les modules qui manquent, et ne retenir que ceux qui apportent une vraie valeur ajoutée par rapport à une certification "à la main" (audit papier, tableurs).

**Précision importante (2026-09-12) : ne pas se limiter à ISO 45001.** L'utilisateur souligne à raison qu'il existe plusieurs référentiels de certification sécurité pertinents en France, pas un seul — au moins **MASE** (Manuel d'Amélioration Sécurité des Entreprises, très répandu en France notamment dans l'industrie/BTP/collectivités, avec un fonctionnement différent d'ISO 45001 : adhésion via un Comité Régional MASE, référentiel propre, pas un audit ISO classique) doit être étudié à côté d'ISO 45001, et probablement d'autres selon le secteur. **Avant de se lancer dans quoi que ce soit sur ce jalon, faire un tour d'horizon comparatif de ces différents référentiels** (couverture, démarche de certification, public visé, ce qui les distingue d'ISO 45001) plutôt que de concevoir une seule matrice de conformité pensée uniquement pour ISO 45001 — la recherche ISO 45001 ci-dessous reste valable comme premier exemple travaillé, mais ne doit pas être traitée comme la seule cible.

**Recherche effectuée — structure de la norme ISO 45001:2018 :** la norme suit la structure commune aux normes de management ISO (Annexe SL, partagée avec ISO 9001 qualité et ISO 14001 environnement), en 10 clauses dont 7 portent des exigences (clauses 4 à 10) : Contexte de l'organisme, Leadership et participation des travailleurs, Planification, Support, Réalisation des activités opérationnelles, Évaluation des performances, Amélioration. [ISO 45001 Clauses Explained (Effivity)](https://www.effivity.com/health-and-safety-management-system/iso-45001-clauses) · [ISO 45001:2018 Clause Structure (45001 Store)](https://45001store.com/articles/iso-45001-detail/)

**Recherche effectuée — informations documentées exigées :** contrairement à l'ancien référentiel OHSAS 18001, ISO 45001 ne fixe pas de format imposé (pas de "manuel qualité" obligatoire), mais exige que certaines informations soient *tenues à jour* (politique, procédures) et d'autres *conservées comme preuve* (enregistrements). Documents/enregistrements mandatés cités par les sources : périmètre du système de management, politique HSE, preuves de compétence du personnel, enregistrements d'incidents/investigations, enregistrements de surveillance/mesure (inspections, audits, évaluations). [List of mandatory documents (Advisera)](https://advisera.com/45001academy/blog/2018/03/28/list-of-mandatory-documents-according-to-iso-45001/) · [Mandatory documents (IT Governance)](https://www.itgovernance.co.uk/blog/list-of-mandatory-documents-required-by-iso-45001)

**Confrontation clause par clause — ce qui est déjà couvert, ce qui manque :**

| Exigence ISO 45001 | Déjà couvert par VIGIE HSE | Statut |
|---|---|---|
| 6.1 — Identification des dangers, évaluation des risques | Document Unique (DUERP) | ✅ Cœur de métier déjà là |
| 6.1 — Veille des exigences légales | Module 1, Veille réglementaire | ✅ Fait |
| 7.2/7.3 — Compétence, sensibilisation | Formation/Habilitation | ✅ Fait |
| 5.4 — Participation et consultation des travailleurs | RSST + futur module 13 (Dialogue social) | 🔶 Base posée / prévu |
| 8.1 — Maîtrise opérationnelle | Plan d'Actions, Inspection/Audit, Vérifications périodiques, Produits chimiques | ✅ Fait |
| 9.1 — Surveillance, mesure, analyse | Indicateurs & Reporting KPI | ✅ Fait |
| 10.2 — Incidents, actions correctives | Registre AT/MP + Plan d'Actions | ✅ Fait |
| 7.5 — Maîtrise des informations documentées | Module 8, Gestion documentaire | ❌ Non démarré (déjà identifié) |
| **5.2 — Politique HSE formalisée, publiée, revue** | *Rien aujourd'hui* | ❌ **Écart identifié** |
| **8.2 — Préparation et réponse aux situations d'urgence** | *Rien aujourd'hui* | ❌ **Écart identifié** |
| **9.2 — Programme d'audit interne du système de management** | Inspection/Audit couvre le contrôle terrain, pas un audit du système lui-même (le SMS est-il suivi ? est-il efficace ?) | 🔶 **Écart partiel** |
| **9.3 — Revue de direction** | *Rien aujourd'hui* | ❌ **Écart identifié — exigence dure, quasi systématiquement demandée en audit** |

**Modules/extensions candidats à étudier (par ordre de probable valeur ajoutée) :**

1. **Revue de direction** — le plus gros manque : un enregistrement structuré (ordre du jour normé : actions issues des revues précédentes, évolutions du contexte, performance HSE/incidents/résultats d'audits, retours de consultation des travailleurs, risques et opportunités ; décisions, ressources, actions) tenu périodiquement, daté, archivé. C'est l'un des tout premiers documents qu'un auditeur externe réclame — un vrai gain immédiat pour la crédibilité "prêt à l'audit".
2. **Préparation aux situations d'urgence** — plans d'urgence par site, exercices d'évacuation planifiés et leurs résultats, contacts d'urgence, retours d'expérience post-exercice. Promu module à part entière le 2026-09-12 — voir **module 16, Situations d'urgence & exercices d'évacuation**.
3. **Politique HSE** — un document de politique versionné, daté, publié (probablement dans le futur module Gestion documentaire), avec preuve de communication aux agents (pourrait s'appuyer sur le futur module 12, Accueil au poste, pour l'émargement de prise de connaissance).
4. **Programme d'audit interne formalisé** — étendre Inspection/Audit avec une couche "audit du système" distincte des inspections terrain : calendrier d'audits annuel, périmètre/critères par audit, traçabilité de la qualification de l'auditeur.
5. **Idée à plus forte valeur ajoutée : une matrice de conformité multi-référentiels intégrée à l'app** (ISO 45001, MASE, et d'autres selon le tour d'horizon à faire). Plutôt que de combler des écarts pensés pour une seule norme, une vue dédiée (dans Reporting ou Administration) qui relie chaque exigence de chaque référentiel choisi aux données déjà présentes dans VIGIE HSE et signale en direct ce qui est prêt/à compléter transformerait l'app en véritable outil d'accompagnement à la certification, pas seulement un tracker HSE qui se trouve aussi couvrir une norme. C'est probablement l'angle qui différencie le plus par rapport à un accompagnement "à la main" — à confirmer avec toi avant d'aller plus loin.

**Cadrage :** explicitement une étude pour une version ultérieure, pas un chantier à démarrer maintenant — et explicitement pas limitée à ISO 45001 (voir précision ci-dessus). **Ceci n'est pas un conseil de certification** — la certification effective reste délivrée par un organisme certificateur/comité accrédité après audit externe ; VIGIE HSE peut outiller la préparation et la collecte de preuves, pas se substituer à l'audit lui-même.

---

## J2 — Jalon complémentaire : culture sécurité en entreprise, via la remontée d'information — ❌ Non démarré (piste à approfondir plus tard)

**Intention exprimée par l'utilisateur (2026-09-12) :** au-delà du strict enregistrement réglementaire des AT/MP, développer un axe produit autour de la **culture de la sécurité** dans une organisation, portée par un vrai processus de remontée d'information à plusieurs étages : **presque-accident** (near-miss, aucune conséquence) → **incident bénin** (conséquence mineure, sans arrêt) → **accident** (avec ou sans arrêt). L'idée directrice — classique en prévention des risques (pyramide de Bird/Heinrich) — est qu'une organisation qui recueille et traite bien les signaux faibles (presque-accidents) réduit mécaniquement sa sinistralité réelle ; encourager et faciliter cette remontée est donc un levier de sécurité à part entière, pas seulement un exercice de conformité. **Premier pas déjà posé (2026-09-12) :** le Registre AT/MP distingue désormais 4 types d'événement — `Accident de travail`, `Accident de trajet`, `Incident bénin` (renommé depuis `Bénin`), et `Presque accident` (nouveau) — saisissables depuis `saisie-rh.html` et affichés avec leur propre code couleur dans `registre-at-mp.html`. Le jeu de données de démonstration reflète volontairement une pyramide où les presque-accidents/incidents bénins sont plus nombreux que les accidents avérés.

**Explicitement non cadré pour l'instant** — l'utilisateur a indiqué que ce sujet sera creusé plus en profondeur dans une session ultérieure. Pistes déjà entrevues à réévaluer à ce moment-là plutôt qu'à développer maintenant : un canal de signalement simplifié/anonymisable pour le presque-accident (à l'image de l'option d'anonymat déjà présente dans le RSST) ; un indicateur dédié au taux de remontée (ratio presque-accidents/incidents/accidents, à comparer aux repères de la littérature prévention) ; une articulation avec le futur module Dialogue social (13), avec le futur module Analyse d'accident (15, ajouté le 2026-09-12 — l'analyse des causes est le prolongement naturel d'une bonne remontée), et avec le jalon J1 (la remontée structurée des incidents est aussi une exigence de certification, clause 10.2).

---

## 1. Veille réglementaire — ✅ Fait (version légère)

**Note d'origine :** "veille réglementaire :" *(note laissée vide par l'utilisateur — objectif à préciser)*

**Livré le 2026-09-13 (version légère, option 1 du plan ci-dessous) :** le panneau "Actualités du secteur HSE" (`dashboard.html`) est maintenant piloté depuis un vrai CRUD dans `administration.html` (nouvel onglet "Veille réglementaire", clé `vigie_hse_veille`), avec exactement les champs prévus : titre, source, date, résumé, url, + catégorie (Loi / Réglementation, Jurisprudence, Norme / Référentiel, Actu métier) et statut (À lire / Lu / Archivé). Le statut "Archivé" masque l'actu du cockpit public sans la supprimer. Seed initial = les 7 mêmes actus réelles qu'avant (dates converties au format ISO), avec le même pattern "seed une seule fois" que Flash Info (`stored === null`, pas `always-merge`) — l'admin peut vider la liste sans qu'elle se re-remplisse toute seule.

**Ce qui reste hors périmètre (repoussé, cohérent avec l'analyse d'origine) :**
- Pas de flux live (impossible sans backend — la plupart des sites d'actu HSE/juridiques n'autorisent pas le fetch cross-origin depuis un navigateur, et ce projet n'a pas de serveur proxy).
- Pas de lien structuré vers les modules impactés (ex. "ce changement de loi DUERP impacte le module Document Unique") — la catégorisation reste libre-texte, pas un vrai rattachement.
- *Version connectée* (option 2, non retenue) : nécessiterait un vrai backend capable de faire des requêtes serveur→serveur vers des flux RSS/API (Légifrance a une API officielle — `piste.gouv.fr` — INRS et Weka n'en ont pas publiquement). Hors de portée de l'architecture actuelle sans backend.

## 2. Inspection / Audit — ✅ Fait

`inspection-audit.html` : trames de contrôle réutilisables (checklists par catégorie de site), inspections réalisées avec réponse Conforme/Non conforme/NA par point de contrôle, statut global calculé. Chaque point "Non conforme" génère automatiquement une action dans `vigie_hse_actions` (id stable `pa-insp-<inspectionId>-<pointId>`, origine `"Inspection"`) — voir §3 ci-dessous, `plan-actions.html` agrège désormais DUERP + Inspection. CRUD rh/admin, lecture scopée manager, lecture libre ag, audit loggé.

## 3. Plan d'Actions (hub transverse) — ✅ Fait, extension DUERP + Inspection

`plan-actions.html` agrège maintenant deux sources : les évaluations DUERP Élevé/Critique (`origine:"DUERP"`) et les non-conformités d'Inspection/Audit (`origine:"Inspection"`, badge orange distinct), en plus des actions manuelles (`origine:"Manuel"`). Le pattern id stable + champ `origine` extensible (annoncé dans une version précédente de ce document) a fonctionné comme prévu — **prochaine source candidate : RSST**, si on souhaite que les observations non traitées y génèrent aussi une action.

## 4. Gestion des produits chimiques — ✅ Fait

`produits-chimiques.html` : inventaire par service (`vigie_hse_produits_chimiques`), 9 pictogrammes CLP en taxonomie multi-sélection, suivi de date de mise à jour FDS (seuil illustratif : >3 ans), lien explicite avec le risque DUERP "Produits chimiques" mentionné dans l'intro de page. Pas de vrai stockage de fichier FDS (limite localStorage assumée, lien texte/URL en attendant) — cette limite reste valable si le module évolue.

## 5. Pénibilité & fiches individuelles — ❌ Non démarré

**Note d'origine :** "Pénibilité et fiches individuelles :" *(vide, à préciser)*

**Objectif probable :** suivi de l'exposition des agents aux facteurs de pénibilité réglementaires (port de charges, postures pénibles, vibrations, températures extrêmes, bruit, agents chimiques, travail de nuit, travail en équipes successives alternantes, travail répétitif, activités en milieu hyperbare) et génération de fiches individuelles d'exposition par agent.

**Annotation pour reprise :**
- Lien naturel avec `sante-visites.html` (déjà un roster d'agents dérivé du Registre AT/MP) — envisager de partager le même roster de base plutôt que d'en re-dériver un troisième.
- Sujet réglementairement sensible (Compte professionnel de prévention / C2P) — bien vérifier avec l'utilisateur le niveau de fidélité réglementaire attendu avant de coder une logique de seuils d'exposition, qui est précise et évolue par décret.

**Réponse du préventeur (Q5, Cahier du préventeur, 2026-09-16) :** niveau retenu = **avec calcul des seuils** (pas un simple déclaratif). Facteurs et seuils exacts : *« voir réglementation en vigueur, conforme au texte »* — à vérifier précisément au moment de construire ce module (les seuils C2P évoluent par décret, ne pas les figer aujourd'hui). Voir `QUESTIONS-METIER-EN-ATTENTE.md` Q5 pour le détail.

## 6. Formation / Habilitation — ✅ Fait

`formation-habilitation.html` : CACES, habilitation électrique, SST, AIPR, permis PL, travail en hauteur — durées de validité standards par type, roster dérivé du Registre AT/MP (même technique que Santé & Visites), statut À jour/À renouveler/Expirée calculé. **Remarque toujours valable pour un futur module Pénibilité** : envisager un roster d'agents partagé plutôt qu'une troisième dérivation indépendante du Registre AT/MP — il y en a maintenant deux (Santé & Visites, Formation/Habilitation) construites indépendamment l'une de l'autre.

## 7. Santé au travail — planning des visites médicales — 🔶 Base posée, extension prévue

**Note d'origine :** "Santé au travail, Gestion des visites médicales : gestion de planning, rdv, convocation,"

**Ce qui existe (V0.1.1.2) :** `sante-visites.html` — suit le type de visite, la date de dernière visite, la périodicité, calcule l'échéance et le statut (À jour/À programmer/En retard). Roster de départ dérivé (illustratif) du Registre AT/MP. **Depuis le 2026-09-16 (réponse Q4 du préventeur)** : la périodicité est automatiquement resserrée quand l'agent détient une habilitation dont la durée de validité (`formation-habilitation.html`) est plus stricte que la périodicité saisie — badge « Renforcée » dans le tableau, colonnes dédiées à l'export.

**Ce qui manque pour correspondre à la note d'origine :**
- **Gestion de planning/agenda** : pas de vue calendrier, pas de créneaux.
- **Prise de rendez-vous** : pas de notion de RDV planifié à une date/heure précise avec un médecin/infirmier du travail nommé.
- **Convocation** : pas de génération de courrier/email de convocation à envoyer à l'agent (nécessiterait soit une génération de PDF côté client, soit un vrai backend d'envoi d'email — hors de portée de l'architecture actuelle sans un service d'envoi externe).

**Annotation pour reprise :** ne pas reconstruire `sante-visites.html`, l'étendre avec un nouveau modèle `vigie_hse_rdv_medicaux` (ou un champ enrichi sur les fiches existantes) : `{id, visiteId (lien vers la fiche santé), dateHeure, lieu, medecin, statutConvocation ("À convoquer"|"Convoqué"|"Confirmé"|"Réalisé"|"Annulé")}`. La génération de convocation pourrait dans un premier temps être un simple texte pré-rempli à copier/coller (imprimable ou copiable dans un email), en attendant un vrai système d'envoi.

**Précisions apportées (retour alpha, 2026-09-12) :**
- **Indicateurs visuels par habilitation** : icônes d'avertissement dédiées selon le type d'habilitation de l'agent (ex. prise électrique pour l'habilitation électrique, engin pour CACES/conduite) — à afficher sur la fiche santé de l'agent. Suppose de lire les habilitations de l'agent depuis `formation-habilitation.html` — encore un point de couplage entre les deux modules, à traiter avec la factorisation du roster déjà notée en fin de document.
- **Ajustement automatique de la périodicité de visite selon les habilitations renseignées** (ex. une habilitation à risque particulier peut légalement imposer une surveillance médicale renforcée, donc une périodicité plus courte) — logique métier nouvelle à spécifier précisément avec l'utilisateur avant de coder (quelles habilitations déclenchent quelle périodicité).
- **Vue agenda intégrée, format calendrier type Outlook** pour planifier les RDV médicaux — confirme et précise le point déjà noté ci-dessus ("pas de vue calendrier, pas de créneaux").
- **Génération automatique de convocations** à partir de **modèles prédéfinis et modifiables** (pas seulement un texte pré-rempli à copier/coller comme envisagé initialement) — la personnalisation des modèles elle-même devra être gérée quelque part, probablement `administration.html`.

## 8. Gestion documentaire — ❌ Non démarré

**Note d'origine :** "Gestion documentaire : référentiel de documents officiels, dans tous les domaines concernés."

**Vision élargie (retour utilisateur, 2026-09-12) : pas seulement un registre de documents officiels, un vrai "wiki++" du métier HSE.** Au-delà de stocker des documents (DUERP imprimable, registre RSST imprimable, procédures HSE, notes de service, arrêtés, consignes de sécurité par site...), l'objectif est un système de connaissance consultable et cherchable — retrouver n'importe quelle information utile à la profession — pensé pour **accompagner les agents au quotidien**, pas seulement archiver des fichiers pour un administratif. Change la nature du module : moins "registre de métadonnées passif", plus "base de connaissance active" (recherche, navigation par thème, articles rédigés/structurés en plus des documents déposés).

**Annotation pour reprise :**
- **Limite structurelle importante à anticiper** : sans backend, ce projet ne peut pas stocker de vrais fichiers de façon fiable/partagée (le `localStorage` est limité en taille — généralement 5-10 Mo par origine — et n'est pas partagé entre utilisateurs). Cette limite touche le stockage de fichiers déposés, mais **pas** le contenu de type wiki (articles texte structurés), qui reste réalisable dans l'architecture actuelle comme les autres référentiels (`vigie_hse_referentials`, Flash Info).
- Deux volets à distinguer, avec des contraintes différentes :
  1. **Contenu wiki (articles, fiches pratiques, FAQ)** : réalisable dès maintenant, CRUD par l'admin (comme Flash Info/Veille réglementaire), recherche texte côté client, catégorisation par thème/module. Pas de dépendance au backend.
  2. **Dépôt de vrais fichiers (documents officiels, PDF...)** : registre de **métadonnées** (nom, catégorie, version, date, lien externe) sans stockage du fichier lui-même en V1, ou attendre le vrai backend (§14 de `ETAT-DU-PROJET.md`) pour un stockage natif.
- Recoupe directement le module 1 (Veille réglementaire, déjà un embryon de contenu éditorial structuré) et le jalon J1 (accompagnement certification) qui aura besoin d'un endroit où loger politique HSE, procédures, comptes-rendus — à concevoir ensemble plutôt que comme des silos séparés.
- Discuter avec l'utilisateur avant de démarrer : périmètre exact du wiki (arborescence par thème ? moteur de recherche plein texte ? contributions multi-rôles ou admin seul ?), et si le dépôt de fichiers (volet 2) est repoussé au backend ou traité en V1 avec la limite de métadonnées.

**Contenu à prévoir pour le wiki++ (demandé le 2026-09-12), non cadré en détail — pistes pour discussion ultérieure :**
- **Fiches de sécurité.** À ne pas confondre avec le suivi des FDS produits déjà présent dans `produits-chimiques.html` (métadonnée "dernière mise à jour" par produit, pas le contenu de la fiche elle-même) — l'idée ici est plus large : des fiches de sécurité/consignes par poste, tâche ou équipement (ce que l'agent doit savoir/faire avant d'intervenir), qui pourraient elles-mêmes vivre comme articles du wiki++ et être liées aux FDS produits existantes plutôt que dupliquées.
- **Familles de risque.** La taxonomie `RISK_TAXONOMY_DEFAULT` (`administration.html`, définitions courtes par famille : RPS, Travail isolé, Amiante, Coactivité, etc. — voir jalon J1 ci-dessus) n'est aujourd'hui qu'un référentiel de catégorisation pour noter le DUERP, pas un contenu consultable en soi. L'idée : que chaque famille de risque devienne un vrai article du wiki++ (ce que c'est, comment le reconnaître, mesures de prévention type, cadre réglementaire) plutôt qu'une simple étiquette de menu déroulant.
- **Comment amener ce type d'information à l'agent, pas seulement l'archiver.** Le point le plus important et le moins tranché : à quoi bon un wiki riche si personne ne va le consulter ? Piste à creuser plus tard plutôt qu'assumée maintenant : des liens contextuels *depuis* les endroits où l'information sert déjà (le risque sélectionné dans une évaluation DUERP renvoie vers l'article de la famille de risque correspondante ; un produit chimique renvoie vers sa FDS et vers une éventuelle fiche de sécurité liée ; un module de suivi peut pointer vers l'article pertinent) plutôt qu'un wiki isolé accessible uniquement par sa propre entrée de menu. Recoupe aussi le futur module 12 (Accueil au poste) comme moment naturel de mise en avant de ces fiches à un nouvel agent.

## 9. Indicateurs & reporting KPI — ✅ Fait, extension livrée (2026-09-14)

**Ce qui existe (`reporting.html`) :** indicateurs et tendance AT/MP sur une période, export Excel (SheetJS).

**Extension demandée (retour alpha 2026-09-12), livrée le 2026-09-14 :**
- **Sélecteur calendaire (dates de début/fin libres)** — fait. Le menu déroulant 6/12 mois "Depuis le début" reste comme raccourci rapide (il pré-remplit les deux champs), mais les deux dates `fDateDebut`/`fDateFin` sont directement éditables.
- **Tous les graphiques et valeurs réagissent maintenant à la période sélectionnée**, pas seulement le bloc AT/MP — fait, via une fonction `inPeriod(dateStr, dDebut, dFin)` unique appliquée à chaque module avant calcul des statistiques. Champ de date utilisé par module : AT/MP → `dateAT`, DUERP → `dateEvaluation` (nouveau champ, voir ci-dessous), Plan d'Actions → `dateCreation`, Santé & Visites → `dateDerniere`, RSST → `date`, Vérifications → `dateDerniere`, Inspection/Audit → `dateInspection`, Produits Chimiques → `dateMajFDS` (date de mise à jour FDS, pas une date de création — seule date disponible sur ce module), Formation/Habilitation → `dateObtention`, EPI & Dotation → `dateRemise`. Un enregistrement sans date connue reste toujours compté (`inPeriod` renvoie `true` si la date est absente) — pas de régression pour les données existantes.
- **Nouveau champ `dateEvaluation` sur les évaluations DUERP** (`vigie_hse_duerp_dataset`) — nécessaire pour ce module, qui n'avait jusqu'ici aucune date. Fixée automatiquement à la date de création (préservée sur modification, jamais réécrite), sur le même principe que `dateCreation` du Plan d'Actions — pas un champ de formulaire visible. **Limite assumée :** seules les évaluations saisies manuellement via `saisie-duerp.html` depuis le 2026-09-14 portent cette date ; les évaluations importées par Excel (`document-unique.html`) ou chargées depuis `DATATEST/` n'en ont pas (le fichier `2-document-unique.xlsx` n'a pas de colonne date, voir `PROMPT-GENERATION-DONNEES-TEST.md`) et restent donc toujours comptabilisées quelle que soit la période — plutôt que de leur fabriquer une fausse date d'import.
  - Nouveaux graphiques : **Nombre d'accidents par type de risque** et **Nombre de jours d'arrêt par type de risque** — fait, deux nouveaux panneaux à barres horizontales sous la tendance AT/MP, regroupés sur le champ `risque` déjà présent sur chaque événement AT/MP, recalculés sur la période sélectionnée. Ajoutés aussi à l'export Excel (nouvel onglet "AT-MP par risque").
- **Non fait (reporté, pas demandé comme prioritaire) :** courbe dédiée "Évolution du nombre de jours d'arrêt dans le temps" — le total de jours d'arrêt sur la période est déjà visible (KPI module AT/MP), mais pas encore une vraie courbe mois par mois comme la tendance en nombre d'événements. Candidat naturel pour une prochaine itération si le besoin est confirmé.

## 10. EPI, dotation & entretien — ✅ Fait

**Note d'origine (demande directe de l'utilisateur) :** un module couvrant tout ce qui concerne l'équipement personnel — EPI (Équipements de Protection Individuelle), vêtements de travail, gestion des stocks, entretien et lavage (avec gestion des cycles de lavage), centralisation des fiches techniques, gestion de la dotation (ce qui a été remis à quel agent).

**Ce qui existe (`epi-dotation.html`) :** un registre à quatre volets, implémenté selon le modèle pressenti initialement :
1. **Catalogue** (`vigie_hse_epi_catalogue`) : les articles disponibles (EPI + vêtements), avec fiche technique (norme EN, taille, durée de vie recommandée).
2. **Stock** (`vigie_hse_epi_stock`) : quantités en magasin par article/taille, seuil de réapprovisionnement.
3. **Dotation** (`vigie_hse_epi_dotations`) : ce qui a été remis à quel agent, quand, et l'échéance de renouvellement, avec statut calculé (même pattern périodicité/échéance/statut que `verifications-periodiques.html`/`formation-habilitation.html`).
4. **Entretien/lavage** (`vigie_hse_epi_lavages`) : cycles de lavage suivis par article, statut "OK"/"À réformer" au-delà du nombre de lavages maximal.

**Dette technique :** ce module a été le 3ᵉ à dériver indépendamment un roster d'agents (après Santé & Visites et Formation/Habilitation) — la brique commune (hash + dédoublonnage) est factorisée dans `assets/roster.js` depuis le 2026-09-16, voir la note générale en fin de document.

## 11. Dashboard mobile simplifié — ✅ Fait

**Décision (utilisateur, confirmée) :** l'usage principal reste desktop (RH/HSE au bureau, saisie de données denses). Une vraie application native (React Native/Flutter, nouvelle stack séparée) n'a **pas** été retenue — jugée disproportionnée par rapport au besoin réel. La direction retenue : un **dashboard mobile simplifié**, dans la même stack HTML/CSS/JS que le reste du site, pas une appli à part.

**Ce qui existe :** sur petit écran (<640px), `dashboard.html` affiche l'essentiel (accueil, sélecteur de zone, KPI) puis deux boutons pleine largeur "Déclarer un AT/MP" et "Signaler une observation" ; les panneaux denses (actualités, tendances, tableau des dernières déclarations) restent masqués sur mobile uniquement, avec une note explicite — le rendu desktop est strictement inchangé. Les formulaires de création les plus utilisés sur le terrain (`saisie-rh.html`, `saisie-duerp.html`, création dans `registre-sst.html`) ont aussi reçu des ajustements tactiles : police 16px sur les champs (évite le zoom automatique iOS), contrôles segmentés qui passent à la ligne plutôt que de s'écraser, boutons pleine largeur et tactiles (48px).

**Ce qui reste hors scope, assumé :** Administration, Indicateurs & Reporting et les tableaux denses restent explicitement desktop-only sur mobile — pas un chantier resté à faire, un choix de portée pour ce module.

## 12. Accueil au poste — ❌ Non démarré

**Note d'origine (retour alpha, 2026-09-12) :** nouveau module demandé, pas encore détaillé par l'utilisateur.

**Annotation pour reprise :** objectif probable — un parcours d'intégration/accueil sécurité pour un nouvel agent prenant son poste (livret d'accueil, points de vigilance du poste, consignes de sécurité spécifiques, émargement de prise de connaissance). À préciser avec l'utilisateur avant de coder quoi que ce soit : périmètre exact, qui déclenche le parcours (RH à l'embauche ? manager à l'affectation ?), et si un suivi de complétion est attendu (comme pour Formation/Habilitation).

## 13. Dialogue social — ❌ Non démarré

**Note d'origine (retour alpha, 2026-09-12) :** nouveau module demandé, réservé aux représentants du personnel — implique la création d'un nouveau compte/rôle **"Représentant du personnel"**.

**Annotation pour reprise :**
- Objectif probable : donner aux représentants du personnel (élus CST/F3SCT actuellement, CSE/CSSCT dans la version généralisée — voir tableau de correspondance dans la section J0 ci-dessus) un accès dédié à des informations HSE/RH sans leur donner les droits RH/admin complets — un cas d'usage concret de permissions à grain fin, à construire main dans la main avec la réflexion sur la refonte des rôles (voir section J0 ci-dessus, "Réflexion actée — refonte complète du système de comptes/rôles/permissions").
- À préciser avec l'utilisateur avant de coder : quel contenu concret ce module doit exposer (ordre du jour/comptes-rendus de F3SCT ? accès en lecture à des indicateurs agrégés et anonymisés du Registre AT/MP et du RSST ? un espace de questions/réponses avec la direction ?).
- Ne pas construire ce module avant d'avoir au moins esquissé le modèle de permissions générique (section J0) — sinon "Représentant du personnel" devient un 5ᵉ rôle codé en dur de plus, exactement le problème que la réflexion sur les permissions cherche à éviter.

## 14. Gestion administrative RH — ✅ Fait (2026-09-19)

**Note d'origine (retour alpha, 2026-09-12) :** nouveau module, deux volets.

**Décidé avec l'utilisateur le 2026-09-19 : les deux volets en V1**, avec le roster comme source canonique (remplace les dérivations indépendantes de `sante-visites.html`/`formation-habilitation.html`/`epi-dotation.html`) et le TF/TG "réel" en **coexistence** avec l'estimé existant (ne le remplace pas — conforme à la réponse du préventeur "estimé ET réel" ci-dessous).

**Livré — `gestion-rh.html` :**
- **Volet 1 (données RH)** : roster canonique (`vigie_hse_agents` — nom, prénom, service, collectivité, actif), saisie d'heures travaillées agrégées par service/mois (`vigie_hse_heures_travaillees`, pas un pointage individuel — le préventeur demande un TF par service/direction, pas par agent), TF/TG "réel" calculé dessus via `VigieFormules.tauxFrequenceReel`/`tauxGraviteReel` (`assets/hse-formulas.js`), affiché en coexistence avec le TF/TG estimé dans `registre-at-mp.html` et `reporting.html` ("—" si aucune heure saisie, jamais un faux 0).
- **Volet 2 (organigramme)** : rattachement `managerId` entre agents (pas une nouvelle notion d'"unité organisationnelle" — délibérément pour ne pas anticiper le chantier de généralisation J0, non cadré), vue arborescente, réaffectation avec garde-fou anti-cycle appliqué **au niveau du sélecteur lui-même** (les options qui créeraient une boucle ne sont pas proposées, pas seulement rejetées après coup).
- **Roster canonique** : un sélecteur "Choisir un agent" (additif, saisie libre toujours possible) a été ajouté aux formulaires de `saisie-rh.html`, `sante-visites.html`, `formation-habilitation.html`, `epi-dotation.html` — pré-remplit nom/prénom/service/collectivité. La forme des enregistrements existants de ces 3 derniers modules n'a pas changé (toujours `nom`/`prenom`/`service` inline, pas de FK) pour éviter une réécriture risquée de gros fichiers déjà en production ; le mécanisme `SEED_ATMP`/`VigieRoster.dedupeByAgent` qu'ils contenaient s'est avéré être du code mort depuis l'anonymisation du 2026-09-12 (seed vide) et n'a pas été réactivé.
- **Confirmé par le préventeur (2026-09-15, réponse à la question 2 du reporting) :** « l'effectif des agents doit être saisi dans un tableau pour les RH (ou importé), pour avoir l'effectif réel par collectivité ; pour le taux de fréquence, on pourrait avoir celui estimé **et** le réel en saisissant le nombre d'heures, ce qui permettrait aussi d'avoir un TF par service ou direction. »
- Permission granulaire `gestion-rh` (read/write), même mécanisme que les modules 15/16/18.

## 15. Analyse d'accident (arbre des causes) — ✅ Fait (2026-09-14)

**Demandé le 2026-09-12**, en lien direct avec le jalon **J2** (culture sécurité et remontée d'information — voir section dédiée plus haut) : aujourd'hui le Registre AT/MP enregistre le *fait* (qui, quand, où, quelles conséquences) mais pas l'*analyse* de pourquoi c'est arrivé ni de ce qui a été fait pour que ça ne se reproduise pas — deux choses distinctes.

**Arbitrages tranchés par l'utilisateur (session dédiée du 2026-09-14) :**
- **Méthode** : les 3 méthodes disponibles au choix par analyse — Arbre des causes (INRS), 5 Pourquoi, Ishikawa — pas une seule imposée. Le préventeur choisit celle adaptée à l'événement au moment de créer l'analyse.
- **Accès** : étendu via le modèle de permissions granulaires (`session.modulePermissions["accident-analyse"]`, read/write), même mécanisme que le module 18 — pas RH/admin seuls, pas un rôle "Préventeur" codé en dur.
- **Profondeur V1** : liste structurée simple (faits datés/typés pour l'arbre des causes, chaîne question/réponse pour les 5 Pourquoi, causes par famille en texte libre pour Ishikawa) — **pas d'éditeur graphique interactif**. Note conservée pour une itération future : un vrai schéma visuel (nœuds/liens glisser-déposer) reste envisageable si le besoin est confirmé, mais n'était pas la priorité de cette V1.
- **Plan d'Actions** : les actions correctives d'une analyse remontent au Plan d'Actions existant (`origine: "Analyse"`), même pattern que `"DUERP"` et `"Inspection"`.

**Ce qui a été livré :**
- `accident-analyse.html` : liste des événements AT/MP (lecture seule, source = Registre AT/MP), statut d'analyse "Faite"/"En attente" par ligne, panneau détail avec sélection de méthode + formulaire dédié à la méthode choisie, conclusion, liste d'actions correctives. Accès direct depuis `registre-at-mp.html` via un lien "Analyser" par ligne (`?atmpId=...`, ouverture automatique du panneau). Export `.xlsx` (feuilles Analyses + Actions).
- **Permission `atmp-declare`** ajoutée dans la même session (répond au point alpha "rendre paramétrable qui a le droit de déclarer un accident" — voir plus bas) : même mécanisme `modulePermissions`, booléen plutôt que read/write puisque déclarer n'a pas de sens en lecture seule.
- Sidebar à deux niveaux : les sections partagées entre plusieurs permissions (ex. "Espace RH") toggle maintenant chaque lien individuellement plutôt que la section entière, pour ne jamais afficher un lien qu'un utilisateur ne pourrait pas utiliser — voir `ETAT-DU-PROJET.md` §7.
- Compte de test `PREV1` étendu avec les 3 permissions (`atmp-admin`, `atmp-declare`, `accident-analyse`) plutôt qu'un 4ᵉ compte dédié.

## 16. Situations d'urgence & exercices d'évacuation — ✅ Fait (volet "exercices réalisés")

**Demandé le 2026-09-12.** Recoupe un écart déjà repéré lors de l'étude du jalon **J1** (clause **8.2 — Préparation et réponse aux situations d'urgence** d'ISO 45001, listée comme candidat n°2 dans la confrontation clause par clause ci-dessus) : aujourd'hui rien dans VIGIE HSE ne trace la préparation aux situations d'urgence ni la tenue effective des exercices — un manque quasi systématiquement relevé en audit sécurité, et une brique de prévention à part entière indépendamment de toute certification.

**Objectif probable** (à confirmer avec l'utilisateur avant de coder) : deux volets distincts à ne pas mélanger dans un même écran —
- **Plans d'urgence par site** : consignes de sécurité, points de rassemblement, contacts d'urgence, moyens de secours disponibles (extincteurs, défibrillateur...) — plutôt de la donnée de référence par site que de l'instance répétée (voir le futur module Gestion documentaire, module 8, pour l'hébergement du document lui-même).
- **Exercices réalisés** : un registre chronologique par site (date, type — évacuation incendie, confinement, autre —, durée, participants ou taux de participation, anomalies constatées, actions correctives). C'est ce second volet qui a le plus de valeur immédiate : une preuve datée que les exercices ont bien lieu, pas seulement qu'un plan existe sur le papier.

**Pistes fonctionnelles à évaluer, sans engagement de conception :**
- Rattacher au même modèle site que celui déjà utilisé par `verifications-periodiques.html` (`SITES`, `service`, `collectivite`) plutôt que réinventer une notion de site propre à ce module.
- Les anomalies/non-conformités constatées lors d'un exercice devraient alimenter le Plan d'Actions existant, sur le même principe que `"DUERP"`, `"Inspection"` et le futur `"Analyse"` (module 15) — pas un circuit de suivi séparé de plus.
- Un rappel/échéance de "prochain exercice dû" par site, dans l'esprit de ce qui existe déjà pour les échéances de Vérifications Périodiques et de Formation/Habilitation.
- Vérifier avant de construire si une périodicité réglementaire minimale s'applique (type d'établissement recevant du public, code du travail) — à documenter plutôt qu'à deviner.

**Réponse du préventeur (Q6, Cahier du préventeur, 2026-09-16) :** la périodicité varie selon le type d'établissement — **pas de valeur figée dans le code**, une périodicité **saisie manuellement à chaque exercice enregistré**. Types d'exercices à tracer : évacuation incendie, intrusion, risque environnemental (inondation, accident chimique…). Voir `QUESTIONS-METIER-EN-ATTENTE.md` Q6 pour le détail.

**Livré le 2026-09-18 — `urgences-exercices.html`.** Périmètre décidé avec l'utilisateur : **volet "exercices réalisés" seul** — les plans d'urgence par site (consignes, contacts, moyens de secours) restent une itération future, éventuellement avec le futur module Gestion documentaire (module 8).
- Registre chronologique **append-only** (un exercice = une nouvelle entrée, jamais réécrite en place) — c'est la preuve datée que la roadmap identifiait comme la vraie valeur du module.
- Périodicité saisie librement à chaque exercice (aucun défaut suggéré, conformément à la réponse Q6) ; échéance "prochain exercice dû" calculée à l'affichage par groupe site+type, sur le dernier exercice du groupe seulement (un exercice ancien déjà remplacé par un plus récent n'est plus compté "en retard" pour son propre compte).
- Anomalies avec action corrective → Plan d'Actions (`origine:"Urgence"`), même mécanisme que DUERP/Inspection/Analyse.
- Accès par permission granulaire `urgences` (même modèle que `accident-analyse`), compte `PREV1` étendu.
- Import/export `.xlsx` dès la V1 (2 feuilles, avec colonne "ID Exercice" dans la feuille Actions pour un ré-import fidèle).

**Cadrage :** le volet "plans d'urgence par site" reste posé pour une itération future — pas de conception engagée dessus.

## 17. Entreprises extérieures & Plan de Prévention — ✅ Fait (2026-09-19)

**Livré — `entreprises-exterieures.html`** (décisions prises avec l'utilisateur le 2026-09-19) :
- Registre CRUD des interventions (`vigie_hse_interventions_ee`), entreprise en **texte libre** (pas de second CRUD « entreprise »), `site` en texte libre, `service`/`collectivité` sur les référentiels partagés.
- **Inspection commune préalable : champs intégrés simples** (réalisée, date, participants, risques identifiés) plutôt que réutilisation d'une trame d'Inspection/Audit — cette dernière n'expose aucune API (tout lecteur externe devrait parser `vigie_hse_inspections` et deviner un `trameId`), et le préventeur n'a pas précisé de quelle « trame » il parle.
- **Plan de prévention : texte libre** (mesures, consignes, répartition des responsabilités), pas d'éditeur de document structuré en V1.
- **Verdict « plan obligatoire » par intervention** (réponse Q7 : « par intervention / opération ») : heures estimées > 400, ou case « Travaux dangereux » cochée à la main — **la liste réglementaire des travaux dangereux n'est jamais devinée**. Le cumul par entreprise/année est affiché à titre indicatif seulement. *(Le plan initial cumulait par entreprise/année ; corrigé en cours de route pour respecter la réponse du préventeur.)*
- Habilitations des intervenants extérieurs : **non tracées** (hors périmètre, réponse Q7).
- Actions correctives → Plan d'Actions (`origine:"Prévention EE"`). Export `.xlsx` (feuilles Interventions + Actions, colonne « ID Intervention »). Pas d'import ni de DATATEST en V1.
- Permission granulaire `entreprises-ext` (read/write).
- **Question ouverte (Q8, `QUESTIONS-METIER-EN-ATTENTE.md`)** : le seuil est appliqué « strictement > 400 h » ; à confirmer avec le préventeur (« plus de » ou « au moins » 400 h, et fenêtre de temps éventuelle).

*Texte d'origine de la demande, conservé ci-dessous :*

**Demandé le 2026-09-12.** Recoupe directement le risque **"Coactivité"** déjà présent dans `RISK_TAXONOMY_DEFAULT` (`administration.html` : "Interférence entre activités, équipements et personnel de la structure et d'entreprises extérieures intervenant simultanément. Absence d'inspection commune et de plan de prévention partagé.") — aujourd'hui identifié comme famille de risque mais sans aucun module pour outiller la prévention correspondante. Le Plan de Prévention est une obligation réglementaire précise (Code du travail, art. R4511-1 et suivants) dès qu'une entreprise extérieure intervient dans les locaux d'une entreprise utilisatrice, avec inspection commune préalable obligatoire, et plan de prévention écrit obligatoire au-delà de 400h/an cumulées ou pour une liste de travaux dangereux définie par arrêté — à vérifier/documenter précisément avant de coder plutôt que d'approximer.

**Objectif probable** (à confirmer avec l'utilisateur avant de coder) : un registre des entreprises extérieures intervenant sur les sites de la collectivité, avec pour chaque intervention —
- Identité de l'entreprise extérieure, nature de la prestation, service/site concerné, période d'intervention (ponctuelle ou récurrente).
- Trace de l'inspection commune préalable (date, participants des deux parties, risques identifiés).
- Le plan de prévention lui-même (mesures de prévention retenues, consignes transmises, répartition des responsabilités) — probablement un document (voir futur module 8, Gestion documentaire) plutôt qu'un formulaire entièrement structuré dès la V1.
- Suivi de la durée cumulée d'intervention par entreprise/année, pour savoir si le seuil des 400h est atteint.

**Pistes fonctionnelles à évaluer, sans engagement de conception :**
- Réutiliser le modèle service/site déjà en place (`verifications-periodiques.html`) plutôt qu'une notion de site propre à ce module.
- L'inspection commune préalable ressemble fonctionnellement à une inspection du module Inspection/Audit (module 2) — évaluer si une trame dédiée dans ce module existant suffit plutôt que de dupliquer la mécanique de trames/inspections.
- Les mesures de prévention non tenues ou incidents en cours d'intervention devraient remonter au Plan d'Actions (`origine: "Prévention EE"`), même logique que DUERP/Inspection/Analyse (module 15).

**Réponse du préventeur (Q7, Cahier du préventeur, 2026-09-16) :**
- Seuil/comptage des heures : par intervention/opération, comme le prévoit la réglementation.
- Habilitations des intervenants extérieurs : **hors périmètre** — sous la responsabilité contractuelle de l'entreprise extérieure, pas à tracer dans VIGIE HSE.
- Inspection commune préalable : *« il existe une trame »* — reste à clarifier au moment de construire ce module s'il parle de réutiliser la trame du module Inspection/Audit existant (piste déjà évoquée ci-dessus) ou d'une trame externe à reproduire. Voir `QUESTIONS-METIER-EN-ATTENTE.md` Q7 pour le détail.
- Lien naturel avec la Formation/Habilitation existante côté agents internes — question ouverte : faut-il tracer aussi les habilitations/qualifications exigées côté entreprise extérieure (ex. habilitation électrique d'un sous-traitant), ou est-ce hors périmètre de VIGIE HSE (responsabilité contractuelle de l'entreprise extérieure elle-même) ?

**Cadrage :** comme pour les autres pistes ajoutées cette semaine, une piste posée pour discussion ultérieure, pas un chantier à démarrer immédiatement.

## 18. Gestion administrative des dossiers AT/MP & CITIS — ✅ Fait (2026-09-13)

**Retour utilisateur reçu le 2026-09-13, retranscrit intégralement :**

> Intègre le module "Gestion Administrative des Dossiers AT / MP & CITIS" en y appliquant un filtrage de sécurité strict par profil (RBAC). Utilise un design "Dark Mode" (Tailwind CSS) soigné.
> 1. Restriction d'Accès (Sécurité & Confidentialité) : Ce module ne doit être visible et accessible dans la barre latérale (Sidebar) que pour les utilisateurs connectés avec le profil Administrateur Préventeur ou Profil RH. Si un utilisateur "Manager" ou simple agent se connecte, ce module doit être totalement masqué ou verrouillé.
> 2. Tableau de Suivi Documentaire (Checklist RH) : Pour chaque dossier d'AT ou de Maladie Professionnelle, une vue détaillée permet de suivre l'exhaustivité des pièces : Certificat médical initial (CMI) / Constatation. Certificats de prolongation multiple. Certificat final, de guérison ou de consolidation. Notification du taux d'IPP éventuel. Enquête administrative et suivi des coûts.
> 3. Gestion des Arrêtés (Imputabilité & CITIS) & Workflow de Signature : Suivi des arrêtés juridiques (Imputabilité, placement/maintien en CITIS, fin de CITIS). Traçabilité des signatures : Statuts de validation (Brouillon, Transmis à l'autorité, Signé & Notifié). Alertes visuelles pour les arrêtés en attente de signature ou les pièces manquantes.

**Ce que c'est, en une phrase :** un dossier administratif détaillé qui se greffe sur chaque événement déjà enregistré dans le Registre AT/MP — aujourd'hui `registre-at-mp.html` capture le *fait* (qui, quand, quelles circonstances), ce module ajoute le *suivi administratif et juridique* qui accompagne légalement un accident du travail ou une maladie professionnelle dans la fonction publique territoriale (pièces médicales, arrêtés d'imputabilité, CITIS). C'est un complément direct au module 15 (Analyse d'accident) : 15 répond à "pourquoi c'est arrivé", ce module répond à "où en est le dossier administratif".

**CITIS, pour contexte :** le Congé pour Invalidité Temporaire Imputable au Service a remplacé l'ancien régime du "congé pour accident de service"/maladie professionnelle des fonctionnaires territoriaux (ordonnance n° 2017-53 du 19 janvier 2017, décret n° 2019-122 du 21 février 2019) — procédure spécifique à la fonction publique (reconnaissance de l'imputabilité au service, placement en CITIS, suivi des prolongations, sortie de CITIS). **Point de vigilance direct pour le jalon J0** (généralisation collectivité/privé, voir plus haut) : CITIS n'existe pas dans le privé, où l'équivalent est la procédure accident du travail/maladie professionnelle gérée par la Sécurité sociale (déclaration, indemnités journalières, rente). Ce module est donc, par nature, **encore plus spécifique "collectivité territoriale"** que le reste de l'app — à garder en tête si/quand le vocabulaire est généralisé (section J0) : il faudra soit une variante "privé" de ce module (workflow IJ/Sécu au lieu d'arrêtés CITIS), soit le documenter explicitement comme un module optionnel activable seulement pour les clients collectivité.

### 1. Restriction d'accès (RBAC)

**Rejoint directement la réflexion déjà actée en section J0** ("Réflexion actée — refonte complète du système de comptes/rôles/permissions", 2026-09-12) : ce retour utilise justement le rôle **"Administrateur Préventeur"** dont l'absence avait été identifiée comme le déclencheur de cette réflexion. Deux options, à trancher avant de coder :
1. **Solution rapide (dette assumée) :** mapper "Administrateur Préventeur" sur le rôle `admin` existant et "Profil RH" sur `rh` — reproduit le problème que la réflexion J0 cherche justement à éviter (un rôle nommé de plus, codé en dur), mais débloque ce module immédiatement.
2. **Solution alignée avec J0 :** ce module est un bon premier cas d'usage concret pour prototyper le modèle de permissions générique évoqué en J0 (triplet service × module × lecture/écriture) — "Préventeur" y serait un profil préréglé avec accès complet à ce module précis, RH pareil, Manager/Agent sans aucun accès. Recommandation : ne pas construire ce module avant d'avoir au moins esquissé ce modèle, sinon on ajoute un rôle en dur de plus au moment même où on avait décidé d'arrêter de le faire (voir aussi le même arbitrage déjà posé pour le module 13, Dialogue social).
- **Masquage vs verrouillage :** le retour dit "totalement masqué **ou** verrouillé" — à trancher avec l'utilisateur. Le pattern déjà en place ailleurs dans l'app est le masquage pur du lien de sidebar selon le rôle (`if (role !== "rh" && role !== "admin"){ $("navRh").style.display = "none"; }`, présent dans chaque fichier) — cohérent à reproduire ici plutôt qu'un état "verrouillé" (lien visible mais inaccessible), qui n'existe nulle part ailleurs dans le code actuel.

### 2. Tableau de suivi documentaire (checklist RH)

Pour chaque dossier, une checklist de complétude des pièces. Modèle de données proposé, rattaché à un événement existant du Registre AT/MP par `atmpId` :
```
{
  id, atmpId,                      // lien vers l'enregistrement AT/MP existant (vigie_hse_dataset)
  pieces: {
    cmiConstatation:  { recu:bool, date, fichierRef },
    prolongations:    [ { recu:bool, date, fichierRef }, ... ],  // multiple, d'où le tableau
    certificatFinal:  { type:"Guerison"|"Consolidation", recu:bool, date, fichierRef },
    notificationIPP:  { applicable:bool, taux, date, fichierRef },
  },
  enquete: { realisee:bool, date, conclusions },
  coûts:   { montantTotal, detail: [ { poste, montant, date }, ... ] },
}
```
- Même limite déjà documentée pour le module 8 (Gestion documentaire) et pour les FDS de `produits-chimiques.html` : pas de vrai stockage de fichier en localStorage — `fichierRef` reste un lien/nom de fichier, pas le binaire lui-même, en attendant un vrai backend.
- Le statut "dossier complet" par ligne du Registre AT/MP est un candidat naturel pour une nouvelle colonne/badge dans `registre-at-mp.html` (visible uniquement pour RH/Préventeur, cohérent avec la restriction RBAC ci-dessus).

### 3. Gestion des arrêtés (imputabilité & CITIS) & workflow de signature

Modèle de données proposé :
```
{
  id, atmpId,
  type: "Imputabilité" | "Placement CITIS" | "Maintien CITIS" | "Fin CITIS",
  statut: "Brouillon" | "Transmis à l'autorité" | "Signé & Notifié",
  dateCreation, dateTransmission, dateSignature,
  autoriteSignataire,
  fichierRef,
}
```
- Workflow à 3 états explicitement demandé — modèle proche de ce qui existe déjà pour le statut RSST (`Nouvelle`/`En cours de traitement`/`Traitée`), même logique de progression linéaire à réutiliser plutôt qu'à réinventer.
- **Alertes visuelles** (arrêtés en attente de signature, pièces manquantes) : rejoint le pattern déjà en place pour les échéances (Vérifications Périodiques, Formation/Habilitation, EPI/Dotation — statut "À jour"/"À renouveler"/"Expiré" calculé) — même logique de badges/couleurs à reproduire ici pour "en attente" vs "en retard".
- Un arrêté en attente/pièce manquante est aussi un candidat naturel pour alimenter le Plan d'Actions existant (`origine: "AT/MP Admin"`), même principe que DUERP/Inspection/Analyse — à confirmer avec l'utilisateur si ce niveau de détail administratif doit vraiment remonter au Plan d'Actions global ou rester cantonné à ce module.

### Design : Dark Mode / Tailwind CSS — point de friction à trancher avant de coder

Le retour demande explicitement du **Tailwind CSS**. **Ça ne correspond pas à l'architecture actuelle du projet**, qui est explicitement "HTML/CSS/JS vanilla, aucun framework, aucune étape de build, aucun bundler" (voir `ETAT-DU-PROJET.md` §3) — chaque page a son propre design system en custom properties CSS, avec un thème clair/sombre **déjà fonctionnel** partout (`@media (prefers-color-scheme: dark)` + attribut `data-theme`, répété par fichier). Trois options, à trancher avec l'utilisateur avant de commencer :
1. **Construire ce module avec le système de thème déjà en place** (custom properties existantes, juste vérifier/renforcer le rendu en mode sombre sur ce module précis) — cohérent avec le reste de l'app, zéro nouvelle dépendance, mais ne répond pas littéralement à "Tailwind CSS".
2. **Introduire Tailwind uniquement sur ce module** (ex. via le CDN `cdn.tailwindcss.com`, sans étape de build) — répond à la demande mais crée une incohérence stylistique avec les 17 autres pages, et un système de design dupliqué (custom properties partout + Tailwind ici) plutôt qu'un seul système partagé.
3. **Migrer progressivement tout le site vers Tailwind**, en commençant par ce module — répond le mieux à l'esprit de la demande, mais change radicalement la portée : ce n'est plus l'ajout d'un module, c'est une refonte du design system entier, à traiter comme un chantier à part (et à décider si elle vaut le coup avant ou après la généralisation commerciale du jalon J0).
**Recommandation par défaut en l'absence de précision : option 1**, la plus cohérente avec zéro régression et l'architecture actuelle — mais à confirmer explicitement avec l'utilisateur avant de coder, vu que la demande nommait Tailwind spécifiquement.

**✅ Construit le 2026-09-13.** Arbitrages tranchés par l'utilisateur : option 2 pour le RBAC (premier cas d'usage réel du modèle de permissions granulaires, pas un rôle codé en dur) et option 1 pour le design (thème clair/sombre existant, pas de Tailwind).

**Ce qui a été livré :**
- `dossiers-atmp-citis.html` : liste des dossiers (une ligne par événement du Registre AT/MP), panneau détail avec checklist documentaire (CMI, prolongations multiples, certificat final guérison/consolidation, notification IPP), enquête administrative + coût total/détail, et gestion des arrêtés (type Imputabilité/Placement CITIS/Maintien CITIS/Fin CITIS, workflow Brouillon → Transmis à l'autorité → Signé & Notifié). Export `.xlsx` (deux feuilles). Pas d'import en V1 (portée maîtrisée).
- **Modèle de permissions granulaires** (nouveau, minimal) : `u.modulePermissions = { "atmp-admin": "read"|"write" }` sur chaque utilisateur (`vigie_hse_users`), copié dans `session.modulePermissions` à la connexion. Géré depuis `administration.html` (formulaire utilisateur). Un `admin`/`rh` a toujours accès ; un `manager`/`ag` seulement si la permission lui est explicitement accordée — exactement le mécanisme "case à cocher par module" envisagé dans la réflexion J0 ci-dessus, mais câblé sur un seul module pour l'instant, pas généralisé (l'UI reste dédiée à ce module précis, pas un tableau générique module × service × niveau — ça reste le chantier complet de J0 si d'autres modules doivent l'adopter).
- Compte de test dédié : `PREV1` / `1234`, rôle de base `ag` (le moins privilégié) + `atmp-admin:write` — démontre que l'accès vient bien de la permission accordée, pas d'un rôle caché.
- Lien de sidebar ajouté sur les 15 pages existantes + la nouvelle page elle-même (16 fichiers), masqué par défaut et révélé par `canAtmpAdmin`, sauf sur les 4 pages déjà restreintes rh/admin (`saisie-rh.html`, `saisie-duerp.html`, `reporting.html`, `administration.html`) où il est affiché sans condition puisque ces pages ne sont de toute façon jamais atteintes par un rôle non qualifié.

**Écart connu, non traité :** le Registre AT/MP n'a pas de type "Maladie professionnelle" distinct dans `typeAtMp` (seulement Accident de travail/de trajet, Incident bénin, Presque accident) — ce module liste donc tous les événements AT/MP sans distinction de type plutôt que de filtrer sur une catégorie MP qui n'existe pas encore dans le modèle de données. À revisiter si la distinction AT/MP devient nécessaire.

**Rappel CITIS/J0 (déjà noté plus haut) :** ce module reste spécifique fonction publique territoriale (CITIS n'existe pas dans le privé) — à traiter explicitement lors de la généralisation commerciale.

---

## Retours de test Alpha (2026-09-12) — points UX/fonctionnels sur les modules déjà construits

Points remontés par un retour de test alpha (résumé d'une discussion avec Gemini), analysés et confrontés au code existant. Contrairement aux sections numérotées ci-dessus, ce ne sont pas de nouveaux modules mais des corrections/ajustements sur des modules déjà en place. Statut de chaque point à date de rédaction :

- **En-tête du tableau de bord (`dashboard.html`) — ✅ Fait (2026-09-14), option « retouche légère » retenue par l'utilisateur.** La phrase d'accueil de 20 mots est supprimée et remplacée par le nom **VIGIE HSE** en surtitre au-dessus du « Bonjour, <utilisateur> ». Le nom de l'application n'était jusqu'ici visible que dans la barre latérale et disparaissait totalement quand celle-ci se repliait. Mise en page inchangée — la refonte complète de cette zone reste possible plus tard si le besoin revient.
- **Tri & filtres dynamiques façon Excel sur toutes les colonnes de tous les tableaux — ✅ Composant fait (2026-09-14), déployé sur le Registre AT/MP.** Construit une seule fois dans **`assets/tri-filtres.js`** (premier fichier JS partagé du projet — voir `ETAT-DU-PROJET.md` §6 bis pour l'API et les 4 lignes d'intégration) plutôt que dupliqué page par page. Tri à 3 états par clic sur l'intitulé, entonnoir par colonne avec valeurs distinctes + comptage + recherche + tout cocher/décocher, filtres cumulés en ET, options d'une colonne calculées sur les lignes filtrées par les autres colonnes. Thème clair/sombre suivi automatiquement (le composant injecte son CSS à partir des variables de la page). **Déploiement terminé le 2026-09-14 : les 10 pages à tableau en sont équipées** — `registre-at-mp.html` (premier cas d'usage), puis `document-unique.html`, `plan-actions.html`, `registre-sst.html`, `verifications-periodiques.html`, `inspection-audit.html`, `produits-chimiques.html`, `formation-habilitation.html`, `sante-visites.html`, et `epi-dotation.html` dont les 4 tableaux ont chacun leur propre jeu de tri/filtres. Les colonnes calculées (score et niveau DUERP, statut d'arrêt, points non conformes, article résolu depuis un identifiant…) trient sur leur valeur métier et non sur le HTML affiché. Détail de l'API et des deux formes d'intégration dans `ETAT-DU-PROJET.md` §6 bis.
- **Sidebar : renommer "Registre Santé & Sécurité" en "Registre SST" — ✅ Fait (2026-09-13).** Appliqué sur les 16 fichiers (lien de sidebar uniquement, pas les autres occurrences comme la carte du dashboard).
- **Registre SST (`registre-sst.html`) :**
  - Titre de page → "Registre santé sécurité au travail" — ✅ Fait (2026-09-13). Appliqué au `<title>`, au fil d'Ariane et au `<h1>` ; le libellé court "Registre SST" reste réservé à la sidebar.
  - Le "…" sous le titre (infobulle) — ✅ **Fait (2026-09-14), traité comme chantier transversal.** Un attribut `title` natif (texte intégral, sans balises) a été ajouté au `<p>` de l'en-tête compact sur les 15 pages concernées (17 - `dashboard.html`, qui a son propre en-tête distinct, et `index.html`, page vitrine hors sujet) — survol = infobulle native du navigateur, sans JS ni composant à construire. Pour `document-unique.html`, le tooltip explique en plus le rôle du DUERP (demande explicite du retour), pas seulement une répétition du sous-titre tronqué. `saisie-rh.html`/`saisie-duerp.html` : le tooltip suit aussi le texte dynamique en mode édition.
  - CRUD des observations "vide et verrouillé" — ✅ **Résolu (2026-09-12), cause confirmée.** Ce n'était pas un problème d'accès RH/admin : une variable `canEdit` était utilisée dans `registre-sst.html` sans jamais avoir été déclarée (`ReferenceError`), ce qui plantait tout le script dès le chargement — aucun bouton n'apparaissait (ni Import/Export/Nouvelle observation, ni horloge). Corrigé en ajoutant `const canEdit = canRespond;`. Le CRUD lui-même fonctionnait déjà correctement une fois ce plantage levé.
- **Registre AT/MP (`registre-at-mp.html` / `saisie-rh.html`) :**
  - Retirer "— Ville et Agglomération" du sous-titre — ✅ Fait (2026-09-13).
  - Nouvelle colonne de statut de l'arrêt : "En cours" / "Clôturé" — ✅ Fait (2026-09-13). Ajouté au badge "Statut" existant (`arretStatut`) plutôt qu'une colonne séparée ; calculé automatiquement (voir point suivant), avec repli "En cours" pour les enregistrements existants qui n'ont que l'ancien champ `joursArret` sans dates détaillées.
  - Remplacer le champ libre "Nombre de jours d'arrêt" par deux champs date (début/fin) — ✅ Fait (2026-09-13). `saisie-rh.html` calcule désormais `joursArret` et `statutArret` ("Clôturé" si une date de fin est saisie, sinon "En cours", jours comptés jusqu'à aujourd'hui) à partir de `dateDebutArret`/`dateFinArret` ; les enregistrements plus anciens sans ces deux dates restent affichés via leur `joursArret` hérité (zéro régression).
  - Masquer les filtres globaux (Collectivité/Service/Année) pour Agent et Manager — ✅ Fait (2026-09-13), masqués pour tout rôle hors RH/admin (`!canEdit`). Le volet "Préventeur" de la demande reste en attente : pas de rôle/permission "Préventeur" générique pour l'instant (voir module 18 pour le premier pas concret sur les permissions granulaires, câblé uniquement sur le module Dossiers AT/MP & CITIS) — à revisiter si/quand un vrai statut Préventeur transversal est défini.
  - Rendre paramétrable qui a le droit de déclarer un accident — ✅ Fait (2026-09-14). Nouvelle permission granulaire `atmp-declare` (`session.modulePermissions`, booléen) : un manager/agent avec cette permission accordée dans `administration.html` peut désormais accéder à `saisie-rh.html` et déclarer un AT/MP sans avoir le rôle rh/admin — même mécanisme que le module 18, pas un rôle "Préventeur" codé en dur.
- **Document Unique (`document-unique.html`) :**
  - Tooltip expliquant le rôle du DUERP — ✅ Fait (2026-09-14), voir le point RSST ci-dessus (même chantier transversal, traité en une passe).
  - Icônes à moderniser — ✅ Fait (2026-09-14), option « adapter le set actuel » retenue : on reste sur le style Feather de toute l'application, mais trois incohérences sont corrigées. « Risques évalués » et « Élevé + Critique » partageaient la **même** icône (triangle d'alerte) ; « Score moyen » utilisait l'icône du Registre AT/MP ; « Maîtrise insuffisante » affichait un bouclier **validé** en couleur danger, soit l'inverse du sens voulu. Remplacées par une liste, une cible et un bouclier barré. L'icône d'identité du module (triangle d'alerte) reste inchangée pour rester cohérente avec la barre latérale.
  - Masquer les filtres pour le profil Agent — ✅ Fait (2026-09-13), masqués pour `role === "ag"` (Collectivité/Service), la Famille de risque et le Niveau restent visibles à tous (filtres de contenu, pas de périmètre organisationnel).

---

## Notes générales pour reprendre ce backlog

- **Un module à la fois.** Chaque module ci-dessus a été délégué comme une tâche isolée et bornée, avec vérification indépendante du résultat avant de le considérer acquis (voir §11 de `ETAT-DU-PROJET.md`, incident de l'agent en roue libre). Reproduire cette discipline plutôt que de tout lancer en une seule passe.
- **Dette technique partiellement traitée le 2026-09-16 : trois rosters d'agents dérivés indépendamment du Registre AT/MP** (`sante-visites.html`, `formation-habilitation.html`, `epi-dotation.html`). Le geste identique dans les trois (hash déterministe `hashStr`, dédoublonnage par `nom|prénom|service` dans une `Map`) est désormais factorisé dans `assets/roster.js` (`VigieRoster.hashStr`, `VigieRoster.dedupeByAgent`) — chaque module garde sa propre logique de ce qu'il seede pour un agent (combien d'enregistrements, quels champs), seule la brique commune est partagée. **Ce que ça ne règle PAS** : les trois modules dérivent toujours chacun leur propre copie de données (pas de source canonique unique) — `SEED_ATMP` est d'ailleurs vide dans les trois aujourd'hui (donnée de départ réelle chargée via DATATEST, pas via ce mécanisme). Si un 4ᵉ module a besoin d'un roster d'agents, ou si le futur module RH (ligne ~338, `vigie_hse_agents`) voit le jour, réévaluer alors si `VigieRoster` doit devenir une vraie source de données partagée plutôt qu'un simple utilitaire de hash/dédoublonnage.
- **Chaque nouveau module = un nouveau fichier `.html` + une entrée de sidebar à ajouter sur TOUTES les pages existantes.** C'est le point le plus sujet aux oublis/erreurs (voir l'incident de corruption par regex non ancrée, §11 de `ETAT-DU-PROJET.md`) — procéder fichier par fichier, jamais par un remplacement global non vérifié.
- **Attention aux limites de session/débit** lors de la délégation à des agents en arrière-plan : une tâche peut être interrompue par une erreur `rate_limit` en toute fin de tâche, souvent après que le travail réel soit déjà terminé. Toujours vérifier l'état réel des fichiers avant de considérer le travail perdu ou de relancer une tâche déjà accomplie.
