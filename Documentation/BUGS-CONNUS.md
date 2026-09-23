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

---

## Ouverts / reportés (pas des bugs à corriger maintenant)

- **Taille des titres/menu sur mobile** — remonté le 2026-09-15 (checklist §5) : tout fonctionne, mais le porteur du projet veut augmenter la taille des titres et du menu côté mobile pour plus de confort. Amélioration reportée, pas urgente.
- **Présentation à un professionnel HSE externe** — toujours en recherche (checklist §7, 2026-09-15). Ne dépend pas du code ; c'est le dernier point du gel `v1.0.0` dans `PLAN-VERSIONS-V1.md`.
