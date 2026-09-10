# VIGIE HSE — Plan de montée de version vers V1.0

Proposition d'un ingénieur logiciel pour passer de l'état actuel (`V0.1.1.2`) à une **V1.0 utilisable et présentable à un professionnel**, avant d'attaquer le jalon stratégique J0 (généralisation commerciale collectivité + privé, voir `ROADMAP-MODULES-FUTURS.md`).

## Principe : deux jalons différents, pas un seul

Il y a une confusion à éviter entre deux objectifs distincts :

- **V1.0 = "démonstrable"** : un produit cohérent, complet dans son primètre actuel (une collectivité, Ville de Verchamps + Agglomération), sans aspérité visible, qu'on peut montrer en rendez-vous sans avoir à s'excuser d'un bug ou d'un module à moitié fait.
- **J0 = "vendable à grande échelle"** : un vrai produit commercial multi-tenant, générique collectivité/entreprise, avec backend réel. C'est un chantier d'architecture bien plus lourd (voir `ROADMAP-MODULES-FUTURS.md`).

**Recommandation : V1.0 doit précéder J0.** Ça n'a pas de sens d'investir dans la généralisation multi-tenant/commerciale avant d'avoir un produit validé — sur un seul client — devant de vrais professionnels. V1.0 sert aussi à récolter les retours qui rendront J0 plus juste (on saura *quoi* généraliser, pas seulement *comment*).

### Jalon complémentaire à ne pas oublier : la mise en ligne

Point soulevé par l'utilisateur, à raison : aujourd'hui le produit n'existe qu'en local (fichiers `.html` ouverts sur une seule machine). Ça limite déjà V1.0 — "présentable à un professionnel" est plus convaincant avec un lien qu'on partage qu'avec des fichiers à faire tourner sur son propre poste. **Il faut distinguer deux niveaux de "mise en ligne", qui ne coûtent pas du tout la même chose :**

1. **Hébergement statique simple** (peu coûteux, quelques heures de travail) : déposer les fichiers actuels tels quels sur un vrai hébergeur statique (GitHub Pages, Netlify, Vercel, Cloudflare Pages "normal", ou un hébergement web classique type OVH — pertinent pour une collectivité française soucieuse de souveraineté des données). Le produit devient accessible par une URL, partageable, démontrable à distance. **Attention : l'architecture ne change pas** — toujours du `localStorage` par navigateur, donc toujours pas de données partagées entre deux personnes qui ouvrent le lien depuis deux machines différentes. Ce n'est pas le blocage Cloudflare/Artifact déjà rencontré (celui-ci était spécifique au bac à sable de prévisualisation des Artifacts, pas à l'hébergement web en général) — un hébergement statique classique n'aura pas ce problème.
2. **Vraie mise en ligne multi-utilisateurs** (données partagées, persistantes, accessibles simultanément par plusieurs personnes) : c'est en réalité **le même chantier que le backend du jalon J0** (base de données réelle, authentification réelle, API) — ce n'est pas un jalon séparé à additionner, c'est la même charge de travail. Il ne faut donc pas le prévoir deux fois dans le plan.

**Proposition concrète : intégrer l'hébergement statique (option 1) dans le plan V1.0** (ajouté ci-dessous comme étape `V0.3.0`), et considérer que la "vraie" mise en ligne multi-utilisateurs est absorbée par J0/V2.0, pas un jalon en plus.

## Schéma de versionnage proposé

Le versionnage actuel (`V0.1` → `V0.1.1` → `V0.1.1.1` → `V0.1.1.2`, un dossier complet dupliqué à chaque étape) a bien fonctionné pour itérer vite, mais il ne tiendra pas la distance : dossiers de plus en plus lourds, pas de diff, pas de retour arrière fin, numérotation à 4 niveaux qui n'a pas de sens standard.

**Proposition : passer en versionnage sémantique classique (`MAJOR.MINOR.PATCH`) et en `git`, dès maintenant.**

- `MAJOR` : changement d'architecture cassant (ex. passage au backend multi-tenant = J0 → ce sera `V2.0.0`).
- `MINOR` : nouveau module ou fonctionnalité notable, rétrocompatible (ex. ajout d'un export PDF).
- `PATCH` : corrections, polish, sans nouvelle fonctionnalité.

Concrètement :
1. Initialiser un dépôt `git` sur le dossier `V0.1.1.2` actuel (renommé simplement `vigie-hse` ou conservé tel quel), premier commit = état actuel.
2. Chaque étape ci-dessous devient un ou plusieurs commits, taguée en fin d'étape (`git tag v0.2.0`, etc.) plutôt qu'un nouveau dossier dupliqué.
3. Les anciens dossiers `V0.1`, `V0.1.1`, `V0.1.1.1` restent tels quels comme archive historique (aucune raison de les toucher).

*Je n'ai pas initialisé de dépôt — c'est un changement d'outillage que je te propose avant de le faire, dis-moi si tu veux que je le mette en place.*

## Étapes proposées, de `V0.1.1.2` à `V1.0.0`

### V0.2.0 — Stabilisation & cohérence
Objectif : plus aucune aspérité visible en usage normal.
- Audit des 11 pages : états vides (tableau sans données), messages d'erreur sur import Excel malformé, cohérence visuelle post-refonte des en-têtes compacts.
- Passage mobile/responsive réel (test à plusieurs largeurs, pas seulement desktop).
- Accessibilité de base : focus clavier visible partout, `aria-label` sur les boutons icône-seule (beaucoup de boutons n'ont qu'une icône SVG sans texte).
- Vérifier que chaque module a un chemin "golden path" complet et sans erreur : créer → filtrer → modifier → supprimer → exporter, testé pour chaque rôle.

### V0.3.0 — Mise en ligne (hébergement statique)
Déployer les fichiers actuels sur un vrai hébergeur statique (voir section dédiée ci-dessus) : URL stable, partageable, démontrable à distance sans installation. Inclut : choix de l'hébergeur, configuration d'un déploiement reproductible (même dossier source → mise à jour du site en une commande, pas un upload manuel à chaque fois), vérification que tout fonctionne identique au local (import/export Excel, localStorage, thèmes clair/sombre). Ne change pas l'architecture — toujours pas de données partagées entre visiteurs.

### V0.4.0 — Exports professionnels
Un professionnel HSE s'attend à pouvoir **produire un document**, pas seulement consulter un écran.
- Export PDF imprimable du DUERP par service (mise en page officielle, pas juste un export Excel).
- Export PDF du registre AT/MP (fiche par accident + registre consolidé).
- Généraliser l'export Excel (déjà présent sur AT/MP et DUERP) aux modules qui n'en ont pas encore (Plan d'Actions, Vérifications Périodiques, RSST).

### V0.5.0 — Mode démonstration
Ce qui transforme "un outil qui marche" en "quelque chose qu'on peut présenter" :
- Une page vitrine avant l'écran de connexion, expliquant le produit en une vue (actuellement l'entrée directe est `login.html`, ce qui est correct pour un usage réel mais froid pour une démo).
- Bouton "réinitialiser aux données de démonstration" visible et assumé (pas juste un `btnResetData` technique perdu dans un module).
- Bannière honnête et discrète rappelant que c'est un prototype (pas de vraie authentification, données locales au navigateur, pas de partage de données entre visiteurs même en ligne) — un professionnel préfère qu'on soit transparent sur les limites plutôt que de découvrir un angle mort en pleine démo.

### V0.6.0 — Un ou deux modules à forte valeur de démonstration
Candidats du backlog (`ROADMAP-MODULES-FUTURS.md`), à choisir avec toi selon ce qui impressionnera le plus l'audience visée :
- **Indicateurs & reporting KPI** — effet "wow" en démo, capitalise sur tous les modules déjà construits.
- **Inspection / Audit** — complète naturellement le Plan d'Actions déjà en place (deuxième source d'actions automatiques, montre la cohérence du système).

### V0.7.0 → V0.9.0 — Itérations sur retours réels
Volontairement non détaillé maintenant : après une ou deux démos réelles à de vrais professionnels (V0.5.0/V0.6.0, désormais accessibles par lien grâce à V0.3.0), les retours diront quoi prioriser. Prévoir cette marge plutôt que de figer un plan sur 4 versions à l'avance sans données.

### V1.0.0 — Gel
Checklist de sortie proposée (à valider ensemble avant de taguer `v1.0.0`) :
- [ ] Tous les modules du périmètre actuel ont un golden path testé pour chaque rôle (admin/rh/manager/ag).
- [ ] Aucune page ne renvoie d'erreur JS en usage normal (vérifié, pas supposé).
- [ ] Exports PDF/Excel disponibles sur tous les registres qui en ont l'usage.
- [ ] Site en ligne sur un vrai hébergement, à une URL stable, testé (pas seulement en local).
- [ ] Mode démo + page vitrine en place.
- [ ] Documentation à jour (`ETAT-DU-PROJET.md`, ce fichier, `ROADMAP-MODULES-FUTURS.md`).
- [ ] Testé sur au moins 2 navigateurs différents et une largeur mobile.
- [ ] Présenté au moins une fois à un professionnel externe au projet pour retour à froid, avant le gel définitif.

## Ce qui reste explicitement HORS scope de V1.0

- Le backend multi-tenant, l'authentification réelle, le **partage de données entre utilisateurs même en ligne**, la généralisation collectivité/privé (jalon J0) — volontairement repoussé après V1.0, voir plus haut. (La mise en ligne *statique*, elle, est bien dans le scope de V1.0 via `V0.3.0` — seule la version multi-utilisateurs partagée est repoussée.)
- Les modules 2, 4, 5, 6, 8 du backlog fonctionnel (Inspection/Audit sauf si retenu en V0.6.0, Produits chimiques, Pénibilité, Formation/Habilitation, Gestion documentaire) — à réévaluer une fois V1.0 validée en conditions réelles.

## Prochaine étape concrète

Ce plan est une proposition — dis-moi si l'ordre te convient, si tu veux réordonner les modules candidats de V0.5.0, ou si tu veux qu'on commence directement par V0.2.0 (stabilisation) et le passage à `git`.
