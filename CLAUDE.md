# VIGIE HSE — mémo projet

Dashboard HSE prototype (Ville de Verchamps + Agglomération de Verchamps) : Registre AT/MP, Document Unique (DUERP), et modules de prévention connexes. Static HTML/CSS/JS vanilla, aucun backend, aucun framework — tout vit en `localStorage`/`sessionStorage` du navigateur.

**Avant toute intervention, lire `Documentation/ETAT-DU-PROJET.md`** (architecture complète, modèle de données, pièges connus), `Documentation/ROADMAP-MODULES-FUTURS.md` (backlog des modules, avec statut) et `Documentation/PLAN-VERSIONS-V1.md` (chemin de version vers V1.0). Ce fichier-ci n'est qu'un aide-mémoire rapide — **il ne doit jamais dépasser 200 lignes** ; si une info mérite plus de détail, elle va dans `Documentation/`, pas ici.

**Jalon stratégique J0** (voir `ROADMAP-MODULES-FUTURS.md`) : le projet vise à terme une commercialisation généraliste (collectivités ET secteur privé), pas seulement la Ville de Verchamps. Avant d'ajouter beaucoup de nouveaux modules métier, garder en tête que du vocabulaire/structure codés en dur (agent/collectivité/Ville-Agglomération/F3SCT) devront devenir configurables.

## Version active

`V0.1.1.2/` — dossier autonome, à éditer. `V0.1`, `V0.1.1`, `V0.1.1.1` sont des versions précédentes figées : **ne jamais les modifier**.

## Règles non négociables

1. **Zéro régression.** Toute nouvelle version garde 100% des capacités de la précédente, sauf demande explicite contraire.
2. **Pattern "always-merge seed+stockage"** dans chaque `loadDataset()` — jamais un "seed si vide". Voir §9 de `ETAT-DU-PROJET.md`.
3. **Tester en ouvrant les `.html` en local**, jamais via un lien Artifact hébergé (Cloudflare bloque `localStorage`).
4. **PowerShell : toujours `[System.IO.File]::ReadAllText/WriteAllText` + `UTF8Encoding($false)`** — `Get-Content`/`Out-File` corrompent les accents. Pour `git commit -m`, si le message contient des guillemets doubles littéraux, ne pas passer par un here-string PowerShell (le passage à l'exécutable natif `git.exe` casse le message en plusieurs arguments) — écrire le message dans un fichier temporaire et utiliser `git commit -F <fichier>`.
5. **Édits ciblés fichier par fichier, jamais un regex global non vérifié.** Vérifier l'équilibre accolades/parenthèses/crochets JS après chaque édition (technique en §13 de `ETAT-DU-PROJET.md`).
6. **Toute délégation à un agent en arrière-plan est bornée explicitement** ("fais exactement ceci, puis arrête-toi") et son résultat re-vérifié indépendamment avant d'être considéré acquis.
7. **`git` est installé** (`C:\Program Files\Git\cmd\git.exe` — utiliser ce chemin complet si `git` n'est pas dans le PATH d'une nouvelle session shell). Dépôt GitHub : `https://github.com/Layinolias/Vigie-hse` (public, GitHub Pages activé sur `main`/`root` → `https://layinolias.github.io/Vigie-hse/`). Le remote `origin` a un PAT embarqué dans son URL pour push direct — pas besoin de redemander un token sauf s'il expire/est révoqué.
8. **Attention aux limites de session/débit** : un agent en arrière-plan peut être interrompu en cours de tâche (erreur `rate_limit`). Ne jamais supposer un travail perdu sur cette seule base — vérifier l'état réel des fichiers (souvent déjà complets, seul le rapport final manque) avant de relancer quoi que ce soit.

## Comptes de test

`admin@verchamps.fr` / `admin1234` · `manager@verchamps.fr` / `manager1234` · `RH1`/`RH2` / `1234` · `AG1`/`AG2` / `1234`

## Fichiers de `V0.1.1.2`

Cockpit : `login.html`, `index.html`. Cœur HSE : `registre-at-mp.html` + `saisie-rh.html`, `document-unique.html` + `saisie-duerp.html`. Modules de suivi : `plan-actions.html`, `sante-visites.html`, `registre-sst.html`, `verifications-periodiques.html`, `inspection-audit.html`, `produits-chimiques.html`, `formation-habilitation.html`, `epi-dotation.html`, `reporting.html`. Back-office : `administration.html`. Détail du rôle de chacun dans `ETAT-DU-PROJET.md` §6 (à tenir à jour à chaque nouveau module).
