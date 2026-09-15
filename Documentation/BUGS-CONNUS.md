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

---

## Ouverts / reportés (pas des bugs à corriger maintenant)

- **Taille des titres/menu sur mobile** — remonté le 2026-09-15 (checklist §5) : tout fonctionne, mais le porteur du projet veut augmenter la taille des titres et du menu côté mobile pour plus de confort. Amélioration reportée, pas urgente.
- **Présentation à un professionnel HSE externe** — toujours en recherche (checklist §7, 2026-09-15). Ne dépend pas du code ; c'est le dernier point du gel `v1.0.0` dans `PLAN-VERSIONS-V1.md`.
