# VIGIE HSE — Checklist de test manuel avant V1.0

À exécuter par un humain dans un vrai navigateur (je ne peux pas cliquer moi-même dans une interface). Coche au fur et à mesure ; note tout ce qui coince avec le format en bas de page, je m'en occupe ensuite.

## 🔗 Version cliquable en ligne

Depuis le 2026-09-15, ces points existent aussi sur une page où l'on coche vraiment (persistant, y compris depuis le téléphone), avec un champ de note par point pour signaler ce qui coince directement à l'endroit concerné — 116 points au 2026-09-21 :

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

### `PREV1` (permissions granulaires `atmp-admin:write`, `atmp-declare:write`, `accident-analyse:write`, `urgences:write` — rôle de base `ag`, pas RH/admin)
- [ ] Voit "Dossiers AT/MP & CITIS", "Analyse d'accident" et "Situations d'urgence" dans la sidebar (section "Administratif"), et "Déclarer un AT/MP" (section "Espace RH") — alors que le rôle de base est `ag`.
- [ ] Ne voit **pas** "Évaluer un risque" (section "Espace RH") — cette permission n'a pas été accordée, seule la déclaration AT/MP l'a été (vérifie que les deux liens de la section se togglent bien indépendamment).
- [ ] Peut ouvrir un dossier AT/MP & CITIS, cocher/dater les pièces (CMI, prolongations, certificat final, IPP), enregistrer, rouvrir le dossier et retrouver les données.
- [ ] Peut ajouter un arrêté (type + statut + dates), le voir apparaître dans le tableau des arrêtés du dossier.
- [ ] Peut déclarer un AT/MP complet depuis `saisie-rh.html`, le retrouver dans le Registre AT/MP.
- [ ] Peut ouvrir "Analyse d'accident" sur un événement existant, choisir une méthode (tester les 3 : Arbre des causes, 5 Pourquoi, Ishikawa sur des événements différents), ajouter une action corrective, enregistrer, rouvrir et retrouver les données.
- [ ] L'action corrective créée apparaît bien dans **Plan d'Actions** avec l'origine "Analyse".
- [ ] Depuis le Registre AT/MP, cliquer "Analyser" sur une ligne ouvre directement le bon événement dans Analyse d'accident.
- [ ] Peut créer un exercice d'urgence (site, type, date, périodicité) dans "Situations d'urgence", ajouter une action corrective, enregistrer, modifier l'exercice et retrouver les données.
- [ ] L'action corrective créée apparaît bien dans **Plan d'Actions** avec l'origine "Urgence".
- [ ] Le panneau "Prochaine échéance par site & type" affiche correctement le statut (À jour/À programmer/En retard) calculé sur le dernier exercice de chaque site+type — créer un second exercice plus récent pour le même site/type et vérifier que l'échéance se recalcule sur ce dernier, pas sur le premier.
- [ ] Se déconnecter, se reconnecter en `AG2` (sans permission) : les quatre modules/liens doivent être invisibles, et taper les URLs `dossiers-atmp-citis.html` / `accident-analyse.html` / `saisie-rh.html` / `urgences-exercices.html` directement doit rediriger (dashboard ou registre AT/MP selon la page).

### Gestion RH (`RH1`/`RH2` ou `admin` — accès write d'office, pas une permission granulaire pour ces deux rôles)
- [ ] `RH1` voit "Gestion RH" dans la sidebar (section "Administratif") ; onglet "Agents" : créer un agent (nom, prénom, collectivité, service), le retrouver dans le tableau, le modifier, le désactiver (statut passe à "Inactif", disparaît du filtre "Actifs" par défaut).
- [ ] Onglet "Organigramme" : créer un second agent, le réaffecter sous le premier via le sélecteur "Réaffecter" — le rattachement apparaît dans l'arborescence. Vérifier que le sélecteur du premier agent ne propose **pas** le second agent comme responsable (empêcherait une boucle) — pas seulement une alerte après coup, l'option est absente du menu.
- [ ] Onglet "Heures travaillées" : saisir des heures pour un mois/service, les retrouver dans l'historique, les supprimer.
- [ ] Onglet "Indicateurs" : après la saisie d'heures ci-dessus et un AT/MP avec arrêt sur le même mois/service (Registre AT/MP), le TF/TG réel se calcule et s'affiche (pas "—") ; sur une période sans heure saisie, affiche "—" (pas un faux 0).
- [ ] Le sélecteur "Choisir un agent" (roster) apparaît et pré-remplit nom/prénom/service dans les formulaires de `saisie-rh.html`, `sante-visites.html`, `formation-habilitation.html` et `epi-dotation.html` — la saisie libre reste possible si on ne choisit personne.
- [ ] Dans le Registre AT/MP, une ligne "réel : X" apparaît sous le TF/TG estimé une fois des heures saisies pour la période/le service affiché — sans heures saisies, cette ligne reste vide et le TF/TG estimé est inchangé (pas de régression visuelle).
- [ ] Se déconnecter, se reconnecter en `AG2` (sans permission `gestion-rh`) : le lien "Gestion RH" est invisible, et taper l'URL `gestion-rh.html` directement redirige vers `dashboard.html`.

### Santé & Visites — agenda, rendez-vous et convocations (`RH1`/`RH2` ou `admin` ; `manager`/`AG1` en lecture seule)
- [ ] `RH1` ouvre Santé & Visites : trois onglets (Suivi, Agenda & RDV, Modèles de convocation) ; l'onglet Suivi se comporte exactement comme avant. Depuis une ligne du suivi, « Planifier » ouvre l'agenda avec l'agent présélectionné.
- [ ] Créer un rendez-vous (agent, date, heure, lieu, médecin) : il apparaît dans la **bonne case** du calendrier (mois affiché, jour, heure et nom sur la pastille) ; naviguer au mois précédent/suivant et « Aujourd'hui » ; cliquer la pastille pour le modifier, le supprimer.
- [ ] Sur un RDV, « Convocation… » : le texte est rempli avec le nom, la date en clair, l'heure, le lieu ; un champ non renseigné (ex. médecin) affiche « (à préciser) » ; modifier le texte à la main, puis « Copier » (coller dans un mail pour vérifier) et « Imprimer / PDF » (l'aperçu ne contient que la lettre, pas le menu) ; un RDV « À convoquer » passe alors à « Convoqué ».
- [ ] Onglet « Modèles de convocation » : modifier le modèle par défaut, en créer un second, le choisir dans une convocation, le supprimer (le modèle par défaut n'est pas supprimable, mais peut être rétabli à son texte d'origine).
- [ ] Passer un RDV à « Réalisé » : une confirmation propose de mettre à jour la date de dernière visite de l'agent — « Annuler » ne change rien dans le suivi, « OK » met à jour la date et l'échéance du suivi ; supprimer une fiche du suivi supprime aussi ses rendez-vous (le message le précise).
- [ ] Se connecter en `manager` puis `AG1` : l'agenda montre uniquement les RDV des services du compte, sans aucun bouton de création/modification, sans onglet « Modèles de convocation » ; le compteur « RDV à venir (30 j) » du bandeau du haut est cohérent avec l'agenda.

### Entreprises extérieures (`RH1`/`RH2` ou `admin` — accès write d'office ; permission granulaire `entreprises-ext` pour les autres)
- [ ] `RH1` voit "Entreprises extérieures" dans la sidebar (section "Administratif") ; créer une intervention complète (entreprise, nature, site, dates, heures estimées, inspection commune préalable avec date/participants/risques, plan de prévention en texte libre), la retrouver dans le registre, la modifier.
- [ ] Une intervention de **400 h pile** affiche "Obligatoire" dans la colonne "Plan requis" (le seuil est « au moins 400 h », réponse Q8 du préventeur) ; une de 399 h et une de 100 h affichent "Non requis". Deux interventions de la même entreprise (250 h + 200 h) restent chacune "Non requis" — le cumul de 450 h n'apparaît que comme repère indicatif dans le panneau du haut (le seuil s'apprécie par intervention, réponse du préventeur).
- [ ] Cocher "Travaux dangereux" sur une intervention de quelques heures la fait passer à "Obligatoire" (le logiciel ne devine jamais cette liste réglementaire — c'est une case à cocher à la main).
- [ ] Une action corrective ajoutée à une intervention apparaît dans **Plan d'Actions** avec l'origine "Prévention EE" (badge distinct des autres origines).
- [ ] Se déconnecter, se reconnecter en `AG2` (sans permission `entreprises-ext`) : le lien "Entreprises extérieures" est invisible, et taper l'URL `entreprises-exterieures.html` directement redirige vers `dashboard.html`.

### Base documentaire (lecture : tout compte ; rédaction : `RH1`/`RH2`, `admin` ou permission « Peut rédiger »)
- [ ] Depuis n'importe quelle page, le lien « Base documentaire » (section « Ressources » de la sidebar) est visible pour **tous** les comptes (essayer `AG2`) et ouvre la page ; l'onglet « Articles » contient 33 fiches « Familles de risque ».
- [ ] Recherche : taper « amiante », puis « electrique » (sans accent), puis « chute hauteur » (deux mots) — les bonnes fiches ressortent, le titre passe avant le texte ; filtrer par thème ; « Réinitialiser » remet tout.
- [ ] **Trame d'une fiche de risque** : ouvrir une fiche « Familles de risque » — elle présente quatre sections (Définition · Exemples de situation · Le danger · Mesures de prévention) ; seule la définition est remplie, les trois autres affichent « À compléter par le préventeur ». La modifier et remplir les trois sections : elles s'affichent à la place du message. Chercher un mot présent seulement dans « Mesures de prévention » : la fiche ressort bien.
- [ ] En `RH1` : créer un article (titre, thème, mots-clés, texte sur plusieurs lignes) — il s'affiche avec ses retours à la ligne ; le modifier, puis le supprimer. Créer un article en **Brouillon** : `AG2` ne le voit ni dans la liste ni via la recherche. Une fiche « Famille de risque » n'a pas de bouton « Supprimer » (on peut la passer en brouillon ou rétablir son texte d'origine).
- [ ] Onglet « Documents officiels » : ajouter un document (type, référence, version, lien `https://…`) — le lien s'ouvre dans un nouvel onglet ; un lien `javascript:…` ou sans `http(s)://` est refusé avec un message ; filtrer par type/statut ; modifier et supprimer.
- [ ] **Types de document** : dans le panneau « Types de document », ajouter « Fiche de poste » — il apparaît aussitôt dans le formulaire et dans le filtre ; le ressaisir (même en minuscules) est refusé comme doublon. Les types livrés avec l'application sont marqués « exemple » et **n'ont pas de croix de retrait** : ils restent toujours disponibles. Seuls les types ajoutés en ont une — sauf s'ils sont **utilisés** par un document (mention « utilisé »). Retirer un type ajouté le fait disparaître des listes sans toucher aux documents, et **recharger la page : il ne revient pas**.
- [ ] **Masquer un document** : cliquer « Masquer » sur un document — il porte une pastille « Masqué » côté rédacteur, le bouton propose « Afficher ». Se reconnecter en `AG2` : le document a disparu de la liste et n'est plus compté (ni dans « X / Y documents », ni dans la tuile du bandeau). Le repasser en « Afficher » le rend de nouveau visible.
- [ ] **Liens contextuels** : dans le **Document Unique**, une ligne dont la famille de risque est connue affiche une pastille « fiche » qui ouvre la bonne fiche (essayer aussi avec un compte en lecture seule) ; une famille ajoutée à la main dans les référentiels n'affiche pas de pastille. Dans **Évaluer un risque**, choisir une famille fait apparaître « Lire la fiche de ce risque » sous le champ. Ouvrir une adresse `base-documentaire.html?fiche=nimportequoi` affiche un message clair au lieu d'une page vide.
- [ ] `AG2` (sans permission) : aucun bouton de création, de modification ni d'export, mais lecture complète ; donner la case « Peut rédiger » à un compte depuis Administration (badge « Doc · rédacteur ») : ses boutons de rédaction apparaissent à la reconnexion.

### Accueil au poste (`RH1`/`RH2` ou `admin` — accès write d'office ; permission granulaire `accueil-poste` pour les autres)
- [ ] `RH1` voit « Accueil au poste » dans la sidebar (section « Administratif ») ; créer un accueil (agent du sélecteur ou saisie libre, poste, **type d'accueil**, date d'arrivée, référent) : il apparaît dans le tableau en « À faire » avec 0/8, et l'ouvrir montre les 8 points du modèle par défaut.
- [ ] **Délai et alerte** : à la création, le délai proposé est **8 jours** et la date butoir s'affiche sous le champ (arrivée + 8 j). Créer un accueil avec une date d'arrivée d'il y a un mois : la colonne « Échéance » affiche « En retard » avec le dépassement, la tuile « En retard » du bandeau se met à jour et un **panneau rouge apparaît en haut du module** en nommant l'agent. Cocher tous les points : l'échéance devient « Fait hors délai » et le panneau disparaît. Un accueil récent affiche « Dans les délais » avec le J-n restant.
- [ ] **Le délai est figé par accueil** : dans l'onglet « Modèles de parcours », changer le délai par défaut (ex. 30 jours) puis revenir au tableau — les accueils **déjà créés** gardent leur date butoir d'origine ; seul un nouvel accueil part sur 30 jours. Le tri et le filtre de la colonne « Échéance » fonctionnent comme les autres colonnes.
- [ ] **Types d'accueil** : dans Administration → Référentiels → « Types d'accueil au poste », ajouter un type ; il est proposé dans le formulaire d'accueil. Un accueil déjà enregistré avec un type retiré du référentiel garde son type à l'ouverture du formulaire (rien n'est écrasé).
- [ ] Cocher des points : la date du jour et « par RH1 » s'affichent, la jauge et « n/8 » avancent, le statut passe « En cours » puis « Terminé » quand tout est coché ; décocher un point rouvre l'accueil. Ajouter un commentaire sur un point ; ajouter un point « spécifique au poste » (il porte un badge et un bouton « Retirer »).
- [ ] « Imprimer la fiche » : l'aperçu contient uniquement la fiche (identité, **type d'accueil**, points avec ☑/☐, date et auteur, deux zones de signature) et les **trois dates** — arrivée au poste, à réaliser avant le, accueil réalisé le —, pas le menu ; « Enregistrer au format PDF » fonctionne.
- [ ] Onglet « Modèles de parcours » : modifier un point du modèle par défaut, créer un second modèle (ajouter, réordonner ↑↓, retirer des points), l'utiliser pour un nouvel accueil ; vérifier que **modifier le modèle ensuite ne change pas un accueil déjà créé**. Le modèle par défaut n'est pas supprimable mais peut être rétabli à son texte d'origine.
- [ ] Se connecter en `manager` avec la permission « Accueil au poste : lecture seule » (à donner depuis Administration) : les accueils de son périmètre sont visibles et ouvrables, les cases sont grisées, aucun bouton de création/modification/suppression, pas d'onglet « Modèles de parcours » ; sans permission, le lien est absent et taper l'URL `accueil-poste.html` redirige vers `dashboard.html`.

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
- [ ] Situations d'urgence (`urgences-exercices.html`)
- [ ] Gestion RH (`gestion-rh.html`)
- [ ] Entreprises extérieures (`entreprises-exterieures.html`)

### Tri & filtres de colonne (Registre AT/MP)
- [ ] Cliquer sur l'intitulé d'une colonne trie la table ; un 2ᵉ clic inverse le sens, un 3ᵉ revient à l'ordre d'origine (date décroissante). Une flèche indique le sens.
- [ ] Trier « Jours d'arrêt » : les nombres se classent bien numériquement (4, 5, 7, 8… et pas 10 avant 4), et les lignes sans arrêt (« — ») restent **en bas dans les deux sens**.
- [ ] Cliquer sur l'entonnoir d'une colonne ouvre un panneau avec les valeurs distinctes et leur nombre ; décocher des valeurs filtre la table immédiatement et l'entonnoir devient coloré.
- [ ] Filtrer sur deux colonnes en même temps : les deux filtres se cumulent.
- [ ] En ouvrant l'entonnoir d'une **autre** colonne, les valeurs proposées tiennent compte du filtre déjà actif ; en rouvrant celui de la colonne **déjà filtrée**, toutes ses valeurs restent proposées.
- [ ] Le compteur « X affichés sur Y » et les KPI du haut de page suivent bien les filtres de colonne.
- [ ] Le bouton « Réinitialiser » efface aussi le tri et les filtres de colonne. Sur chaque page à filtres (Plan d'actions, Santé, Registre SST, Vérifications, Inspections, Produits chimiques, Formations, Accidents, Dossiers AT/MP, Urgences, Entreprises extérieures) : choisir une collectivité **et** un service, puis « Réinitialiser » — le filtre **Service** doit bien revenir à « Tous les services », pas rester sur le service choisi.
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
