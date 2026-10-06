# Carte de couverture ISO 45001 — ce que VIGIE HSE couvre, clause par clause

> Étude du jalon **J1** (accompagnement à la certification), faite le 2026-10-06 à la demande de l'utilisateur. **Lecture technique, pas un avis de certification** : elle dit ce que le logiciel produit aujourd'hui en face de chaque exigence ; c'est au préventeur, puis à un auditeur, de dire si cela suffit. La certification reste délivrée par un organisme accrédité après audit ; VIGIE HSE peut outiller la préparation et la collecte des preuves, pas s'y substituer.
>
> Seuls les **intitulés** des clauses (structure commune des normes de management) sont repris ici ; le texte de la norme est sous droit d'auteur et se procure auprès de l'AFNOR. Le référentiel **MASE**, que l'utilisateur a demandé d'étudier à côté (`ROADMAP-MODULES-FUTURS.md`, J1), n'est pas traité dans ce document.

## Comment lire

| Repère | Sens |
|---|---|
| ✅ Couvert | l'application tient l'enregistrement ou l'outil qu'un auditeur demanderait pour cette exigence |
| 🔶 Partiel | une base existe ; la pièce manquante est nommée |
| ❌ Écart | rien aujourd'hui |
| ➖ Hors outil | relève de l'organisation (moyens, engagement), pas d'un logiciel |

« Preuve produite » = ce qu'on pourrait montrer à un auditeur depuis l'application (écran, export Excel, impression, journal).

## Synthèse

Sur 30 exigences (clauses 4 à 10, au niveau des sous-clauses) : **8 couvertes**, **13 partielles**, **6 écarts**, **3 hors outil**.

Le cœur opérationnel est solide : évaluation des risques, actions, compétences, urgences, surveillance, accidents et leurs analyses. Ce qui manque, c'est surtout la **couche « pilotage du système »** qu'un auditeur demande en premier : revue de direction, objectifs chiffrés, évaluation de la conformité réglementaire, programme d'audit interne. Les données d'entrée de ces exigences existent déjà presque toutes dans l'application ; il manque l'écran qui les assemble et en garde la trace.

## Clause par clause

### 4 — Contexte de l'organisme

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 4.1 Compréhension de l'organisme et de son contexte | ❌ | — | un registre des enjeux internes et externes |
| 4.2 Besoins et attentes des travailleurs et des autres parties intéressées | 🔶 | les attentes des travailleurs remontent par le **Registre SST** (observations, anonymat possible, réponse tracée) et le **Dialogue social** (questions des représentants à la direction) | la liste des parties intéressées (inspection du travail, médecine de prévention, assureur, usagers…) et de leurs attentes |
| 4.3 Domaine d'application du système | 🔶 | **Administration → Organisation** délimite ce qui est suivi : entrées (Ville, Agglomération, ou Usine 1…), services, secteur | un énoncé du périmètre, daté et diffusé (pourrait vivre dans la Base documentaire) |
| 4.4 Système de management de la S&ST | ➖ | l'application dans son ensemble est un outil du système | — |

### 5 — Leadership et participation des travailleurs

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 5.1 Leadership et engagement | 🔶 | **Indicateurs & Reporting** donne à la direction une vue consolidée, imprimable et exportable ; le **Dialogue social** garde ses réponses aux représentants | l'engagement lui-même relève de la direction ; l'outil peut seulement en garder les traces (voir 9.3) |
| 5.2 Politique de S&ST | 🔶 | la **Base documentaire** peut porter la politique : type de document créé par le rédacteur, référence, version, date, statut, visible de tous | le fichier lui-même (liens seulement), sa date de revue, et la preuve que chacun en a pris connaissance |
| 5.3 Rôles, responsabilités et autorités | 🔶 | **profils de droits** (qui fait quoi dans l'outil), organigramme de **Gestion RH**, **personnes désignées** des plans d'urgence (chargé d'évacuation, guide-file, serre-file, SST…), référent de l'**Accueil au poste** | un registre des rôles de prévention (assistant ou conseiller de prévention, membres de l'instance…) avec leur mission et leur date de désignation |
| 5.4 Consultation et participation des travailleurs | ✅ | **Registre SST** (observations de tout agent, anonymes ou non, réponse tracée) ; **Dialogue social** (questions et réponses, réunions de la formation spécialisée avec avis rendus et suites, visites de site dont les actions rejoignent le Plan d'actions, indicateurs anonymisés) | — |

### 6 — Planification

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 6.1.1 Risques et opportunités du système | ❌ | — (le Document unique couvre les risques pour la santé et la sécurité, pas les risques et opportunités du système lui-même) | un registre court : risque ou opportunité, action décidée |
| 6.1.2 Identification des dangers, évaluation des risques | ✅ | **Document unique** (évaluations par service, cotation, familles de risque avec leur fiche), **Pénibilité** (expositions par poste et par an, seuils de l'article D4163-2), **Produits chimiques** (pictogrammes CLP, FDS, CMR) ; exports Excel et impression du registre | — |
| 6.1.3 Exigences légales et autres exigences | 🔶 | **Veille réglementaire** (Administration) : titre, source, date, catégorie, statut, affichée au tableau de bord | à quels sites ou activités un texte s'applique, et l'obligation qu'il crée (voir 9.1.2) |
| 6.1.4 Planification des actions | ✅ | **Plan d'actions** : rassemble les actions du Document unique (risques élevés et critiques), des inspections, des analyses d'accident, des exercices d'urgence et du dialogue social, avec responsable, échéance, priorité et statut | — |
| 6.2 Objectifs de S&ST | ❌ | Indicateurs & Reporting **mesure** (taux de fréquence, actions soldées, observations traitées…), le Registre AT/MP le taux de gravité | un objectif chiffré par indicateur, son échéance, et l'écart affiché |

### 7 — Support

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 7.1 Ressources | ➖ | — | relève du budget et des moyens de l'organisation |
| 7.2 Compétences | ✅ | **Formation / Habilitation** : habilitations par agent, durée de validité par type, échéances et alertes de renouvellement ; lien avec le suivi médical renforcé (Santé & Visites) | — |
| 7.3 Sensibilisation | ✅ | **Accueil au poste** (parcours par type d'accueil, délai de 8 jours, date butoir et alerte, fiche à signer) ; **Base documentaire** lisible de tous ; « Fiches utiles » sous le titre des pages ; Flash Info | — |
| 7.4 Communication | 🔶 | Flash Info et veille au tableau de bord, réponses du Registre SST, Dialogue social | un plan de communication (quoi, à qui, quand, par qui), et la communication externe |
| 7.5 Informations documentées | 🔶 | **Base documentaire** (registre des documents : type, référence, version, date, statut, affiché ou masqué) ; **journal d'audit** (signé par le serveur et sauvegardé chaque jour quand l'application tourne sur son serveur) ; exports Excel et impressions de chaque registre | le stockage des fichiers eux-mêmes (liens seulement aujourd'hui) et un circuit d'approbation d'un document |

### 8 — Réalisation des activités opérationnelles

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 8.1.1 Planification et maîtrise opérationnelles | ✅ | **Vérifications périodiques** (contrôles réglementaires et échéances), **Inspection / Audit** (trames réutilisables, non-conformités envoyées au Plan d'actions), **Produits chimiques** (FDS et mesures de prévention visibles de tous), **EPI & Dotation** (catalogue, stock, dotation, entretien) | — |
| 8.1.2 Élimination des dangers et réduction des risques | 🔶 | mesures de prévention du Document unique, EPI | l'ordre des mesures (supprimer, remplacer, protéger collectivement, organiser, puis seulement l'EPI) n'est pas représenté : une mesure n'est pas rangée par niveau |
| 8.1.3 Management du changement | ❌ | — (seul l'accueil « changement de poste » s'en approche) | une fiche de changement : ce qui change, risques réévalués, mesures avant mise en œuvre |
| 8.1.4 Achats, intervenants extérieurs, externalisation | 🔶 | **Entreprises extérieures** : inspection commune préalable, plan de prévention, seuil de 400 h par opération, travaux dangereux | les critères de santé-sécurité à l'achat d'un équipement ou d'un produit |
| 8.2 Préparation et réponse aux situations d'urgence | ✅ | **Situations d'urgence** : plans par site (consignes, alerte, numéros d'urgence, points de rassemblement, personnes désignées, moyens de secours, consigne A4 à afficher) ; exercices avec périodicité, échéance et actions correctives | — |

### 9 — Évaluation des performances

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 9.1.1 Surveillance, mesure, analyse | ✅ | **Indicateurs & Reporting** (taux de fréquence estimé et réel, remontée des événements par type, accidents et jours d'arrêt par risque, indicateurs de chaque module, export Excel) ; taux de gravité au **Registre AT/MP** et dans **Gestion RH** ; **Santé & Visites** (surveillance médicale) ; **Vérifications périodiques** | — |
| 9.1.2 Évaluation de la conformité | ❌ | — (la veille dit qu'un texte existe, pas qu'on le respecte) | pour chaque exigence applicable : conforme ou non, date d'évaluation, preuve, action si non conforme |
| 9.2 Audit interne | 🔶 | **Inspection / Audit** : contrôles de terrain à partir de trames, non-conformités vers le Plan d'actions | un programme d'audit du **système** : calendrier, critères (les clauses), auditeur et son indépendance, rapport à la direction |
| 9.3 Revue de direction | ❌ | les données d'entrée existent toutes (reporting, plan d'actions, audits, observations, dialogue social) ; les réunions de la formation spécialisée ne sont pas une revue de direction | un compte rendu daté de revue : éléments examinés, décisions, actions envoyées au Plan d'actions |

### 10 — Amélioration

| Exigence | Repère | Ce que fait VIGIE HSE — preuve produite | Ce qui manque |
|---|---|---|---|
| 10.1 Généralités | ➖ | — | — |
| 10.2 Événement indésirable, non-conformité, action corrective | 🔶 | **Registre AT/MP** (cinq types, dont presque-accident et incident bénin), **Analyse d'accident** (arbre des causes, 5 pourquoi, Ishikawa), **Dossiers AT/MP & CITIS**, non-conformités d'inspection, actions correctives au **Plan d'actions** | le signalement des presque-accidents par les agents eux-mêmes (question 20, jalon J2) et la **vérification de l'efficacité** d'une action soldée (aucun champ ne la porte) |
| 10.3 Amélioration continue | 🔶 | Plan d'actions et tendances du reporting | sans objectifs (6.2), pas de mesure du progrès |

## Écarts à combler, par ordre de valeur probable

Classement technique, à revoir avec le préventeur et l'utilisateur avant tout chantier :

1. **Revue de direction (9.3)** — l'exigence la plus systématiquement demandée en audit, et la moins chère ici : toutes ses données d'entrée sont déjà dans l'application. Un écran qui les assemble pour une période, recueille les décisions et envoie les actions au Plan d'actions.
2. **Objectifs (6.2)** — un objectif chiffré par indicateur du reporting, avec l'écart affiché. Alimente la revue de direction (1) et l'amélioration continue (10.3).
3. **Évaluation de la conformité (9.1.2, avec 6.1.3)** — prolonger la veille réglementaire : à quoi s'applique le texte, l'obligation qu'il crée, conforme ou non, preuve, date, action.
4. **Efficacité des actions correctives (10.2)** — un champ « efficacité vérifiée » (date, par qui, résultat) sur une action soldée. Petit chantier.
5. **Programme d'audit interne (9.2)** — un type « audit du système » dans Inspection / Audit : calendrier, clauses auditées, auditeur, constats vers le Plan d'actions.
6. **Politique (5.2)** — la politique dans la Base documentaire, avec date de revue et prise de connaissance (l'Accueil au poste sait déjà faire signer).
7. **Management du changement (8.1.3)**, **contexte et parties intéressées (4.1, 4.2)**, **risques et opportunités du système (6.1.1)** — registres simples, de moindre valeur ajoutée par rapport à un tableur.

Deux points relèvent du métier et ne seront pas tranchés côté technique : le **rangement des mesures de prévention par niveau** (8.1.2), et ce qu'un auditeur attend vraiment dans une revue de direction pour une collectivité. À poser au préventeur quand le chantier sera ouvert.

## Et ensuite

- Cette carte peut devenir les **données** de la « matrice de conformité intégrée » envisagée dans la roadmap (J1, idée 5) : une vue dans l'application qui relie chaque exigence aux enregistrements présents et signale en direct ce qui est prêt.
- Faire la même carte pour **MASE** avant de choisir les chantiers : un écart commun aux deux référentiels passe devant.
- Tenir cette carte à jour quand un module change ce qu'il produit (même règle que la checklist QA).
