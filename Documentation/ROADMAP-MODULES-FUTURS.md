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
| 10 | EPI, dotation & entretien | ✅ Fait — `epi-dotation.html` |
| 11 | Dashboard mobile simplifié | ✅ Fait |
| 12 | Accueil au poste | ❌ Non démarré (nouveau, retour alpha 2026-09-12) |
| 13 | Dialogue social | ❌ Non démarré (nouveau, retour alpha 2026-09-12) — nécessite un nouveau rôle/compte "Représentant du personnel" |
| 14 | Gestion administrative RH | ❌ Non démarré (nouveau, retour alpha 2026-09-12) — voir aussi extension du module 7 |

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

**Objectif probable :** un espace centralisé pour les documents officiels de l'app (DUERP imprimable, registre RSST imprimable, procédures HSE, notes de service, arrêtés, consignes de sécurité par site...).

**Annotation pour reprise :**
- **Limite structurelle importante à anticiper** : sans backend, ce projet ne peut pas stocker de vrais fichiers de façon fiable/partagée (le `localStorage` est limité en taille — généralement 5-10 Mo par origine — et n'est pas partagé entre utilisateurs). Deux options réalistes pour une V1 dans l'architecture actuelle :
  1. Un registre de **métadonnées** de documents (nom, catégorie, version, date, lien vers un emplacement externe — ex. un lecteur réseau ou un Drive de la collectivité) sans stockage du fichier lui-même.
  2. Attendre le passage à un vrai backend (voir §14 de `ETAT-DU-PROJET.md`) avant de construire ce module, car c'est probablement celui qui bénéficierait le plus d'un vrai stockage de fichiers.
- Discuter avec l'utilisateur avant de démarrer : accepter la limite (1) en V1, ou considérer que ce module doit attendre le backend ?

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
