# VIGIE HSE — Roadmap des modules futurs

Version organisée et suivie de `future modules.txt` (notes brutes laissées à la racine du dossier `Projet HSE`, conservées telles quelles — ce document-ci en est la réorganisation avec suivi d'avancement et annotations techniques).

**Légende statut :** ❌ Non démarré · 🔶 Base posée / partiellement couvert · ✅ Fait · 💤 En pause

Pour le contexte général du projet (stack, architecture, comment tester), voir `ETAT-DU-PROJET.md` dans ce même dossier.

---

## Vue d'ensemble

**Jalon stratégique** (transverse, distinct des modules fonctionnels ci-dessous — voir section dédiée juste après) :

| Jalon | Statut |
|---|---|
| **J0 — Généralisation commerciale (collectivités + secteur privé)** | ❌ Non démarré — prérequis à toute commercialisation |

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
| 8 | Gestion documentaire | ❌ Non démarré |
| 9 | Indicateurs & reporting KPI | ✅ Fait — `reporting.html` |
| 10 | EPI, dotation & entretien | ❌ Non démarré (nouveau, voir section dédiée) |
| 11 | Dashboard mobile simplifié | ✅ Fait |

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

### Ce qui doit devenir générique — structure organisationnelle

Le distingo actuel "Ville / Agglomération" est une **structure à 2 niveaux spécifique à cette collectivité précise** (commune + intercommunalité). Une entreprise privée n'a pas cette dichotomie — elle a plutôt des sites/filiales/directions/agences. Il faut remplacer ce couple figé par une notion générique d'**unités organisationnelles configurables** (nombre variable, hiérarchie libre : ça peut être 1 seule entité, ou une arborescence à plusieurs niveaux selon le client), dont "Ville"/"Agglomération" ne serait qu'une configuration possible parmi d'autres.

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

Chaque nouveau module métier construit *avant* ce jalon (voir liste 1-9 ci-dessous) risque de re-coder en dur les mêmes suppositions "collectivité territoriale" (vocabulaire, Ville/Agglomération, F3SCT...) qu'il faudra ensuite désapprendre. **Recommandation : traiter au minimum la généralisation du vocabulaire et de la structure organisationnelle avant de construire beaucoup plus de modules 1-9**, pour éviter d'avoir à tout reprendre a posteriori. Le passage à un vrai backend multi-tenant, en revanche, peut raisonnablement rester postérieur — il ne bloque pas la conception générique du modèle de données et du vocabulaire, qui peut se préparer dès maintenant dans l'architecture actuelle.

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

## 8. Gestion documentaire — ❌ Non démarré

**Note d'origine :** "Gestion documentaire : référentiel de documents officiels, dans tous les domaines concernés."

**Objectif probable :** un espace centralisé pour les documents officiels de l'app (DUERP imprimable, registre RSST imprimable, procédures HSE, notes de service, arrêtés, consignes de sécurité par site...).

**Annotation pour reprise :**
- **Limite structurelle importante à anticiper** : sans backend, ce projet ne peut pas stocker de vrais fichiers de façon fiable/partagée (le `localStorage` est limité en taille — généralement 5-10 Mo par origine — et n'est pas partagé entre utilisateurs). Deux options réalistes pour une V1 dans l'architecture actuelle :
  1. Un registre de **métadonnées** de documents (nom, catégorie, version, date, lien vers un emplacement externe — ex. un lecteur réseau ou un Drive de la collectivité) sans stockage du fichier lui-même.
  2. Attendre le passage à un vrai backend (voir §14 de `ETAT-DU-PROJET.md`) avant de construire ce module, car c'est probablement celui qui bénéficierait le plus d'un vrai stockage de fichiers.
- Discuter avec l'utilisateur avant de démarrer : accepter la limite (1) en V1, ou considérer que ce module doit attendre le backend ?

## 9. Indicateurs & reporting KPI — 🔶 Partiellement couvert

**Note d'origine :** "Indicateurs et reporting KPI:" *(vide, à préciser)*

**Ce qui existe déjà :** chaque module a son propre bandeau de KPI en haut de page (voir `.page-summary`/`.kpi-row` dans chaque fichier), et `index.html` centralise déjà les indicateurs principaux (AT/MP, jours d'arrêt, Score HSE, DUERP) sur le cockpit.

**Ce qui manque pour un vrai "module de reporting" :**
- Pas d'export consolidé (PDF/Excel) des indicateurs multi-modules pour, par exemple, un rapport annuel HSE ou une présentation en F3SCT/CHSCT.
- Pas de vue "historique"/tendance au-delà des 6 derniers mois déjà affichés pour les AT/MP sur le cockpit.
- Pas de tableau de bord personnalisable (choisir quels indicateurs afficher/comparer).

**Annotation pour reprise :** ce module a probablement le plus à gagner à être construit **après** que plusieurs des modules ci-dessus (2, 4, 5, 6, 8) existent, pour avoir davantage de données à agréger. Une V1 raisonnable : une page `reporting.html` avec une sélection de période + export Excel (réutiliser SheetJS, déjà en place pour l'import/export AT/MP et DUERP) des indicateurs de tous les modules actifs.

## 10. EPI, dotation & entretien — ❌ Non démarré

**Note d'origine (demande directe de l'utilisateur) :** un module couvrant tout ce qui concerne l'équipement personnel — EPI (Équipements de Protection Individuelle), vêtements de travail, gestion des stocks, entretien et lavage (avec gestion des cycles de lavage), centralisation des fiches techniques, gestion de la dotation (ce qui a été remis à quel agent).

**Objectif compris :** un registre à plusieurs volets, plus proche d'une gestion de stock/inventaire que des autres modules HSE :
1. **Catalogue** : les articles disponibles (EPI + vêtements), avec fiche technique (norme EN associée, taille, durée de vie recommandée).
2. **Stock** : quantités en magasin par article/taille, seuil de réapprovisionnement.
3. **Dotation** : ce qui a été remis à quel agent, quand, et la date de péremption/renouvellement prévue (chaussures de sécurité, gants, casque, vêtements haute visibilité...).
4. **Entretien/lavage** : cycles de lavage suivis par article ou par lot (certains EPI ont un nombre de lavages maximal avant perte de leurs propriétés protectrices — pertinent en particulier pour les vêtements haute visibilité et ignifugés).

**Annotation pour reprise :**
- Modèle pressenti (4 tables sous forme de clés `localStorage` séparées, comme le reste de l'app) :
  - `vigie_hse_epi_catalogue` — `{id, nom, categorie ("EPI"|"Vêtement de travail"), norme (ex. "EN 388", "EN ISO 20471"), dureeVieMois ou nombreLavagesMax, ficheTechnique (texte/URL)}`.
  - `vigie_hse_epi_stock` — `{id, articleId, taille, quantiteStock, seuilAlerte}`.
  - `vigie_hse_epi_dotations` — `{id, agent (nom/prénom/service — même roster partagé que Santé & Visites/Formation, voir note ci-dessous), articleId, taille, dateRemise, dateRenouvellementPrevue (calculée depuis dureeVieMois), statut}` — même pattern périodicité/échéance/statut que `verifications-periodiques.html`/`formation-habilitation.html`.
  - `vigie_hse_epi_lavages` — `{id, articleId ou dotationId, dateLavage, nombreLavagesCumules, statut ("OK"|"À réformer" si nombreLavagesCumules ≥ nombreLavagesMax)}`.
- **C'est le 3ᵉ module à avoir besoin d'un roster d'agents** (après Santé & Visites et Formation/Habilitation) — voir la note générale ci-dessous, c'est maintenant un vrai problème de duplication à traiter, pas juste une hypothèse.
- Portée volontairement large (4 sous-thèmes en un seul module) — à re-découper en plusieurs pages si la construction s'avère trop dense pour un seul fichier (par ex. séparer "Catalogue + Stock" d'un côté et "Dotation + Lavage" de l'autre), à décider au moment de la construction plutôt que de figer maintenant.

## 11. Dashboard mobile simplifié — ❌ Non démarré, décision de principe prise

**Décision (utilisateur, confirmée) :** l'usage principal restera desktop (RH/HSE au bureau, saisie de données denses). Une vraie application native (React Native/Flutter, nouvelle stack séparée) n'est **pas** retenue — jugée disproportionnée par rapport au besoin réel. La direction retenue est un **dashboard mobile simplifié**, dans la même stack HTML/CSS/JS que le reste du site, pas une appli à part.

**Ce que "simplifié" veut dire concrètement (à affiner au moment de la construction) :** pas une tentative de faire tenir les tableaux à 10+ colonnes et les formulaires denses sur petit écran — plutôt une vue mobile dédiée avec un sous-ensemble d'actions à forte fréquence d'usage terrain, par exemple :
- Consultation rapide des KPI principaux (au lieu du dashboard complet).
- Déclarer un AT/MP ou déposer une observation RSST (formulaires déjà les plus "rapides" de l'app) en version mobile allégée.
- Le reste (Administration, Indicateurs & Reporting, tableaux denses) reste explicitement desktop-only, avec un message clair plutôt qu'un rendu dégradé si consulté sur mobile.

**Annotation pour reprise :** ne pas confondre avec le travail responsive déjà fait (sidebar en tiroir, tableaux avec défilement horizontal contenu, `.page-summary` qui s'adapte) — ce travail reste valable et nécessaire, mais insuffisant seul pour une bonne expérience mobile sur les modules denses. Ce module 11 est un vrai chantier de design d'interface (quelles actions exposer, quelle navigation simplifiée), pas juste du CSS — prévoir une phase de réflexion UX avant de coder.

---

## Notes générales pour reprendre ce backlog

- **Un module à la fois.** Chaque module ci-dessus a été délégué comme une tâche isolée et bornée, avec vérification indépendante du résultat avant de le considérer acquis (voir §11 de `ETAT-DU-PROJET.md`, incident de l'agent en roue libre). Reproduire cette discipline plutôt que de tout lancer en une seule passe.
- **Dette technique confirmée, pas seulement anticipée : trois rosters d'agents dérivés indépendamment du Registre AT/MP** (`sante-visites.html`, `formation-habilitation.html`, et bientôt le module EPI). Ils utilisent la même technique (dédoublonnage par nom/prénom/service, hash déterministe) mais sont trois copies indépendantes. **Avant de construire un 4ᵉ module qui en a besoin, factoriser ce roster** dans un référentiel partagé (ex. étendre `vigie_hse_referentials` ou créer `vigie_hse_agents`) plutôt que de continuer à dupliquer.
- **Chaque nouveau module = un nouveau fichier `.html` + une entrée de sidebar à ajouter sur TOUTES les pages existantes.** C'est le point le plus sujet aux oublis/erreurs (voir l'incident de corruption par regex non ancrée, §11 de `ETAT-DU-PROJET.md`) — procéder fichier par fichier, jamais par un remplacement global non vérifié.
- **Attention aux limites de session/débit** lors de la délégation à des agents en arrière-plan : une tâche peut être interrompue par une erreur `rate_limit` en toute fin de tâche, souvent après que le travail réel soit déjà terminé. Toujours vérifier l'état réel des fichiers avant de considérer le travail perdu ou de relancer une tâche déjà accomplie.
