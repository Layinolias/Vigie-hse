# VIGIE HSE — Checklist de test manuel avant V1.0

À exécuter par un humain dans un vrai navigateur (je ne peux pas cliquer moi-même dans une interface). Coche au fur et à mesure ; note tout ce qui coince avec le format en bas de page, je m'en occupe ensuite.

## 🔗 Version cliquable en ligne

Depuis le 2026-09-15, ces 63 points existent aussi sur une page où l'on coche vraiment (persistant, y compris depuis le téléphone), avec un champ de note par point pour signaler ce qui coince directement à l'endroit concerné :

**https://claude.ai/artifact/NJNe2DQgKFo3gvDfrtYPaf**

Ce fichier-ci reste la version de référence (diff dans l'historique du dépôt) ; c'est la page en ligne qu'il faut utiliser pour dérouler le passage de recette.

**URL à tester :** `https://layinolias.github.io/Vigie-hse/`

---

## 0. Préparation

- [ ] Ouvrir le site dans un **onglet de navigation privée** au début de chaque section de test (évite de mélanger les données laissées par un test précédent).
- [ ] Avoir sous la main les 6 comptes (visibles sur la page d'accueil elle-même) : `admin@verchamps.fr`/`admin1234`, `manager@verchamps.fr`/`manager1234`, `RH1`/`RH2` /`1234`, `AG1`/`AG2`/`1234`.

## 1. Page d'accueil (avant connexion)

- [ ] `index.html` (l'URL racine) s'affiche sans erreur, sans passer par l'écran de connexion.
- [ ] La grille des 11 modules est complète et lisible.
- [ ] Le bouton "Accéder à la démonstration" mène bien à l'écran de connexion.
- [ ] Le bouton "Réinitialiser les données de démonstration" fonctionne (demande confirmation, puis redirige vers la connexion).
- [ ] Basculer le thème du système (clair/sombre) et recharger la page : les couleurs suivent bien.

## 2. Connexion

- [ ] Connexion avec chacun des 6 comptes fonctionne (mauvais mot de passe = message d'erreur clair, pas un plantage).
- [ ] Après connexion, arrivée sur `dashboard.html` (le cockpit), pas une erreur ou une page blanche.
- [ ] Déconnexion puis reconnexion avec un autre compte : les données affichées changent bien selon le rôle (voir §3).

## 3. Parcours complet par rôle

Pour chaque rôle, vérifier que le menu latéral affiche les bons modules et qu'aucun clic ne mène à une erreur.

### `admin` (admin@verchamps.fr)
- [ ] Voit tous les modules, y compris **Administration** et **Indicateurs & Reporting**.
- [ ] Dans **Administration** : créer un utilisateur test, modifier son rôle, le désactiver, le supprimer — sans erreur.
- [ ] Dans **Administration** → Référentiels : ajouter un élément à une liste (ex. un service), vérifier qu'il apparaît dans un formulaire d'un autre module (ex. Déclarer un AT/MP).
- [ ] Dans **Administration** : publier une actualité Flash Info, vérifier qu'elle apparaît sur le cockpit.
- [ ] Dans **Administration** → Veille réglementaire : ajouter une actualité, vérifier qu'elle apparaît sur le cockpit ; passer son statut à "Archivé", vérifier qu'elle disparaît du cockpit (mais reste visible/éditable dans Administration).
- [ ] Tester le bouton "Réinitialiser la démonstration" dans Administration (⚠️ à faire en dernier, ça remet tout à zéro).

### `rh` (RH1)
- [ ] Voit tous les modules métier, **pas** Administration ni Indicateurs & Reporting (lien absent du menu).
- [ ] Créer une déclaration AT/MP complète, la retrouver dans le registre, la modifier, la supprimer.
- [ ] Créer une évaluation DUERP, vérifier qu'elle apparaît dans le Document Unique avec le bon niveau de risque calculé.
- [ ] Créer une inspection dans Inspection/Audit avec au moins un point "Non conforme", vérifier qu'une action apparaît automatiquement dans Plan d'Actions.
- [ ] Exporter un module en Excel (le fichier se télécharge et s'ouvre).
- [ ] Exporter le Document Unique ou le Registre AT/MP en PDF (le dialogue d'impression s'ouvre, aperçu correct).

### `manager` (manager@verchamps.fr — scopé Voirie + Espace Vert)
- [ ] Ne voit que les données des services Voirie/Espace Vert dans les modules concernés (Registre AT/MP, Document Unique, Plan d'Actions, etc.) — pas les autres services.
- [ ] Ne peut pas créer/modifier/supprimer (lecture seule), sauf dans **Registre Santé & Sécurité** où il peut déposer une observation.
- [ ] Ne voit ni Administration ni Indicateurs & Reporting.

### `ag` (AG1)
- [ ] Voit toutes les données (tous services), lecture seule uniquement.
- [ ] Les colonnes personnelles (nom, prénom, date de naissance) sont masquées ou affichées "—" dans le Registre AT/MP.
- [ ] Peut déposer une observation dans le Registre Santé & Sécurité, en cochant "anonyme" si souhaité.
- [ ] Ne voit **pas** le lien "Dossiers AT/MP & CITIS" dans la sidebar (module 18, accès par permission granulaire — voir ci-dessous).

### `PREV1` (permissions granulaires `atmp-admin:write`, `atmp-declare:write`, `accident-analyse:write` — rôle de base `ag`, pas RH/admin)
- [ ] Voit "Dossiers AT/MP & CITIS" et "Analyse d'accident" dans la sidebar (section "Administratif"), et "Déclarer un AT/MP" (section "Espace RH") — alors que le rôle de base est `ag`.
- [ ] Ne voit **pas** "Évaluer un risque" (section "Espace RH") — cette permission n'a pas été accordée, seule la déclaration AT/MP l'a été (vérifie que les deux liens de la section se togglent bien indépendamment).
- [ ] Peut ouvrir un dossier AT/MP & CITIS, cocher/dater les pièces (CMI, prolongations, certificat final, IPP), enregistrer, rouvrir le dossier et retrouver les données.
- [ ] Peut ajouter un arrêté (type + statut + dates), le voir apparaître dans le tableau des arrêtés du dossier.
- [ ] Peut déclarer un AT/MP complet depuis `saisie-rh.html`, le retrouver dans le Registre AT/MP.
- [ ] Peut ouvrir "Analyse d'accident" sur un événement existant, choisir une méthode (tester les 3 : Arbre des causes, 5 Pourquoi, Ishikawa sur des événements différents), ajouter une action corrective, enregistrer, rouvrir et retrouver les données.
- [ ] L'action corrective créée apparaît bien dans **Plan d'Actions** avec l'origine "Analyse".
- [ ] Depuis le Registre AT/MP, cliquer "Analyser" sur une ligne ouvre directement le bon événement dans Analyse d'accident.
- [ ] Se déconnecter, se reconnecter en `AG2` (sans permission) : les trois modules/liens doivent être invisibles, et taper les URLs `dossiers-atmp-citis.html` / `accident-analyse.html` / `saisie-rh.html` directement doit rediriger (dashboard ou registre AT/MP selon la page).

### Visibilité des données par tableau (tous rôles)
Ajouté le 2026-09-15 : le point "les données affichées changent bien selon le rôle" (§2) n'avait été vérifié en détail que sur le Registre AT/MP. Un point par module à tableau pour couvrir le reste — même geste à chaque fois : se connecter avec au moins deux comptes de rôles différents (ex. `RH1` puis `AG1`, ou `manager`) et vérifier que les lignes/colonnes affichées sont cohérentes avec le périmètre du rôle (scope service pour `manager`, colonnes personnelles masquées pour `ag`, etc. — voir §3 ci-dessus pour le détail attendu par rôle).
- [ ] Registre AT/MP (`registre-at-mp.html`) — déjà vérifié en détail le 2026-09-15.
- [ ] Document Unique (`document-unique.html`)
- [ ] Plan d'Actions (`plan-actions.html`)
- [ ] Santé & Visites (`sante-visites.html`)
- [ ] Registre Santé & Sécurité (`registre-sst.html`)
- [ ] Vérifications Périodiques (`verifications-periodiques.html`)
- [ ] Inspection / Audit (`inspection-audit.html`)
- [ ] Produits Chimiques (`produits-chimiques.html`)
- [ ] Formation / Habilitation (`formation-habilitation.html`)
- [ ] EPI & Dotation (`epi-dotation.html`)
- [ ] Dossiers AT/MP & CITIS (`dossiers-atmp-citis.html`)
- [ ] Analyse d'accident (`accident-analyse.html`)

### Tri & filtres de colonne (Registre AT/MP)
- [ ] Cliquer sur l'intitulé d'une colonne trie la table ; un 2ᵉ clic inverse le sens, un 3ᵉ revient à l'ordre d'origine (date décroissante). Une flèche indique le sens.
- [ ] Trier « Jours d'arrêt » : les nombres se classent bien numériquement (4, 5, 7, 8… et pas 10 avant 4), et les lignes sans arrêt (« — ») restent **en bas dans les deux sens**.
- [ ] Cliquer sur l'entonnoir d'une colonne ouvre un panneau avec les valeurs distinctes et leur nombre ; décocher des valeurs filtre la table immédiatement et l'entonnoir devient coloré.
- [ ] Filtrer sur deux colonnes en même temps : les deux filtres se cumulent.
- [ ] En ouvrant l'entonnoir d'une **autre** colonne, les valeurs proposées tiennent compte du filtre déjà actif ; en rouvrant celui de la colonne **déjà filtrée**, toutes ses valeurs restent proposées.
- [ ] Le compteur « X affichés sur Y » et les KPI du haut de page suivent bien les filtres de colonne.
- [ ] Le bouton « Réinitialiser » efface aussi le tri et les filtres de colonne.
- [ ] Le panneau se ferme en cliquant ailleurs, avec Échap, ou en faisant défiler la page — et reste toujours entièrement visible à l'écran, y compris sur une fenêtre étroite.
- [ ] En thème sombre, le panneau est bien lisible (fond sombre, texte clair).
- [ ] Se connecter en `AG2` (moins de colonnes visibles) : le tri d'une colonne trie bien **cette** colonne (pas de décalage).

## 4. Fonctionnalités transverses

- [ ] **Météo** (topbar) : au premier chargement, aucune demande de géolocalisation — le widget affiche "Choisir une ville". Cliquer dessus ouvre une popover de recherche ; taper un nom de ville affiche des résultats (nom + région + pays) ; en choisir un met à jour la météo et se souvient du choix au rechargement (localStorage). Le lien "Voir sur Météo France" dans la popover fonctionne toujours.
- [ ] **Score HSE** (topbar) : cliquer dessus fait défiler la page jusqu'au détail, sans que la barre du haut ne le cache.
- [ ] **Sélecteur Ville/Agglomération/Tous** (topbar, cockpit) : change bien les chiffres affichés sur le tableau de bord.
- [ ] **Menu latéral** : se réduit/étend correctement au survol sur grand écran ; devient un tiroir accessible via le bouton menu sur petit écran (voir §5).
- [ ] **Import Excel** (disponible sur tous les modules désormais, pas seulement AT/MP et Document Unique) : importer un fichier volontairement invalide (mauvais format, colonnes manquantes) → message d'erreur clair, pas de plantage silencieux.
- [ ] **Auto-chargement DATATEST** : sur le site déployé (pas en local), chaque module se remplit tout seul au chargement avec les données de `DATATEST/` (pas de bouton à cliquer). Vérifier qu'un rechargement ne duplique pas les lignes (IDs stables `dtst-*`).
- [ ] **Centrage du contenu** : sur un écran large (>1500px), le contenu de chaque page est centré horizontalement dans la zone principale (pas collé à gauche sous le menu latéral).

## 5. Responsive / mobile

À tester soit sur un vrai téléphone, soit via les outils de développement du navigateur (mode "appareil mobile", F12).

- [ ] Largeur ~375px (téléphone) : le menu latéral se cache, le bouton hamburger l'ouvre en tiroir par-dessus le contenu.
- [ ] Aucun tableau ne force la page entière à défiler horizontalement (seul le tableau lui-même doit défiler, dans son propre cadre).
- [ ] La topbar (météo/score/sélecteur/horloge) reste utilisable sans élément coupé ou superposé.
- [ ] Les formulaires de création (Déclarer un AT/MP, Évaluer un risque, etc.) restent utilisables en une colonne.

## 6. Multi-navigateur

Refaire au moins le parcours §2 + une création de donnée (§3, section `rh`) sur chacun de :
- [ ] Chrome (ou Edge, moteur identique)
- [ ] Firefox
- [ ] Safari (si accès à un Mac/iPhone)

## 7. Regard extérieur

- [ ] Montrer le site à quelqu'un qui n'a pas suivi le projet (idéalement quelqu'un du métier HSE/RH) sans lui expliquer où cliquer — noter où il/elle hésite ou se perd.

---

## Comment remonter un problème

Pour chaque souci trouvé, un message avec :
- **Où** : quelle page/quel module
- **Qui** : quel rôle/compte utilisé
- **Quoi** : ce qui était attendu vs. ce qui s'est passé
- **Navigateur** : lequel (si pertinent)

Pas besoin de formulation parfaite — même "le bouton export PDF sur le registre AT/MP ne fait rien avec RH1" suffit, je creuserai.
