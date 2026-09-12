# Prompt pour Gemini — génération de données de test VIGIE HSE

> À copier-coller tel quel dans Gemini (de préférence une version capable de générer/joindre des fichiers .xlsx, ex. Gemini dans Google AI Studio ou avec l'outil Sheets/Code activé). Si Gemini ne peut pas produire directement des .xlsx, demande-lui en complément un export CSV par fichier — tu pourras l'ouvrir et l'enregistrer en .xlsx toi-même.
>
> **Mise à jour** : tous les modules disposent maintenant d'un vrai bouton « Importer .xlsx » (ajouté après la première version de ce prompt) — les 10 fichiers ci-dessous s'importent donc tous directement dans l'application, chacun dans le module correspondant.

---

## Contexte à donner à Gemini

Tu es en train de générer un **jeu de données de démonstration entièrement fictif** pour un logiciel de gestion HSE (Hygiène-Sécurité-Environnement) destiné à une collectivité territoriale française imaginaire : **« Ville de Verchamps »** et **« Agglomération de Verchamps »**. Ce jeu de données servira uniquement à tester le fonctionnement d'une application, pas à représenter des personnes réelles.

**Règles impératives :**
1. Toutes les personnes (agents, inspecteurs, responsables...) doivent être **entièrement fictives** — prénoms/noms français plausibles mais inventés, aucune personne réelle.
2. Reste cohérent : réutilise le **même roster d'agents fictifs** (voir étape 1) à travers tous les fichiers, pour raconter une histoire cohérente (un agent qui a un accident dans le fichier AT/MP peut aussi apparaître dans le suivi santé, les formations ou les dotations EPI).
3. Utilise uniquement les **valeurs de listes fermées** indiquées ci-dessous quand elles sont précisées (ne pas inventer d'autres valeurs — l'import les rejette ou les remplace par une valeur par défaut si elles ne correspondent pas exactement).
4. Dates au format `AAAA-MM-JJ`, réparties sur les **18 derniers mois** avant aujourd'hui, de façon réaliste (pas toutes le même jour).
5. Laisse la colonne **ID vide** partout — l'application génère ses propres identifiants à l'import.
6. Livre chaque tableau ci-dessous comme un **fichier .xlsx séparé**, une seule feuille par fichier (sauf Fichier 10, voir plus bas), avec exactement les en-têtes de colonnes indiqués (respecte la casse et les accents).
7. Français correct, vocabulaire HSE réaliste (pas de texte "lorem ipsum" ni de valeurs type "Test 1").

---

## Étape 1 — Roster d'agents fictifs (base de cohérence, pas un fichier à livrer)

Avant de générer les fichiers, construis en interne une liste d'environ **30 agents fictifs** avec : Nom, Prénom, Civilité (M./Mme), Date de naissance (adulte entre 22 et 62 ans), Collectivité (Ville ou Agglomération), Service (voir listes ci-dessous), Statut RH (voir liste), Catégorie (A/B/C), Filière (Technique, Administrative, Sportive, Culturelle, Sociale, Police municipale), Cadre d'emplois et Grade plausibles pour la filière (ex. « Adjoint technique territorial » / « Adjoint technique principal 2e classe »).

Réutilise ce roster (mêmes noms/prénoms/services) dans les fichiers 1, 6, 7, 8, 9 ci-dessous plutôt que d'inventer de nouvelles personnes à chaque fichier.

### Listes de référence à respecter partout

**Services — Ville** : Accueil & Affaires Générales, Patrimoine Bâti, Communication Institutionnelle, Restauration Collective, Ressources Humaines & Vie au Travail, Enfance & Jeunesse, Espaces Verts & Paysage, Vie Événementielle, Atelier Mécanique, Propreté de la Ville, Affaires Financières, Police Municipale & Tranquillité, Sports & Vie Associative, Voirie & Réseaux

**Services — Agglomération** : Direction Générale des Services, Ressources Humaines & Vie au Travail, Conservatoire de Musique, Enfance & Jeunesse, Réseau des Médiathèques, Petite Enfance & Familles, Collecte & Propreté, Sports & Vie Associative, Urbanisme & Aménagement

**Statuts RH** : Assistante maternelle-CDI, CONT - Catégorie A, CONT - Emploi Vacant, CONT - Remplaçant, CONT - Saisonnier, Détaché FPT, Stagiaire, Titulaire (FPT)

---

## Fichier 1 — `1-registre-at-mp.xlsx` → importer sur `registre-at-mp.html`

Génère **25 lignes**. Colonnes exactes :

`Collectivité | date AT | Date AT Mois | Jour | Libellé statut | Libellé civilité | Nom | Prénom | Date de naissance | Age | Libellé service ATMP | SERVICE | Libellé catégorie (actuel) | Libellé filière (actuel) | Libellé cadre emploi (actuel) | Type at/mp | Avec ou sans arret | Nb jours arrêt total | Circonstances | Libellé grade (actuel) | Etat | Risque | Siege | Nature | Elément matériel`

Valeurs à respecter :
- **Collectivité** : `Ville` ou `Agglomération`
- **Type at/mp** : `Accident de travail` / `Accident de trajet` / `Incident bénin` / `Presque accident` (mélange varié, majorité d'incidents bénins et presque-accidents, quelques AT avec arrêt, 1 ou 2 accidents de trajet)
- **Avec ou sans arret** : `Avec Arrêt` ou `Sans Arrêt` (cohérent avec le nombre de jours d'arrêt : 0 si "Sans Arrêt")
- **Risque** : un parmi `Activité Physique, Autres, Chute de hauteur, Chute de plain pied, Chute d'objet, Déplacement, Equipement de travail, Routier, RPS`
- **Siege** (partie du corps) : un parmi `Autres, Bras, Cervical, Cheville, Cuisse, Dos, Epaule, Genoux, Main, Mollet, Multiple, Oreilles, Pieds, Poignée, Rps, Thorax, Ventre, Visage, Yeux`
- **Nature** (nature de la lésion) : un parmi `Autres, Brulure, Contusion, Douleur, Entorse, Inflammation, Lombalgie, Malaise, Multiple, Plaie, Psy`
- **Libellé statut** = un des Statuts RH ci-dessus
- **SERVICE** = un des Services ci-dessus (cohérent avec la Collectivité)
- **Etat** : texte libre plausible, ex. `Consolidé`, `Repris`, `En arrêt`, `Soins terminés`
- **Circonstances** et **Elément matériel** : phrases courtes réalistes et variées (2-3 phrases par circonstance)
- Utilise des agents du roster (Nom/Prénom/Date de naissance/Age cohérents entre eux)

---

## Fichier 2 — `2-document-unique.xlsx` → importer sur `document-unique.html`

Génère **30 lignes** (couvrant plusieurs services et plusieurs niveaux de risque). Colonnes exactes :

`Collectivite | Service | Risques | Taches | Danger | Fq | Gravite | Moyens de prevention existants | Proposition des mesures de prevention | Maitrise du risque`

Valeurs à respecter :
- **Collectivite** : `Ville` ou `Agglomération`
- **Service** = un des Services ci-dessus (cohérent avec Collectivite)
- **Risques** (famille de risque DUERP) — choisis parmi cette liste officielle, en variant beaucoup : `Agressions verbales / physique, Chute de plain-pied, Chute de hauteur, Effondrements et aux chutes d'objets, Circulations Internes, Déplacement dans les locaux, Routiers, Vibrations, Bruit, Activité Physique (TMS), Equipement de travail, Biologique, Produits chimiques, Conduites addictives, Manutention Mécanique, Ambiance thermique, Incendie et Explosion, Electrique, Ambiance Lumineuse, Rayonnements, Travail de nuit, RPS, Animaux, Coactivité, Fluide sous pression, Travail isolé, Travail sur écran, Amiante et aux fibres inhalables, Nanomatériaux et nanoparticules, télétravail et à l'hyperconnexion, Noyade, VSST, Autres`
- **Taches** : tâche/activité concrète où le risque survient (texte libre court, ex. « Tonte des espaces verts en bord de voirie »)
- **Danger** : description concrète du danger pour cette tâche précise (texte libre court)
- **Fq** (fréquence d'exposition) : entier de **1 à 4**
- **Gravite** : entier de **1 à 4**
- Varie les couples Fq/Gravite pour obtenir un mélange de niveaux (quelques 4x4 = critique, plusieurs 3x3, beaucoup de 1-2)
- **Moyens de prevention existants** et **Proposition des mesures de prevention** : texte libre réaliste et cohérent avec le risque
- **Maitrise du risque** : un parmi `OPTIMAL`, `PARTIEL`, `INSUFFISANT` (cohérent : un risque avec Fq×Gravite élevé et peu de moyens de prévention devrait être `INSUFFISANT` ou `PARTIEL`)

---

## Fichier 3 — `3-epi-catalogue.xlsx` → importer sur `epi-dotation.html`, onglet **Catalogue**

⚠️ À importer **avant** le Fichier 7 (Dotations), qui référence ces articles par leur nom.

Génère **12 lignes**. Colonnes exactes :

`Nom | Catégorie | Norme | Durée de vie (mois) | Nombre de lavages max | Fiche technique`

- **Catégorie** : `EPI` ou `Vêtement de travail`
- Remplis **soit** "Durée de vie (mois)" **soit** "Nombre de lavages max" (jamais les deux, laisser l'autre vide) — norme du secteur : casques/harnais/lunettes/gants/masques = durée de vie ; vêtements (vestes, pantalons) = nombre de lavages max
- **Norme** : norme EN réaliste (ex. EN 397, EN ISO 20345, EN 388, EN 166, EN 352, EN 361, EN 149, EN ISO 20471, EN 343, EN ISO 13688...)
- **Fiche technique** : 1-2 phrases décrivant l'usage et la règle de remplacement

---

## Fichier 4 — `4-produits-chimiques.xlsx` → importer sur `produits-chimiques.html`

Génère **15 lignes**. Colonnes exactes :

`Produit | Fournisseur | Collectivité | Service | Quantité | Unité | Pictogrammes | Dernière MAJ FDS | Lien FDS | Mesures de prévention`

- **Pictogrammes** : liste séparée par virgules parmi les codes CLP `GHS01, GHS02, GHS03, GHS04, GHS05, GHS06, GHS07, GHS08, GHS09` (1 à 3 codes par produit, cohérents avec le produit : ex. un désherbant = GHS09/GHS07, un solvant = GHS02/GHS07)
- **Produit/Fournisseur** : noms de produits chimiques d'entretien/technique plausibles (peinture, désherbant, dégraissant, solvant, produit de nettoyage professionnel...) et fournisseurs fictifs (ne pas utiliser de vraies marques)
- **Quantité/Unité** : cohérent (L, kg, bidon de 5L...)
- **Dernière MAJ FDS** : date
- **Lien FDS** : laisser vide ou mettre `(à compléter)`
- **Mesures de prévention** : texte libre (ventilation, EPI requis, stockage...)

---

## Fichier 5 — `5-verifications-periodiques.xlsx` → importer sur `verifications-periodiques.html`

Génère **20 lignes**. Colonnes exactes :

`Équipement | Catégorie | Collectivité | Site | Service | Organisme | Dernière vérification | Conformité | Commentaire`

- **Catégorie** : un parmi `Installations électriques, Extincteurs & moyens de secours incendie, Systèmes de désenfumage / SSI, Ascenseurs & monte-charges, Aires de jeux, Équipements de levage (nacelles, grues), Échafaudages, Portes & portails automatiques, Chaudières & installations de chauffage, Structures gonflables`
- **Site** : nom de bâtiment/site plausible (ex. Hôtel de Ville, Ateliers municipaux, Complexe sportif municipal, Médiathèque, Déchetterie...)
- **Organisme** (bureau de contrôle) : nom fictif plausible (ex. « Contrôle Sud Vérification »)
- **Conformité** : `Conforme` (majorité), `Conforme avec réserves` (quelques-uns), `Non conforme` (1-2)
- **Commentaire** : texte libre court si "Conforme avec réserves" ou "Non conforme"

---

## Fichier 6 — `6-formation-habilitation.xlsx` → importer sur `formation-habilitation.html`

Génère **20 lignes** en réutilisant des agents du roster. Colonnes exactes :

`Nom | Prénom | Collectivité | Service | Type d'habilitation | Organisme formateur | Date d'obtention | Date d'expiration`

- **Type d'habilitation** : varié parmi `CACES R482 (engins de chantier)`, `CACES R486 (nacelles)`, `Habilitation électrique B1V/B2V`, `Habilitation électrique BR`, `SST (Sauveteur Secouriste du Travail)`, `Autorisation de conduite pont roulant`, `Permis de conduire poids lourd`, `Habilitation travail en hauteur`
- **Date d'expiration** : cohérente avec la durée de validité réelle du type d'habilitation (SST = 2 ans, CACES = 5 ans, habilitation électrique = 3 ans...) — mélange volontairement quelques dates déjà expirées ou proches (moins de 2 mois) pour tester les alertes

---

## Fichier 7 — `7-epi-dotation.xlsx` → importer sur `epi-dotation.html`, onglet **Dotation**

⚠️ À importer **après** le Fichier 3 (Catalogue) — chaque ligne référence un article par son nom exact, qui doit déjà exister dans le catalogue.

Génère **20 lignes** en réutilisant des agents du roster et des noms d'articles du Fichier 3. Colonnes exactes :

`Nom | Prénom | Collectivité | Service | Article | Taille | Date de remise`

- **Article** = un `Nom` du fichier 3, **orthographié à l'identique**
- **Taille** : cohérente (pointure pour chaussures, S/M/L/XL pour vêtements, taille unique pour casque/harnais...)

---

## Fichier 8 — `8-registre-sst.xlsx` → importer sur `registre-sst.html`

Génère **15 lignes**. Colonnes exactes :

`Date | Collectivité | Service | Nature | Description | Gravité | Statut | Auteur | Suite donnée | Traité par`

- **Nature** : ex. `Situation dangereuse`, `Presque-accident`, `Non-conformité matériel`, `Ambiance de travail`, `Comportement à risque`
- **Gravité** : un parmi `Faible`, `Moyenne`, `Élevée`
- **Statut** : un parmi `Nouvelle`, `En cours de traitement`, `Traitée`, `Classée sans suite`
- **Auteur** : soit un nom du roster, soit `Anonyme` (mélange les deux, l'anonymat étant une option du registre — un auteur "Anonyme" sera importé comme auteur vide)
- **Suite donnée** / **Traité par** : vide si Statut = `Nouvelle`, rempli sinon (Traité par = un nom RH/manager du roster)

---

## Fichier 9 — `9-sante-visites.xlsx` → importer sur `sante-visites.html`

Génère **15 lignes** en réutilisant des agents du roster. Colonnes exactes :

`Nom | Prénom | Collectivité | Service | Type de visite | Date dernière visite | Périodicité (mois) | Commentaire`

- **Type de visite** : un parmi `Embauche`, `Périodique`, `Reprise`, `Occasionnelle`, `Surveillance renforcée`
- **Périodicité (mois)** : `24` en général, `12` pour les postes à surveillance renforcée

---

## Fichier 10 — `10-inspection-audit.xlsx` → importer sur `inspection-audit.html` (2 étapes)

Ce fichier contient **2 onglets**, à importer dans cet ordre via les deux boutons dédiés de la page (« Importer trames .xlsx » puis « Importer inspections .xlsx ») :

**Onglet 1 — `Trames`** : définit 3 trames de contrôle réutilisables avec leurs points. Colonnes exactes :

`Trame | Point de contrôle | Catégorie`

Propose 3 trames (une ligne par point de contrôle, plusieurs lignes par trame) : par exemple « Inspection Espaces Verts », « Inspection Atelier / Mécanique », « Inspection Locaux administratifs », avec 5-6 points de contrôle chacune (ex. « Rangement et état des outils tranchants » / catégorie `Outillage`).

**Onglet 2 — `Inspections`** : génère **15 lignes d'inspections réalisées**. Colonnes exactes :

`Date | Trame | Collectivité | Service | Inspecteur | Statut global | Points non conformes | Nb points NC`

- **Trame** = le nom exact d'une des 3 trames de l'onglet 1
- **Statut global** : un parmi `Conforme`, `Avec réserves`, `Non conforme` (l'application le recalcule de toute façon à partir du nombre de points non conformes : 0 = Conforme, 1-2 = Avec réserves, 3+ = Non conforme — reste cohérent avec ça)
- **Points non conformes** : liste des libellés de points en non-conformité (recopiés exactement depuis l'onglet 1), séparés par `;` (vide si 0)
- **Inspecteur** = un nom du roster (idéalement RH/manager)

---

## Livraison attendue

- 10 fichiers `.xlsx` nommés comme indiqué, un fichier par lien de téléchargement (le Fichier 10 contient 2 onglets dans le même fichier).
- Si tu ne peux produire qu'un seul fichier à la fois, fais-le dans l'ordre numéroté et attends ma confirmation avant de passer au suivant.
- Ne mélange pas plusieurs tableaux dans une seule feuille : un tableau = une feuille (sauf Fichier 10, qui a 2 onglets, comme précisé).

## Ordre d'import recommandé côté application

1. Fichier 1 (AT/MP) et Fichier 2 (DUERP) en premier — le Plan d'Actions se génère automatiquement à partir des risques DUERP Élevé/Critique et des inspections non conformes.
2. Fichier 3 (catalogue EPI) **avant** Fichier 7 (dotations EPI).
3. Onglet Trames du Fichier 10 **avant** l'onglet Inspections du même fichier.
4. Le reste (4, 5, 6, 8, 9) dans l'ordre que tu veux.
