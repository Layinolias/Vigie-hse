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
- `avant-livraison.js` lance les cinq tests dans l'ordre et donne un bilan.
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

**`test-copie-sauvegardes.js`** — la copie des sauvegardes hors du disque (2026-10-23), avec un vrai dossier de copie qu'on « débranche » :
- réglée avant le lancement, la sauvegarde du démarrage y est recopiée à l'identique, sans fichier provisoire laissé ;
- l'administrateur lit l'état et règle le dossier ; un agent rien (403), sans session non plus (401), ni sans l'en-tête `X-Vigie` ;
- refusés : chemin relatif, dossier absent, le dossier des sauvegardes lui-même, un fichier — sans rien changer au réglage ;
- dossier débranché : la sauvegarde est prise, la copie notée en échec avec son motif en clair ; après un redémarrage, le tableau de bord de l'administrateur en avertit (pas celui d'un agent, qui ne reçoit rien) ; rebranché, la copie reprend, l'avertissement disparaît, et seules les dernières restent (comme dans le dossier des sauvegardes) ;
- Administration → Sauvegardes (ouverte par le lien du tableau de bord) : état affiché, refus du serveur montré en clair, autre dossier enregistré et noté au journal des modifications, champ vidé = copie arrêtée ;
- `VIGIE_SAUVEGARDES_COPIE` l'emporte : la page ne peut plus le changer ;
- « Restaurer une sauvegarde » propose les copies que le dossier des sauvegardes n'a plus.

## Tests des pages (`tests/pages/`)

Les tests jsdom des modules (une page, ses contrôles, ses droits, son export, ce que la Préparation ISO 45001 en lit) : 24 tests, 1 128 contrôles au 2026-10-23, une quarantaine de secondes. Ils vivaient dans le scratchpad de session et s'y effaçaient au nettoyage des fichiers temporaires de Windows (encore le 2026-10-21) ; ils sont dans le dépôt depuis ce jour, hors du paquet comme les tests de livraison.

```
node tests/pages/suite.js                    tous, trois à la fois
node tests/pages/suite.js contexte menu      ceux dont le nom contient « contexte » ou « menu »
node tests/pages/suite.js --parallele 1      un à la fois
node tests/pages/test-contexte.js            un seul, avec le détail de chaque contrôle
```

- Même `npm install` dans `tests/` (jsdom). Aucun serveur, aucun port : les pages s'ouvrent dans jsdom avec un stockage en mémoire, jamais celui d'un navigateur.
- La bibliothèque Excel est celle de l'application (`assets/xlsx.full.min.js`, SheetJS 0.20.3), pas le paquet npm « xlsx » resté en 0.18.5.
- `RACINE=<dossier>` : tester une autre copie du dépôt (un `git archive` extrait, pour comparer avant / après).
- Le fuseau horaire est forcé à `Pacific/Auckland` (`harnais.js`) : une date calculée en UTC au lieu de l'heure locale tombe la veille, et le test le voit.
- `test-menu-pages.js` : le même menu sur toutes les pages à menu, et les droits des modules existants identiques à ceux de `origin/main` pour les six profils préréglés et les comptes à rôle — à passer à chaque module ajouté ou droit modifié.
- `test-marque-pages.js` compte les pages (40 au 2026-10-21) : une page ajoutée le fait échouer exprès, pour qu'on vérifie qu'elle suit la marque.
- Un test qui plante sans bilan compte comme un échec ; `suite.js` en montre les dernières lignes.

## Le harnais (`harnais-serveur.js`)

- Il démarre un vrai serveur : celui du dépôt, celui d'un ancien commit ou celui d'un paquet décompressé. Il l'arrête brutalement, comme une fenêtre qu'on ferme.
- Il ouvre ses pages dans jsdom. Les scripts sont demandés **au serveur qui sert la page** : une ancienne version tourne avec ses propres composants, et la bibliothèque Excel s'exécute dans la page.
- Les `XMLHttpRequest` synchrones de `VigieStore` font une vraie requête HTTP par appel, dans un processus à part (`aide-xhr.js`), avec le pot de cookies de la page. Celui de jsdom mêle les cookies des fenêtres ouvertes.
- Une page « a fini » quand plus aucune requête ne passe pendant 600 ms.
- `login.html` n'est pas dans la ronde des pages : l'écran de connexion ferme la session. La première connexion le passe à part, par son vrai formulaire.
