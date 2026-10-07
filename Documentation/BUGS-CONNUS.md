# VIGIE HSE — Bugs et écarts connus

Trace des problèmes concrets remontés en test manuel, pour garder — dans le dépôt, pas seulement dans les notes d'une checklist en ligne — la mémoire de ce qui a coincé, depuis quand, et depuis quand c'est corrigé. Un point réglé reste dans ce fichier avec sa date/commit de correction plutôt que d'être supprimé.

---

## Corrigés

### 1. Le popover de sélection de ville (météo) ne se fermait jamais
- **Où** : `dashboard.html`, topbar, widget météo.
- **Remonté** : 2026-09-15, checklist QA V1 §4 (Météo).
- **Constaté** : le popover restait ouvert dans tous les cas (y compris au chargement initial de la page, avant toute interaction) — pas seulement après avoir choisi une ville.
- **Cause** : `.weather-popover` avait un `display:flex` inconditionnel en CSS, sans règle `.weather-popover[hidden]{ display:none; }` — une déclaration d'auteur avec `display` explicite l'emporte toujours sur la règle du navigateur pour l'attribut `hidden`, donc le toggle JS (déjà correct) n'avait aucun effet visuel.
- **Corrigé** : 2026-09-15 — ajout de la règle CSS manquante.

### 2. Superposition dans la topbar à largeur réduite (météo/sélecteur de zone sur le Score HSE)
- **Où** : `dashboard.html`, topbar (météo, Score HSE, sélecteur Ville/Agglomération/Tous).
- **Remonté** : 2026-09-15, checklist QA V1 §4 et §5 — chevauchement constaté après réduction de la largeur de fenêtre, avant le seuil mobile.
- **Cause** : le seuil qui empile le sélecteur de zone sur sa propre ligne (et libère de la place) ne se déclenchait qu'à `max-width:640px`, alors qu'un chevauchement net apparaissait dès ~680-900px de large — zone intermédiaire sans mitigation.
- **Corrigé** : 2026-09-15 — le seuil d'empilement est avancé à `max-width:900px` (fusionné avec le seuil déjà existant qui allégeait le texte secondaire à cette largeur).

### 3. Import Excel absent sur 2 modules
- **Où** : `dossiers-atmp-citis.html`, `accident-analyse.html`.
- **Remonté** : 2026-09-15, checklist QA V1 §4 (Import Excel) — export présent sur ces deux modules, import absent, alors que la checklist elle-même affirmait l'import disponible partout.
- **Corrigé** : 2026-09-15 — import ajouté sur le même modèle que `registre-at-mp.html` (bouton à côté de l'export, dédoublonnage par ID, résumé ajouté/mis à jour/ignoré) :
  - `dossiers-atmp-citis.html` : réimporte les 2 feuilles exportées ("Dossiers", "Arretes"), rattachées à l'événement AT/MP via une nouvelle colonne "ID AT/MP" ajoutée à l'export (avec repli sur nom + date si absente d'un fichier plus ancien).
  - `accident-analyse.html` : **périmètre volontairement limité** — le modèle de données d'une analyse est arborescent (faits, chaîne de pourquoi, 5 familles Ishikawa, actions imbriquées), mal adapté à un aller-retour fidèle par tableur. Seuls les champs plats déjà présents dans l'export (méthode, conclusion, date d'analyse, auteur, feuille "Actions" séparée) sont ré-importés ; l'arbre causal ne l'est pas. À revoir si le besoin d'un aller-retour complet se confirme.

### Le texte des enregistrements était interprété comme du HTML dans toutes les pages de données
- **Où** : les seize pages qui affichent des enregistrements — Registre AT/MP, Document Unique, cockpit, Administration, et les douze modules de suivi.
- **Remonté** : 2026-09-23, en relisant le Registre AT/MP avant d'y ajouter un lien contextuel.
- **Constaté** : une sonde jsdom a injecté `<img src=x onerror=…>` dans chaque champ, enregistrement par enregistrement. Sur le seul Registre AT/MP, **16 champs sur 16** produisaient une vraie balise active (nom, prénom, risque, circonstances, service, siège, nature, élément matériel, état, jour, grade, catégorie, collectivité, statut d'arrêt, avis médecin, et jusqu'à une date non conforme).
- **Cause** : aucune de ces pages ne disposait d'un assistant d'échappement ; les gabarits interpolaient directement `${r.champ}` dans `innerHTML`. Les données arrivent par import Excel, par les formulaires de saisie et par les référentiels — aucune n'est de confiance. Les composants partagés, eux, étaient sains (`assets/tri-filtres.js` construit ses panneaux avec `createElement`/`textContent`).
- **Corrigé** : 2026-09-23 — commits `0fad9f7` (Registre AT/MP et Document Unique) et `445d67a` (les quatorze autres). Chaque page déclare `esc()` et l'applique à toutes ses interpolations de texte. Vérifié page par page : plus aucun élément injecté, et le corps rendu avec des données normales est identique au caractère près à celui d'avant.

### Le module Situations d'urgence était toujours vide en démonstration
- **Où** : `urgences-exercices.html`, chargement automatique des données de démonstration.
- **Remonté** : 2026-09-23, par le contrôle « aucune erreur JS en usage normal » du plan de version V1.
- **Constaté** : la page demande `DATATEST/11-REF-urgences-exercices.xlsx` à chaque visite ; le fichier n'existait pas (404 sur le site déployé). L'erreur étant avalée par un `.catch(() => {})`, rien ne le signalait — sinon une erreur réseau rouge dans la console du navigateur et un module vide pendant les démonstrations.
- **Cause** : le fichier de démonstration n'avait jamais été produit lors de la livraison du module 16.
- **Corrigé** : 2026-09-23 — fichier créé (13 exercices, trois types, deux collectivités, les trois statuts d'échéance représentés). Vérifié : import complet, pas de doublon au rechargement.

### Les échéances s'affichaient un jour trop tôt quand elles tombaient en heure d'été
- **Où** : `assets/echeance.js` (Formation & Habilitation, Santé & Visites, Situations d'urgence, Vérifications périodiques) et le renouvellement des dotations d'`epi-dotation.html`.
- **Remonté** : 2026-09-23, pendant l'audit des exports du plan de version V1.
- **Constaté** : une date d'hiver plus une périodicité tombant en heure d'été affichait la veille, à toute heure et pour tout utilisateur en France — 2026-01-20 + 6 mois → 2026-07-19. Quatre échéances des données de démonstration étaient concernées.
- **Cause** : la date était lue en UTC (`new Date("AAAA-MM-JJ")`), décalée en mois à l'heure locale, puis réécrite en UTC (`toISOString()`) : l'heure d'été retirait une heure de trop et faisait reculer d'un jour.
- **Corrigé** : 2026-09-23 — lecture et écriture à l'heure locale (`assets/dates-locales.js`). Vérifié dans six fuseaux (Paris, Martinique, Réunion, Nouméa, Auckland, UTC) et en comparant avant/après les cinq pages sur les vraies données : 912 cellules, seules les 4 échéances fautives changent, d'exactement +1 jour. Une date illisible lève la même erreur qu'avant.

### Un registre vide s'exportait en fichier Excel blanc
- **Où** : les 27 feuilles d'export Excel de 17 pages.
- **Remonté** : 2026-09-23, par l'audit des exports du plan de version V1.
- **Constaté** : sans aucune fiche, le fichier exporté n'avait même pas la ligne d'en-têtes — impossible de s'en servir comme modèle pour un import. Le nom du fichier pouvait aussi porter la date de la veille entre minuit et 2 h.
- **Corrigé** : 2026-09-23 — chaque export déclare ses colonnes ; nom de fichier daté à l'heure locale. Vérifié : les 41 feuilles vides ont désormais leurs en-têtes, et l'ordre des colonnes des 55 feuilles non vides est strictement identique à avant (les fichiers existants et les réimports ne bougent pas).

### La date du jour était la veille entre minuit et 2 h du matin
- **Où** : 18 pages, 61 endroits — dates préremplies des formulaires de création, dates de création des fiches, date d'une suite donnée (Registre SST), borne de fin par défaut du Reporting, échéances et dates des actions générées du Plan d'actions, données de démonstration datées « il y a n jours ».
- **Remonté** : 2026-09-23, pendant la correction des échéances (même cause).
- **Constaté** : `new Date().toISOString().slice(0,10)` formate la date en UTC. En France (UTC+1/+2), entre minuit et 2 h, cela donnait la veille : une fiche créée à 0 h 30 était datée de la veille, et le Reporting excluait par défaut les événements du jour. Sans effet le reste de la journée.
- **Corrigé** : 2026-09-23 — `VigieDates.aujourdhui()` et `VigieDates.iso(date)` (`assets/dates-locales.js`) partout ; les imports Excel, qui passaient déjà par les champs locaux de la date, n'étaient pas concernés. Vérifié par un rendu avant/après de chaque page avec deux comptes, horloge figée : **à l'heure UTC, 48 rendus sur 48 strictement identiques** (le changement ne modifie rien là où local = UTC) ; **à 0 h 30 à Paris le 24**, 24 rendus changent et **uniquement par des dates avancées d'exactement un jour** (formulaires préremplis au 24 au lieu du 23, période par défaut du Reporting se terminant le 24). Le harnais avait d'abord été rejoué sur le code inchangé : 0 différence.

### Un navigateur qui refuse le stockage arrêtait la plupart des pages
- **Où** : toutes les pages. **Remonté** : 2026-09-23, en éprouvant `assets/stockage.js` en « navigation privée stricte ».
- **Constaté** : quand le navigateur refuse tout stockage (cookies bloqués, certaines navigations privées, postes verrouillés), 44 rendus de page sur 48 s'arrêtaient sur une erreur.
- **Corrigé** : 2026-09-23 — `VigieStore` bascule sur une mémoire de page et un bandeau prévient que rien ne sera conservé. Vérifié : les 24 pages s'affichent sans erreur, bandeau présent une fois ; en stockage normal, rendu strictement identique à avant (48/48).

### Dossiers AT/MP & CITIS : un export réimporté perdait des données
- **Où** : `dossiers-atmp-citis.html`, export et import. **Remonté** : 2026-09-23, par l'aller-retour export → import de tous les modules importables (13 sur 14 sans perte).
- **Constaté** : l'export ne donnait que le nombre de prolongations et omettait les dates et références (certificat final, IPP, enquête) ; un réimport ramenait donc des dossiers sans prolongations ni ces dates. Pire, **réimporter un fichier qui n'avait pas ces colonnes effaçait les valeurs déjà enregistrées**, et une vraie date Excel s'enregistrait en texte (« Mon Mar 02 2026… »).
- **Corrigé** : 2026-09-23 — colonnes ajoutées en fin de feuille, feuille « Prolongations » ; une colonne absente ne modifie plus rien ; dates Excel lues comme des dates. Vérifié : test dédié 9/9, en échec 7 fois sur 9 sur la version précédente ; aller-retour sans perte.

### Un CSV importé pouvait arriver avec des accents cassés, sans erreur
- **Où** : tous les imports (28 lectures de fichier, 14 pages). **Remonté** : 2026-09-23, en testant « tout type de fichier » (réponse du préventeur, question 13).
- **Constaté** : SheetJS lisait un CSV octet par octet. Un CSV UTF-8 sans BOM (LibreOffice, la plupart des logiciels) donnait « PropretÃ© », et « Agglomération » devenait méconnaissable, donc remplacée par « Ville » — l'import annonçait pourtant un succès. Un CSV Windows-1252 (Excel français) perdait « — », « ’ », « œ », « € ».
- **Corrigé** : 2026-09-23 — `assets/import-fichier.js` décode le texte avant lecture ; `.ods` accepté. Vérifié : 7 variantes, 7/7 correctes (3/7 avant).

### Stockage plein : une saisie refusée était perdue sans message
- **Où** : toutes les pages. **Remonté** : 2026-09-23, en mesurant le volume d'un historique complet (réponse du préventeur, question 13).
- **Constaté** : au-delà d'environ 5 millions de caractères, le navigateur refuse l'écriture ; la plupart des pages enveloppent leur enregistrement dans un `try/catch` muet.
- **Corrigé** : 2026-09-23 — `VigieStore.setItem` affiche un bandeau et relance l'erreur. Vérifié : quota réduit en jsdom, bandeau affiché une fois ; rendu de chaque page identique en usage normal (48/48).

### Analyse d'accident : réimporter un fichier dupliquait les actions correctives
- **Où** : `accident-analyse.html`, import. **Remonté** : 2026-09-23, en rendant l'arbre causal importable.
- **Constaté** : chaque import ajoutait les actions du fichier à celles déjà enregistrées — deux imports du même fichier donnaient trois fois la même action, reprise d'autant dans le Plan d'actions.
- **Corrigé** : 2026-09-23 — une action de même description est mise à jour, en gardant son identifiant. Vérifié : test de réimport 5/5 ; sur la version précédente, 3 actions au lieu d'une.

### Serveur de prévisualisation : les fichiers cachés du dépôt étaient servis
- **Où** : `Documentation/outils/serveur-local.js`. **Remonté** : 2026-09-24, en écrivant le serveur P1a.
- **Constaté** : http://localhost:8765/.git/config renvoyait la configuration git — dont l'adresse du dépôt distant avec son jeton d'accès. Limité à ce poste (le serveur n'écoute que 127.0.0.1), mais inutile de l'exposer.
- **Corrigé** : 2026-09-24 — les chemins commençant par un point et le dossier `serveur/` (la base) renvoient 404, comme dans `serveur/serveur.js`. Vérifié : `/.git/config` et `/serveur/serveur.js` → 404, les pages → 200.

### Référentiels : ouvrir le Document Unique effaçait la liste des types d'accueil
- **Où** : `document-unique.html`, `saisie-duerp.html`, `saisie-rh.html`, `administration.html` (chargement des référentiels). **Remonté** : 2026-09-24, en mesurant les écritures du serveur — les référentiels étaient réécrits deux fois à chaque passage sur les pages.
- **Constaté** : ces quatre pages reconstruisaient `vigie_hse_referentials` avec leurs seules valeurs par défaut et en retiraient les listes qu'elles ne connaissent pas — dont « Types d'accueil au poste » : une modification faite dans Administration disparaissait dès qu'on ouvrait le Document Unique, et la page Accueil au poste remettait la liste par défaut. Même effet en mode navigateur.
- **Corrigé** : 2026-09-24 — elles partent de ce qui est stocké, comme les quinze autres pages. Vérifié : plus aucune réécriture des référentiels au passage sur les 23 pages ; en mode navigateur, 8 listes conservées au lieu de 7.

### Données de santé transmises à des comptes qui ne devaient pas les voir
- **Où** : serveur (`serveur/serveur.js`, `anonymisation.js`, `perimetre.js`), `saisie-rh.html`. **Remonté** : 2026-09-27, en dressant la liste des données collectées.
- **Constaté** : (1) le journal de saisie AT/MP, copie complète de chaque déclaration (nom, date de naissance, lésion, avis médicaux), n'était pas marqué « santé » : un compte anonymisé le recevait, et un manager y lisait les accidents des autres services ; (2) le journal d'audit, dont les lignes nomment les agents, allait aux comptes anonymisés ; (3) tout compte connecté recevait tous les registres — un agent avait dans sa page le registre AT/MP complet, les dossiers et les analyses, que son écran masquait. Au passage : le fil de la page de saisie insérait le siège de la lésion sans `esc()`.
- **Corrigé** : 2026-09-27 — droits de lecture appliqués par le serveur (`serveur/lecture.js`, `PLAN-MISE-EN-PRODUCTION.md` §4 quinquies), journal de saisie marqué « santé » et retiré aux comptes anonymisés avec le journal d'audit, périmètre étendu aux lignes de journal, siège échappé. Vérifié : 130 affichages sur 150 identiques au caractère près pour six comptes, les 20 autres expliqués ; `test-lecture.js` 22/22. Décision de métier sur le suivi médical rendue le 2026-09-29 (question 17 : l'encadrement seulement) et mise en œuvre le même jour.

---

### Sur téléphone, tout était minuscule : aucune page ne s'adaptait

- **Remonté** : 2026-09-15 (checklist §5), comme une demande de confort — « augmenter la taille des titres et du menu côté mobile ».
- **Cause** (trouvée le 2026-09-29) : aucune page n'avait de balise `<meta name="viewport">`. Un téléphone les affichait donc comme un écran d'ordinateur de 980 px réduit à sa largeur, et aucune des règles prévues pour les petits écrans ne s'appliquait — elles n'avaient jamais été vues sur un vrai téléphone.
- **Corrigé** : balise ajoutée aux 26 pages ; `assets/mobile.css` agrandit le menu et les titres sur téléphone ; trois débordements révélés par la vraie largeur corrigés (liste « Type d'habilitation » des Formations, fil d'Ariane trop long sur deux pages, badge de rôle et horloge qui passaient sur la météo et le score dans la barre du tableau de bord — masqués sur téléphone, le pied du menu garde le compte et son rôle). Mesuré : 24 pages × 375 et 768 px, ni débordement ni chevauchement ; sur ordinateur, tailles et mode de rendu inchangés.

### Toutes les pages étaient rendues en mode « quirks » (pas de `<!doctype html>`)

- **Où** : les 26 pages. **Remonté** : 2026-09-29, constaté en posant la balise `viewport`.
- **Constaté** : aucune page ne commençait par `<!doctype html>` ; tous les navigateurs les rendaient donc en mode de compatibilité avec les très vieux sites (`document.compatMode === "BackCompat"`), dont les règles de mise en page diffèrent du standard.
- **Corrigé** : 2026-09-29 — `<!doctype html>` en première ligne des 26 pages, **sans changement visible**. Mesure avant/après avec Edge sans fenêtre, 26 pages × 1 400 et 375 px, session administrateur, horloge figée : position, taille, police et styles calculés de chaque élément, feuilles de style, capture d'écran ; puis la même mesure en forçant l'affichage de tout ce qui est masqué (fenêtres de saisie, autres onglets). Trois différences du mode « quirks » ont été reproduites dans le `<style>` des pages concernées : la marge basse de 1 em des formulaires (20 pages, 16 px), l'absence de jour sous une zone de texte seule sur sa ligne (14 pages, 4 px), et la hauteur d'une ligne qui ne contient qu'un élément sans texte (pastille de catégorie du Registre AT/MP, bouton « Vider le journal » des deux pages de saisie, lien de réinitialisation de la vitrine, étiquettes de services et libellé « Rattachement aux services » de l'Administration). Écarts restants, acceptés : le pied de page du Document Unique et du Registre AT/MP (bouton « Réinitialiser… » seul sur la dernière ligne : +4,5 px en bas de page — le compenser forcerait ce bouton sur sa propre ligne sur les grands écrans), la cellule de rôle d'un compte qui passe sur deux lignes (PREV1 à 1 400 px : ±1,5 px), et un liseré de 1 px entre deux en-têtes de colonne des Produits chimiques, défaut d'affichage que le mode standard ne peint plus.

### Revue générale du 2026-09-30 : ce que le premier échappement avait laissé passer
- **Où** : 16 pages ; `serveur/serveur.js`, `serveur/droits.js`. **Remonté** : 2026-09-30, revue de sécurité de tout le code.
- **Constaté** (sonde : toutes les pages × quatre comptes, chaque texte piégé, référentiels et organisation compris) : 20 gabarits injectables et 28 sorties d'attribut. Identifiants bruts dans `data-id`/`data-edit` (Registre AT/MP, Plan d'actions, Gestion RH, Entreprises extérieures) — en mode serveur, un compte qui ne peut que déclarer un AT/MP pouvait y glisser du code exécuté chez le RH qui ouvre le registre ; Plan d'actions presque entier (service, origine, responsable, échéance, priorité, statut) ; noms d'articles EPI, pictogrammes des produits ; lien « Lire l'article » de la veille acceptant `javascript:` ; les 17 listes de services, où un nom contenant `"` coupait la valeur (**bug visible** : filtrer sur `Atelier "Nord"` ne trouvait rien). Côté serveur : `/CLAUDE~1/settings.json` (nom court de `.claude`) et `/SERVEUR/comptes.js` servis **sans connexion** ; `/datatest/` contournait `VIGIE_DEMO=0` ; 50 Mo lus avant toute session sur `/api/connexion` ; en « ajout seulement », une copie modifiée d'un élément existant, glissée devant l'original sous le même identifiant, passait (observation SST falsifiée, ligne d'audit non signée).
- **Corrigé** : 2026-09-30 — commit `d5c82fe`. `esc()` partout (identifiants compris), `safeUrl` sur le lien de veille, chemin réel contrôlé (`fs.realpathSync.native`), corps de connexion borné à 16 Ko, en-têtes anti-cadre (`X-Frame-Options`, CSP courte, `Referrer-Policy`), contrôle d'ajout par multiensemble et nombre d'occurrences par identifiant. Vérifié : sonde 0 point d'injection ; rendu normal identique (96 visites) ; `test-revue-serveur.js` 38/38, et 12 échecs sur le code d'avant.

### Menu latéral : liens absents, liens interdits montrés, épingle sans effet
- **Où** : le menu, recopié dans 24 pages. **Remonté** : 2026-09-30, revue générale (mesure de la visibilité de chaque lien, par page, pour 27 profils de compte).
- **Constaté** : Administration, Reporting et Évaluer un risque n'avaient pas les liens Gestion RH, Entreprises extérieures, Accueil au poste (ni Situations d'urgence pour les deux derniers) ; Santé & Visites montrait « Évaluer un risque », « Déclarer un AT/MP » et « Reporting » à un agent titulaire de la seule permission « sante-visites » ; sur Reporting, l'épingle ne gardait pas le menu ouvert ; Analyse d'accident plaçait son lien à part. Au passage, la checklist affirmait que RH ne voit pas Reporting, alors que la page lui est ouverte et que toutes les pages lui en montrent le lien.
- **Corrigé** : 2026-09-30 — commit `53978c3` : `assets/menu-lateral.js` construit le menu de toutes les pages (liste unique, règles de visibilité uniques). Vérifié : pour chaque profil, chaque page montre la visibilité majoritaire d'avant ; hors du menu, rendu identique ; comportement identique à avant sur 23 pages (épingle réparée sur Reporting).

### « Collectivité » restait écrit en dur à deux endroits, quel que soit le mot choisi pour l'organisation
- **Où** : Gestion RH (message de fin d'import des heures : « même mois, collectivité et service ») et Administration → Données d'une personne (libellé du champ `collectivite`, `assets/libelles-champs.js`). **Remonté** : 2026-09-30, en passant les textes des pages au vocabulaire du secteur (J0).
- **Constaté** : avec le mot « Site » choisi dans Administration, ces deux textes disaient encore « collectivité » — restes de la bascule d'organisation du matin, que la photo avant/après ne pouvait pas voir (configuration par défaut, où le mot est justement « Collectivité »).
- **Corrigé** : 2026-09-30, branche `vocabulaire-secteur` : les deux suivent `VigieOrga.libelle()`. Leçon consignée dans `ETAT-DU-PROJET.md` §11 (« collectivité » a deux sens : l'employeur et l'entrée de l'organisation).

### Le bouton « Importer » d'Analyse d'accident n'avait pas d'icône
- **Où** : `accident-analyse.html`, bouton « Importer .xlsx ». **Remonté** : 2026-09-30, en rassemblant les icônes des pages (chaque page recopiait son propre sprite).
- **Constaté** : le bouton désignait l'icône `i-upload`, absente du sprite de cette page — un carré vide à la place du dessin. Même famille de défaut que les liens manquants du menu : une copie par page finit par diverger.
- **Corrigé** : 2026-09-30, branche `css-icones-communs` : toutes les icônes viennent d'`assets/icones.js`, et la vérification des pages refuse désormais un sprite recopié (check-script-tags.js, scratchpad). Seul autre effet visible : la corbeille d'Inspection / Audit prend le dessin des autres pages.

### Une date importée « 01/09/2026 » devenait le 9 janvier
- **Où** : tous les imports de fichier qui lisent une date — 13 pages (Registre AT/MP, Situations d'urgence, Plan d'actions, Vérifications périodiques, Gestion RH, Santé & Visites, Registre SST, Inspection / Audit, Produits chimiques, Formation / Habilitation, EPI, Analyse d'accident, Dossiers AT/MP & CITIS). **Remonté** : 2026-10-06, en relisant le code d'import pendant les plans d'urgence (tâche proposée, choisie par l'utilisateur).
- **Constaté** (mesuré avec la vraie SheetJS et les vraies pages, `test-dates-import.js` : 4 contrôles sur 18 réussis avant) : seules les **vraies dates** de tableur arrivaient justes. Une date écrite en **texte** — CSV d'Excel français ou de LibreOffice, ou cellule texte d'un `.xlsx`/`.ods` — était lue **mois/jour** : « 01/09/2026 » → 2026-01-09, sans erreur. Un jour au-delà de 12 donnait une date impossible, « 25/09/2026 » → « 2026-25-09 », qu'un calcul d'échéance décale de deux ans. Deux causes : SheetJS devine les dates d'un CSV dans l'ordre américain ; les 17 fonctions de date des pages prenaient le premier nombre pour le mois. Au passage : l'échéance d'une action corrective importée dans Situations d'urgence s'enregistrait en texte brut (« Fri Sep 25 2026 00:00:00 GMT+0200… » pour une vraie date Excel), Analyse d'accident, Dossiers AT/MP et Gestion RH gardaient « 25/09/2026 » tel quel, et le rapprochement par « Date AT » de ces deux modules ne reconnaissait jamais une vraie date Excel.
- **Corrigé** : 2026-10-06, branche `dates-import` : `VigieImport.lireClasseur` rend leur texte aux cellules qu'un CSV avait converties en date ; un lecteur unique `VigieDates.depuisImport` (`assets/dates-locales.js`) lit JJ/MM/AAAA à la française (séparateurs `/ . -`, année sur deux chiffres comme Excel) et refuse une date impossible ; les 17 fonctions et les cinq autres lectures de date y passent. Vérifié : `test-dates-import.js` 18/18 (4 modules × CSV Windows-1252, CSV UTF-8, texte `.xlsx`, vraie date ; échec 4/18 sur l'ancien code) ; données de démonstration chargées par les 24 pages identiques avant/après (26 clés) ; suites d'import repassées à l'identique.

### Le générateur du kit de reprise s'arrêtait en silence après le premier modèle
- **Où** : `Documentation/outils/generer-kit-reprise.js` (fabrique `KIT-REPRISE/` et `KIT-REPRISE-DONNEES.md`). **Remonté** : 2026-10-06, en voulant y ajouter le modèle des plans d'urgence.
- **Constaté** : le générateur écrivait « 00-referentiels » puis rendait la main avec le code 0, sans message ni fichier — cassé depuis le 2026-09-25, jour où SheetJS a été embarquée (`assets/xlsx.full.min.js`) : chargée comme les autres scripts de la page, elle remplaçait l'outil d'export simulé qui capture le classeur, et l'erreur qui en découlait était avalée par le capteur prévu pour les erreurs des pages. Le kit livré, lui, était intact (régénéré le 25 à 13 h 39, la bibliothèque embarquée le soir) ; seul manquait le modèle 18, ajouté depuis.
- **Corrigé** : 2026-10-06, branche `kit-reprise` : la copie embarquée de SheetJS n'est plus chargée par le générateur, une erreur l'arrête désormais avec un message et le code 2, et un export sans classeur ou une feuille à compter absente de l'export sont nommés. Le passage a aussi corrigé l'entrée du modèle 18 (noms de feuilles) et montré que **l'import des plans d'urgence** réattribuait chaque plan nouveau au compte qui importe, colonne « Auteur » ignorée — contrairement à l'import des exercices, et gênant pour une reprise : l'auteur du fichier est désormais gardé (à défaut, le compte qui importe ; un plan existant garde le sien). Vérifié : 19 modèles « tous importables » ; les modèles 01 à 17 ressortent identiques octet pour octet, `00-referentiels` ne change que l'ordre des listes citées dans une consigne ; `test-plans-auteur.js` 6/6, aller-retour des plans export → import par un autre compte dans une application vide → export sans écart sur les 5 feuilles.

### Un compte limité à certains services effaçait, en écrivant, les enregistrements des autres services
- **Où** : toutes les pages de données, en **mode navigateur** (site hébergé, poste sans serveur) — pas en mode serveur. **Remonté** : 2026-10-07, en lisant le Plan d'actions (relecture de code, pas un test manuel).
- **Constaté** (reproduit par `test-perimetre-local.js`) : un compte dont les services ne contiennent pas `"*"` — le manager de démonstration, limité à Voirie & Réseaux et Espaces Verts & Paysage — ne voit que les enregistrements de ses services, et la page enregistre la liste qu'elle a. Le manager dépose une observation au Registre SST : l'observation saisie par RH pour la Restauration scolaire disparaît du stockage. Les données de démonstration revenaient au rechargement (always-merge), pas les saisies. Toute page où un compte limité peut écrire était concernée (les profils sont réglables : n'importe quel module).
- **Cause** : le filtre `isScoped` de chaque page réduit la liste en mémoire, puis `saveDataset(DATASET)` l'écrit telle quelle. Le serveur, lui, greffe déjà la part du compte sur le registre complet (`serveur/perimetre.js`, P1c) : le défaut n'existait qu'en mode navigateur.
- **Corrigé** : 2026-10-07, branche `perimetre-local` : `assets/stockage.js` applique en mode navigateur la même greffe que le serveur (`greffer`, porté en ES5, même algorithme) — les enregistrements hors périmètre gardent leur version et leur place, ce que le compte soumettrait hors de son périmètre est ignoré, une suppression n'efface que sa part. Un seul point de passage : toutes les pages à la fois. Vérifié : dépôt réel du manager dans la page, puis VigieStore comparé caractère pour caractère à `greffer()` du serveur sur huit cas (15/15) ; suite des harnais jsdom sans écart avec `main`.

## Ouverts / reportés (pas des bugs à corriger maintenant)

- **Présentation à un professionnel HSE externe** — toujours en recherche (checklist §7, 2026-09-15). Ne dépend pas du code ; c'est le dernier point du gel `v1.0.0` dans `PLAN-VERSIONS-V1.md`.
