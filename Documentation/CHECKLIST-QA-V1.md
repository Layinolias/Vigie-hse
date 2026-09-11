# VIGIE HSE — Checklist de test manuel avant V1.0

À exécuter par un humain dans un vrai navigateur (je ne peux pas cliquer moi-même dans une interface). Coche au fur et à mesure ; note tout ce qui coince avec le format en bas de page, je m'en occupe ensuite.

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

## 4. Fonctionnalités transverses

- [ ] **Météo** (topbar) : au premier chargement, le navigateur demande l'autorisation de géolocalisation — accepter, vérifier que la météo affichée correspond à peu près à l'endroit réel. Refuser sur un autre test : une météo s'affiche quand même (repli IP), pas de blocage.
- [ ] **Score HSE** (topbar) : cliquer dessus fait défiler la page jusqu'au détail, sans que la barre du haut ne le cache.
- [ ] **Sélecteur Ville/Agglomération/Tous** (topbar, cockpit) : change bien les chiffres affichés sur le tableau de bord.
- [ ] **Menu latéral** : se réduit/étend correctement au survol sur grand écran ; devient un tiroir accessible via le bouton menu sur petit écran (voir §5).
- [ ] **Import Excel** (Registre AT/MP ou Document Unique) : importer un fichier volontairement invalide (mauvais format, colonnes manquantes) → message d'erreur clair, pas de plantage silencieux.

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
