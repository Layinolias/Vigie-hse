# Tests de livraison

Les quatre tests à passer **avant de remettre un paquet** à un utilisateur (`Documentation/LIVRAISON-POSTE.md`). Ils vivent dans le dépôt, mais pas dans le paquet : `serveur/preparer-livraison.js` ne prend que les pages, `assets/`, `KIT-REPRISE/`, `serveur/*.js` et les fichiers de lancement. Ils ne servent pas aux tests des pages (harnais jsdom du scratchpad de session), seulement au poste livré.

Jusqu'au 2026-10-14, ils vivaient dans le scratchpad de session. Le nettoyage des fichiers temporaires de Windows les a effacés, d'où ce dossier.

## Lancer

```
cd tests
npm install
cd ..
node tests/avant-livraison.js
```

- `npm install` installe jsdom (exécution des pages), une fois. `tests/node_modules/` n'est pas suivi par git.
- Node.js 22.5 ou plus, comme le serveur. Sous Windows : `tar.exe` et `cmd.exe` du système, `git` (`C:\Program Files\Git\cmd\git.exe` s'il n'est pas dans le PATH).
- `avant-livraison.js` lance les quatre tests dans l'ordre et donne un bilan.
  - Sans argument, la mise à jour est essayée depuis chaque paquet du tableau de `LIVRAISON-POSTE.md` qui n'a pas été remplacé ; on peut aussi donner les commits.
  - `--brouillon` : paquet d'essai avec les fichiers non commités (le vrai paquet exige un dépôt propre). Il s'appelle toujours `VIGIE-HSE-<date>-brouillon.zip`, même sur un dépôt propre : un essai ne remplace jamais le paquet du jour (avant le 2026-10-15, un essai sur un dépôt propre l'écrasait). À supprimer après l'essai.
- Chaque test se lance aussi seul. `--garder` garde son dossier de travail, pris dans le dossier temporaire du système et effacé sinon.
- Ports utilisés : 8861 à 8899. Aucun ne doit être pris, et un seul test à la fois.
- Durée : une dizaine de minutes, dont deux à trois par paquet essayé en mise à jour.

## Ce que vérifie chaque test

**`test-mise-a-jour.js <commit>…`** — pour chaque commit :
- l'ancienne version, extraite du dépôt (`git archive`), remplit une base comme un utilisateur : première connexion par l'écran de connexion, toutes ses pages avec les données de démonstration, plus une saisie ;
- la nouvelle version (le dépôt) démarre sur cette base, sans démonstration, comme le lanceur ;
- elle doit avoir pris une copie « avant mise à jour », identique à la base registre par registre ;
- les comptes et leurs mots de passe sont repris ;
- toutes les pages s'ouvrent sans erreur (administrateur), ainsi que le tableau de bord des autres comptes ;
- aucun registre perdu, aucun enregistrement perdu (par identifiant), la saisie intacte ;
- pas de seconde copie au redémarrage.

**`test-paquet.js [--brouillon]`** :
- le paquet est préparé par `serveur/preparer-livraison.js`, puis décompressé dans un dossier vide ;
- contenu : les fichiers indispensables, et ni documentation, ni démonstration, ni tests, ni base ;
- `VERSION.txt` donne le commit ; le lanceur, l'outil de restauration et le guide ont des fins de ligne Windows, et aucun `/dev/null` ;
- `Lancer VIGIE HSE.bat`, exécuté par `cmd.exe`, démarre sans aucun message technique ;
- au lancement : aucun avertissement, puis première connexion par la création du compte administrateur (un mot de passe de moins de 12 caractères refusé par la page et par le serveur, aucun compte de démonstration) ;
- toutes les pages s'ouvrent sans erreur, et rien n'est demandé hors du poste ;
- polices et bibliothèque Excel servies par le poste ;
- `DATATEST/` n'est pas servi et les registres restent vides ;
- les données sont rangées hors du dossier de l'application ;
- l'application est supprimée puis remplacée par une version suivante : comptes, saisie et copie « avant mise à jour » sont là.

**`test-restauration.js`** — sur un vrai dossier de données :
- refus si VIGIE HSE tourne ;
- annulation, numéro invalide ou confirmation autre que OUI : rien n'est modifié ;
- une copie abîmée est refusée avant toute modification ;
- restauration complète, avec un `-wal` résiduel éliminé et les données d'avant mises de côté ;
- journaux reportés (journal d'audit, consultations des données de santé) ;
- VIGIE HSE redémarre sur la base remise en place ;
- la restauration se défait avec le même outil ;
- au plus 5 copies « avant restauration » sont gardées ;
- repère « base en service » : un processus vivant fait refuser, même sur un autre port ; un processus disparu est ignoré ; VIGIE HSE lancé sur un autre port fait refuser ;
- `Restaurer une sauvegarde.bat`, exécuté par `cmd.exe`, ne montre aucun message technique.

**`test-securite.js`** — comptes, sessions et ajouts, sur des bases neuves (revue de sécurité du 2026-10-18) :
- poste réel (`VIGIE_DEMO=0`) : l'écran de connexion fait créer le compte administrateur ; moins de 12 caractères ou deux saisies différentes refusés par la page ; un compte de démonstration refusé par le serveur, même par un appel direct ; plus d'écriture des comptes sans session une fois le premier créé ;
- un mot de passe de moins de 12 caractères posé par l'administrateur est refusé ;
- un mot de passe changé ferme les sessions ouvertes avec l'ancien, sauf celle de qui le change ; la même liste renvoyée avec le même mot de passe ne ferme rien ;
- un compte qui ne peut qu'ajouter (signalements et leurs photos, prises de connaissance de la politique, Registre SST) signe ses ajouts du nom de sa session, quoi qu'envoie la page ; « Anonyme » reste possible au Registre SST ; une prise de connaissance au nom d'un autre est refusée ; qui gère le registre garde l'auteur qu'il saisit ;
- serveur de démonstration : les comptes de démonstration inscrits comme avant, mais un compte nouveau demande aussi 12 caractères.

## Le harnais (`harnais-serveur.js`)

- Il démarre un vrai serveur : celui du dépôt, celui d'un ancien commit ou celui d'un paquet décompressé. Il l'arrête brutalement, comme une fenêtre qu'on ferme.
- Il ouvre ses pages dans jsdom. Les scripts sont demandés **au serveur qui sert la page** : une ancienne version tourne avec ses propres composants, et la bibliothèque Excel s'exécute dans la page.
- Les `XMLHttpRequest` synchrones de `VigieStore` font une vraie requête HTTP par appel, dans un processus à part (`aide-xhr.js`), avec le pot de cookies de la page. Celui de jsdom mêle les cookies des fenêtres ouvertes.
- Une page « a fini » quand plus aucune requête ne passe pendant 600 ms.
- `login.html` n'est pas dans la ronde des pages : l'écran de connexion ferme la session. La première connexion le passe à part, par son vrai formulaire.
