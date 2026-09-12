# VIGIE HSE — Roadmap des modules futurs

## 🔝 État courant / dernières évolutions (2026-09-12)

- ✅ **Données de test** : les 10 fichiers générés par Gemini (`Documentation/PROMPT-GENERATION-DONNEES-TEST.md`), vérifiés et corrigés, sont dans `DATATEST/`. Chaque module a désormais un vrai bouton "Importer .xlsx", **et** un **auto-chargement automatique** de ces fichiers au chargement de chaque page quand le site est servi en http/https (GitHub Pages) — plus besoin de cliquer un par un. IDs déterministes (`dtst-*`) pour éviter les doublons au rechargement.
- ✅ **Météo sans géolocalisation** : le widget météo (topbar, cockpit) ne demande plus la permission de localisation au navigateur. L'utilisateur choisit lui-même sa ville via une popover de recherche (API de géocodage Open-Meteo), le choix est mémorisé dans le navigateur.
- ✅ **Contenu centré** : sur tous les modules, la zone de contenu principale est maintenant centrée horizontalement sur grand écran (`margin:0 auto` ajouté à `.content`) au lieu de rester collée à gauche.

⚠️ **Rappel important** : l'auto-chargement DATATEST tourne pour **tous les visiteurs**, pas seulement en interne — un nouveau testeur verra directement les données de démo au lieu d'une app vraiment vierge. Le jour où une vraie remise à zéro est nécessaire, vider ou renommer `DATATEST/`.

**À vérifier ensuite** : repasser sur `Documentation/CHECKLIST-QA-V1.md` (section météo, import, centrage mises à jour) sur le site déployé.

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
| 1 | Veille réglementaire | 🔶 Base posée |
| 2 | Inspection / Audit | ✅ Fait — `inspection-audit.html`, alimente le Plan d'Actions |
| 3 | Plan d'Actions (hub transverse) | ✅ Fait — agrège désormais DUERP + Inspection/Audit |
| 4 | Gestion des produits chimiques | ✅ Fait — `produits-chimiques.html` |
| 5 | Pénibilité & fiches individuelles | ❌ Non démarré |
| 6 | Formation / Habilitation | ✅ Fait — `formation-habilitation.html` |
| 7 | Santé au travail — planning des visites médicales | 🔶 Base posée — extension prévue |
| 8 | Gestion documentaire (wiki++ HSE) | ❌ Non démarré — vision élargie, contenu fiches de sécurité/familles de risque ajouté 2026-09-12 |
| 9 | Indicateurs & reporting KPI | ✅ Fait — `reporting.html` |
| 10 | EPI, dotation & entretien | ✅ Fait — `epi-dotation.html` |
| 11 | Dashboard mobile simplifié | ✅ Fait |
| 12 | Accueil au poste | ❌ Non démarré (nouveau, retour alpha 2026-09-12) |
| 13 | Dialogue social | ❌ Non démarré (nouveau, retour alpha 2026-09-12) — nécessite un nouveau rôle/compte "Représentant du personnel" |
| 14 | Gestion administrative RH | ❌ Non démarré (nouveau, retour alpha 2026-09-12) — voir aussi extension du module 7 |
| 15 | Analyse d'accident (arbre des causes) | ❌ Non démarré (nouveau, 2026-09-12) — lié au jalon J2 |
| 16 | Situations d'urgence & exercices d'évacuation | ❌ Non démarré (nouveau, 2026-09-12) — recoupe l'écart clause 8.2 du jalon J1 |
| 17 | Entreprises extérieures & Plan de Prévention | ❌ Non démarré (nouveau, 2026-09-12) — recoupe le risque "Coactivité" déjà référencé |

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
| 6.1 — Veille des exigences légales | Module 1, Veille réglementaire | 🔶 Base posée |
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

## 1. Veille réglementaire — 🔶 Base posée

**Note d'origine :** "veille réglementaire :" *(note laissée vide par l'utilisateur — objectif à préciser)*

**Ce qui existe déjà (V0.1.1.2) :** le panneau "Actualités du secteur HSE" sur `index.html` — une liste éditoriale de 7 actualités réelles et sourcées (INRS, Weka, Préventica, Inforisque, portail de la Fonction publique), avec liens externes vers les articles. C'est un embryon de veille réglementaire, mais :
- Codé en dur dans `index.html` (pas de CRUD, pas de mise à jour depuis Administration).
- Pas de flux live (impossible sans backend — la plupart des sites d'actu HSE/juridiques n'autorisent pas le fetch cross-origin depuis un navigateur, et ce projet n'a pas de serveur proxy).
- Pas d'archivage, pas de catégorisation (loi / jurisprudence / norme / actu métier), pas de lien vers les modules impactés (ex. "ce changement de loi DUERP impacte le module Document Unique").

**Annotation pour reprise :** deux pistes possibles selon l'ambition voulue :
1. *Version légère* : donner à l'admin un CRUD dans `administration.html` pour éditer cette liste (comme pour Flash Info), avec les mêmes champs (titre/source/date/résumé/url) + une catégorie et un statut "à lire"/"lu"/"archivé".
2. *Version connectée* : nécessite un vrai backend capable de faire des requêtes serveur→serveur vers des flux RSS/API (Légifrance a une API officielle — `piste.gouv.fr` — INRS et Weka n'en ont pas publiquement). Hors de portée de l'architecture actuelle sans backend.

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

## 6. Formation / Habilitation — ✅ Fait

`formation-habilitation.html` : CACES, habilitation électrique, SST, AIPR, permis PL, travail en hauteur — durées de validité standards par type, roster dérivé du Registre AT/MP (même technique que Santé & Visites), statut À jour/À renouveler/Expirée calculé. **Remarque toujours valable pour un futur module Pénibilité** : envisager un roster d'agents partagé plutôt qu'une troisième dérivation indépendante du Registre AT/MP — il y en a maintenant deux (Santé & Visites, Formation/Habilitation) construites indépendamment l'une de l'autre.

## 7. Santé au travail — planning des visites médicales — 🔶 Base posée, extension prévue

**Note d'origine :** "Santé au travail, Gestion des visites médicales : gestion de planning, rdv, convocation,"

**Ce qui existe (V0.1.1.2) :** `sante-visites.html` — suit le type de visite, la date de dernière visite, la périodicité, calcule l'échéance et le statut (À jour/À programmer/En retard). Roster de départ dérivé (illustratif) du Registre AT/MP.

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

## 9. Indicateurs & reporting KPI — ✅ Fait, extension demandée

**Ce qui existe (`reporting.html`) :** sélection de période (`select` : 3/6/12 mois ou tout), indicateurs et tendance AT/MP sur cette période, export Excel (SheetJS). Limite documentée dans la page elle-même : la période ne s'applique qu'au Registre AT/MP et à sa tendance — les autres modules affichent une photo instantanée de l'état actuel, quelle que soit la période choisie.

**Extension demandée (retour alpha 2026-09-12) :**
- Remplacer/compléter le sélecteur de période (menu déroulant à choix prédéfinis) par un vrai sélecteur calendaire (dates de début/fin libres).
- Faire en sorte que **tous** les graphiques et valeurs affichés réagissent à la période sélectionnée, pas seulement le bloc AT/MP — lever la limitation actuellement documentée dans la page.
- Nouveaux graphiques demandés :
  - Évolution du nombre de jours d'arrêt dans le temps (courbe/tendance).
  - Nombre d'accidents par type de risque.
  - Nombre de jours d'arrêt par type de risque.
  - Ces deux derniers sont directement faisables : le champ `risque` existe déjà sur chaque événement AT/MP (`registre-at-mp.html`), simple regroupement à ajouter côté reporting.

## 10. EPI, dotation & entretien — ✅ Fait

**Note d'origine (demande directe de l'utilisateur) :** un module couvrant tout ce qui concerne l'équipement personnel — EPI (Équipements de Protection Individuelle), vêtements de travail, gestion des stocks, entretien et lavage (avec gestion des cycles de lavage), centralisation des fiches techniques, gestion de la dotation (ce qui a été remis à quel agent).

**Ce qui existe (`epi-dotation.html`) :** un registre à quatre volets, implémenté selon le modèle pressenti initialement :
1. **Catalogue** (`vigie_hse_epi_catalogue`) : les articles disponibles (EPI + vêtements), avec fiche technique (norme EN, taille, durée de vie recommandée).
2. **Stock** (`vigie_hse_epi_stock`) : quantités en magasin par article/taille, seuil de réapprovisionnement.
3. **Dotation** (`vigie_hse_epi_dotations`) : ce qui a été remis à quel agent, quand, et l'échéance de renouvellement, avec statut calculé (même pattern périodicité/échéance/statut que `verifications-periodiques.html`/`formation-habilitation.html`).
4. **Entretien/lavage** (`vigie_hse_epi_lavages`) : cycles de lavage suivis par article, statut "OK"/"À réformer" au-delà du nombre de lavages maximal.

**Dette technique toujours valable :** c'est le 3ᵉ module à dériver indépendamment un roster d'agents (après Santé & Visites et Formation/Habilitation) — voir la note générale en fin de document, ce n'est plus une hypothèse mais un vrai problème de duplication (3 copies indépendantes du même roster) à factoriser avant un 4ᵉ module qui en aurait besoin.

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

## 14. Gestion administrative RH — ❌ Non démarré

**Note d'origine (retour alpha, 2026-09-12) :** nouveau module, deux volets.

**Volet 1 — Données RH et calculs automatiques :**
- Base de données complète du personnel (liste des agents, fiches individuelles). **C'est très probablement le bon endroit pour résoudre la dette technique déjà identifiée** des rosters d'agents dupliqués indépendamment (`sante-visites.html`, `formation-habilitation.html`, `epi-dotation.html` — voir Notes générales en fin de document) : ce module deviendrait la source canonique, les trois autres modules la consommant au lieu de re-dériver leur propre copie.
- Saisie des données d'activité, notamment les heures travaillées.
- Calcul automatisé du Taux de fréquence (TF) et du Taux de gravité (TG). **Ces indicateurs existent déjà** dans `registre-at-mp.html`, mais avec un effectif et un volume horaire **codés en dur** (`EFFECTIF = 850` agents, 1607 h/an — la durée légale annuelle, pas les heures réellement travaillées). Ce module permettrait de calculer un TF/TG réel à partir des heures effectivement saisies, au lieu d'une approximation — à faire remplacer le calcul actuel plutôt qu'en construire un second en parallèle.

**Volet 2 — Organigramme et rattachements :**
- Modélisation de l'organigramme / structure hiérarchique de la collectivité ou de l'entreprise.
- Gestion des rattachements : équipes, managers, périmètres d'encadrement.
- Interface d'ajustement dynamique (réaffecter un agent, changer un responsable d'équipe).

**Annotation pour reprise :** ce volet 2 recoupe directement deux réflexions déjà en cours dans ce document — la généralisation des "unités organisationnelles" (section J0, aujourd'hui figées sur Ville/Agglomération) et le scoping par service du rôle `manager` déjà existant (`session.services`, voir `ETAT-DU-PROJET.md`). Un vrai organigramme donnerait une structure de données propre à ces deux chantiers plutôt que des règles de scoping éparses par module. À concevoir ensemble, pas comme trois chantiers séparés.

## 15. Analyse d'accident (arbre des causes) — ❌ Non démarré

**Demandé le 2026-09-12**, en lien direct avec le jalon **J2** (culture sécurité et remontée d'information — voir section dédiée plus haut) : aujourd'hui le Registre AT/MP enregistre le *fait* (qui, quand, où, quelles conséquences) mais pas l'*analyse* de pourquoi c'est arrivé ni de ce qui a été fait pour que ça ne se reproduise pas — deux choses distinctes.

**Objectif probable** (à confirmer avec l'utilisateur avant de coder) : une fiche d'analyse rattachée à un événement du Registre AT/MP (et potentiellement aux futurs presque-accidents/incidents bénins, voir J2), structurée autour d'une méthode d'analyse des causes reconnue en prévention — la plus répandue et la plus simple à outiller est l'**arbre des causes** (méthode INRS : reconstitution chronologique des faits menant à l'accident, distinction fait/opinion, remontée aux causes profondes plutôt qu'à la seule cause immédiate). Alternatives à évaluer selon la profondeur voulue : les "5 pourquoi" (plus légers, adaptés aux presque-accidents/incidents bénins) ou le diagramme d'Ishikawa (causes/effet par familles : matériel, méthode, main-d'œuvre, milieu, matière).

**Pistes fonctionnelles à évaluer, sans engagement de conception :**
- Un accès "Analyser" depuis chaque ligne du Registre AT/MP (et, une fois J2 avancé, depuis un presque-accident/incident bénin) plutôt qu'un module totalement séparé — l'analyse n'a de sens que rattachée à un événement.
- Une structure de données simple pour l'arbre des causes (liste de faits datés/typés, liens de causalité entre eux) plutôt qu'un éditeur graphique complexe dès la V1 de ce module — un export/impression lisible (PDF, à l'image de l'export déjà présent sur le Registre AT/MP) compte probablement plus qu'une belle interface de graphe interactive.
- Les actions correctives identifiées à l'issue de l'analyse doivent alimenter le Plan d'Actions existant (`origine: "Analyse"`, sur le modèle de ce qui existe déjà pour `"DUERP"` et `"Inspection"`) plutôt que créer un circuit de suivi parallèle.
- Qui a le droit de mener/valider une analyse (RH/admin seuls, ou aussi un manager/chef de service sur son périmètre ?) — à trancher avec la réflexion générale sur les rôles/permissions (section J0).

**Cadrage :** comme pour J1/J2, une piste posée pour discussion ultérieure, pas un chantier à démarrer immédiatement.

## 16. Situations d'urgence & exercices d'évacuation — ❌ Non démarré

**Demandé le 2026-09-12.** Recoupe un écart déjà repéré lors de l'étude du jalon **J1** (clause **8.2 — Préparation et réponse aux situations d'urgence** d'ISO 45001, listée comme candidat n°2 dans la confrontation clause par clause ci-dessus) : aujourd'hui rien dans VIGIE HSE ne trace la préparation aux situations d'urgence ni la tenue effective des exercices — un manque quasi systématiquement relevé en audit sécurité, et une brique de prévention à part entière indépendamment de toute certification.

**Objectif probable** (à confirmer avec l'utilisateur avant de coder) : deux volets distincts à ne pas mélanger dans un même écran —
- **Plans d'urgence par site** : consignes de sécurité, points de rassemblement, contacts d'urgence, moyens de secours disponibles (extincteurs, défibrillateur...) — plutôt de la donnée de référence par site que de l'instance répétée (voir le futur module Gestion documentaire, module 8, pour l'hébergement du document lui-même).
- **Exercices réalisés** : un registre chronologique par site (date, type — évacuation incendie, confinement, autre —, durée, participants ou taux de participation, anomalies constatées, actions correctives). C'est ce second volet qui a le plus de valeur immédiate : une preuve datée que les exercices ont bien lieu, pas seulement qu'un plan existe sur le papier.

**Pistes fonctionnelles à évaluer, sans engagement de conception :**
- Rattacher au même modèle site que celui déjà utilisé par `verifications-periodiques.html` (`SITES`, `service`, `collectivite`) plutôt que réinventer une notion de site propre à ce module.
- Les anomalies/non-conformités constatées lors d'un exercice devraient alimenter le Plan d'Actions existant, sur le même principe que `"DUERP"`, `"Inspection"` et le futur `"Analyse"` (module 15) — pas un circuit de suivi séparé de plus.
- Un rappel/échéance de "prochain exercice dû" par site, dans l'esprit de ce qui existe déjà pour les échéances de Vérifications Périodiques et de Formation/Habilitation.
- Vérifier avant de construire si une périodicité réglementaire minimale s'applique (type d'établissement recevant du public, code du travail) — à documenter plutôt qu'à deviner.

**Cadrage :** comme pour J1/J2/module 15, une piste posée pour discussion ultérieure, pas un chantier à démarrer immédiatement.

## 17. Entreprises extérieures & Plan de Prévention — ❌ Non démarré

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
- Lien naturel avec la Formation/Habilitation existante côté agents internes — question ouverte : faut-il tracer aussi les habilitations/qualifications exigées côté entreprise extérieure (ex. habilitation électrique d'un sous-traitant), ou est-ce hors périmètre de VIGIE HSE (responsabilité contractuelle de l'entreprise extérieure elle-même) ?

**Cadrage :** comme pour les autres pistes ajoutées cette semaine, une piste posée pour discussion ultérieure, pas un chantier à démarrer immédiatement.

---

## Retours de test Alpha (2026-09-12) — points UX/fonctionnels sur les modules déjà construits

Points remontés par un retour de test alpha (résumé d'une discussion avec Gemini), analysés et confrontés au code existant. Contrairement aux sections numérotées ci-dessus, ce ne sont pas de nouveaux modules mais des corrections/ajustements sur des modules déjà en place. Statut de chaque point à date de rédaction :

- **En-tête du tableau de bord (`dashboard.html`) — 🔶 réflexion à mener.** Le texte de bienvenue ("Bonjour." + sous-titre) est jugé trop verbeux, et le positionnement du nom "VIGIE HSE" doit être repensé dans cette même zone. Pas de direction de design arrêtée — à traiter comme une vraie refonte de cet en-tête, pas une simple coupe de texte. Ne concerne que `dashboard.html` (le tableau de bord post-connexion), pas `index.html` (la page vitrine publique, hors sujet ici).
- **Tri & filtres dynamiques façon Excel sur toutes les colonnes de tous les tableaux — 🆕 chantier transversal.** Rien de tel n'existe aujourd'hui (seulement des filtres déroulants par page). Recommandation : construire un composant réutilisable (tri par clic sur en-tête de colonne + filtre par colonne) une fois, plutôt que de le dupliquer sur chacune des pages à tableau — cohérent avec la dette déjà notée sur le CSS dupliqué par fichier (`ETAT-DU-PROJET.md` §14). Priorisation entre modules non encore arbitrée.
- **Sidebar : renommer "Registre Santé & Sécurité" en "Registre SST" — ✅ à faire, simple.**
- **Registre SST (`registre-sst.html`) :**
  - Titre de page → "Registre santé sécurité au travail" (le libellé court "Registre SST" reste réservé à la sidebar, ne pas confondre les deux).
  - Le "…" sous le titre à remplacer par une infobulle n'est pas un texte statique : c'est le CSS de l'en-tête compact (`.page-summary-text p`, `text-overflow:ellipsis`) qui tronque la vraie description déjà présente, sur **toutes les pages du site**, pas seulement RSST. Corriger ce composant partagé (ex. tooltip/popover au survol) réglerait le problème partout d'un coup — bon candidat à traiter avec le point sur l'en-tête du dashboard.
  - CRUD des observations "vide et verrouillé" — ❓ **à vérifier avant toute correction.** Le code contient déjà une logique de création/réponse/suppression d'observation (réponse restreinte à RH/admin). Reproduire le parcours exact du retour alpha (quel compte utilisé, quelle action bloquée) pour confirmer ou infirmer un vrai bug avant de coder quoi que ce soit.
- **Registre AT/MP (`registre-at-mp.html` / `saisie-rh.html`) :**
  - Retirer "— Ville et Agglomération" du sous-titre (`saisie-rh` non concerné, texte situé dans `registre-at-mp.html`) — cohérent avec le travail de dé-identification déjà engagé.
  - Nouvelle colonne de statut de l'arrêt : "En cours" / "Clôturé".
  - Remplacer le champ libre "Nombre de jours d'arrêt" (`saisie-rh.html`, actuellement un simple `<input type="number">`) par deux champs date (début/fin d'arrêt), avec jours calculés automatiquement en lecture seule.
  - Masquer les filtres globaux (Collectivité/Service/Année) pour Agent et Manager (déjà scopés par service à la création du compte), les garder pour RH/Préventeur/Admin.
  - Rendre paramétrable par l'admin qui a le droit de déclarer un accident (RH seul / Préventeur seul / ouverture aux managers) — dépend du modèle de permissions à définir (voir section J0).
- **Document Unique (`document-unique.html`) :**
  - Ajouter un encart/tooltip expliquant le rôle du DUERP sous le titre (même logique transversale que le point RSST ci-dessus).
  - Icônes à moderniser — subjectif, nécessite soit une direction visuelle de l'utilisateur, soit plusieurs propositions à soumettre.
  - Masquer les filtres pour le profil Agent (vision restreinte à son propre service), même logique que pour AT/MP.

---

## Notes générales pour reprendre ce backlog

- **Un module à la fois.** Chaque module ci-dessus a été délégué comme une tâche isolée et bornée, avec vérification indépendante du résultat avant de le considérer acquis (voir §11 de `ETAT-DU-PROJET.md`, incident de l'agent en roue libre). Reproduire cette discipline plutôt que de tout lancer en une seule passe.
- **Dette technique confirmée, pas seulement anticipée : trois rosters d'agents dérivés indépendamment du Registre AT/MP** (`sante-visites.html`, `formation-habilitation.html`, et bientôt le module EPI). Ils utilisent la même technique (dédoublonnage par nom/prénom/service, hash déterministe) mais sont trois copies indépendantes. **Avant de construire un 4ᵉ module qui en a besoin, factoriser ce roster** dans un référentiel partagé (ex. étendre `vigie_hse_referentials` ou créer `vigie_hse_agents`) plutôt que de continuer à dupliquer.
- **Chaque nouveau module = un nouveau fichier `.html` + une entrée de sidebar à ajouter sur TOUTES les pages existantes.** C'est le point le plus sujet aux oublis/erreurs (voir l'incident de corruption par regex non ancrée, §11 de `ETAT-DU-PROJET.md`) — procéder fichier par fichier, jamais par un remplacement global non vérifié.
- **Attention aux limites de session/débit** lors de la délégation à des agents en arrière-plan : une tâche peut être interrompue par une erreur `rate_limit` en toute fin de tâche, souvent après que le travail réel soit déjà terminé. Toujours vérifier l'état réel des fichiers avant de considérer le travail perdu ou de relancer une tâche déjà accomplie.
