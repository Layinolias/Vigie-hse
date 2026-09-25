# Plan de mise en production

> Rédigé le 2026-09-23, à la demande du porteur du projet : « comment se rapprocher d'un produit en service, faut-il un serveur privé, comment couvrir plusieurs types de déploiement, comment reprendre les données d'un client ». Ce document pose le chemin ; les décisions qu'il appelle sont listées à la fin.

## 1. Où on en est

VIGIE HSE est aujourd'hui un **prototype complet côté écran** (24 pages, 17 modules sur 18) dont **toutes les données vivent dans le navigateur** (`localStorage`). C'est parfait pour une démonstration, et c'est ce qui l'empêche d'être un produit :

- **Rien n'est partagé.** Ce que RH1 saisit sur son poste, le préventeur ne le voit pas sur le sien. Vider le navigateur efface tout.
- **La sécurité est décorative.** Les mots de passe sont stockés en clair et les droits (rôles, permissions par module) sont vérifiés dans la page : quelqu'un qui sait ouvrir les outils du navigateur peut se les attribuer.
- **Pas de sauvegarde, pas de trace fiable** : le journal d'audit est lui aussi dans le navigateur.

**Un serveur « privé » qui ne ferait qu'héberger les fichiers actuels ne change rien à ces trois points** — l'hébergement de fichiers fonctionne déjà (GitHub Pages). Ce qu'il faut, c'est un **serveur d'application** : une base de données, une vraie authentification, des droits vérifiés par le serveur, des sauvegardes.

## 2. Ce qui est déjà prêt (2026-09-23)

- **Un point de passage unique vers le stockage** : `assets/stockage.js` (`VigieStore`). Les 232 lectures/écritures des 24 pages y passent ; le jour du serveur, **c'est ce fichier qui change, pas les 24 pages**. Il porte le **registre des 38 clés** avec leur nature — données, paramètres, journaux, préférences d'appareil — et signale celles qui contiennent des données potentiellement sensibles (santé). Vérifié : rendu de chaque page strictement identique avant/après.
- **Un navigateur qui refuse le stockage** ne fait plus planter les pages : elles fonctionnent sur une mémoire temporaire, avec un bandeau qui prévient que rien ne sera conservé.
- **Un kit de reprise des données** (`KIT-REPRISE/`, détail dans `KIT-REPRISE-DONNEES.md`) : un modèle Excel par module, dans l'ordre de chargement, avec des consignes mesurées sur la vraie application.
- **Des imports fiables** : un aller-retour export → import a été vérifié sur les 14 modules importables, champ par champ ; il a fait corriger les dossiers AT/MP (dates, références et prolongations perdues) et ajouter l'import des agents et des heures travaillées.
- **Tout type de tableur** (réponse du préventeur, question 13) : Excel `.xlsx`/`.xls`, LibreOffice `.ods`, CSV en point-virgule ou virgule et dans tous les encodages courants (`assets/import-fichier.js`) — un CSV UTF-8 sans BOM arrivait jusque-là avec des accents cassés, sans erreur signalée.
- **Stockage plein signalé** : un enregistrement refusé faute de place n'est plus perdu en silence (bandeau), et `VigieStore.occupation()` mesure l'espace utilisé — affiché en jauge dans Administration.
- **Reprise complète** : les référentiels s'importent (premier fichier du kit) et l'arbre causal des analyses d'accident aussi — les 14 modules importables font un aller-retour export → import sans perte, champ par champ.
- **Un serveur local qui fonctionne (étape P1a, 2026-09-24)** : `serveur/serveur.js` sert les pages et garde les données dans une vraie base (SQLite, un fichier sur le disque) partagée par tous ceux qui l'utilisent. Les 24 pages n'ont pas changé : c'est `VigieStore` qui bascule. Détail au §4 bis.
- **On s'y connecte, et le serveur applique les droits (étape P1b, 2026-09-24)** : mot de passe vérifié par le serveur et conservé seulement sous forme d'empreinte, aucune page ni donnée sans session, droits d'écriture de chaque registre appliqués par le serveur. Détail au §4 ter.
- **Prêt à s'ouvrir au réseau (étape P1c, 2026-09-25)** : HTTPS, chacun ne reçoit que les données de ses services, journal d'audit signé par le serveur, sauvegardes planifiées ; le serveur refuse de s'ouvrir tant que ce n'est pas sûr. Détail au §4 quater.

## 3. Trois façons de déployer — un seul logiciel

| Modèle | Qui héberge | Pour qui | Effort pour nous |
|---|---|---|---|
| **Service en ligne mutualisé** (SaaS) | Nous — une installation, plusieurs clients séparés | Petites et moyennes collectivités, PME | Le plus faible : une seule version à maintenir |
| **Instance dédiée** | Nous — une installation par client | Clients plus importants, besoin d'isolement | Moyen |
| **Sur les serveurs du client** | Sa DSI | Collectivités qui l'exigent | Le plus élevé : versions, accès, support à distance |

**Recommandation : construire pour le service mutualisé d'abord**, hébergé en France ou dans l'Union européenne, **mais emballé de façon à ce qu'une instance dédiée ou une installation sur site soit le même logiciel avec une autre configuration** : un conteneur (Docker) pour l'application, une base PostgreSQL, tout le paramétrage par variables d'environnement. Ne pas commencer par le « sur site ».

## 4. L'architecture cible, et comment on y va sans casser l'existant

```
 navigateur : les pages actuelles (inchangées)          serveur
 ┌─────────────────────────────────────────┐      ┌───────────────────────────────┐
 │ 24 pages HTML  →  assets/stockage.js ───┼─API──┤ authentification · droits      │
 │                   (VigieStore : cache)  │      │ données par organisation       │
 └─────────────────────────────────────────┘      │ journal d'audit · sauvegardes  │
                                                  │ PostgreSQL                     │
                                                  └───────────────────────────────┘
```

**Le basculement de `VigieStore`.** Aujourd'hui `getItem`/`setItem` lisent et écrivent le navigateur, de façon synchrone. Demain :

1. au chargement d'une page, `VigieStore` récupère auprès du serveur les clés dont l'organisation a besoin (registre `CLES`, nature « donnees » et « parametres ») et les garde en mémoire ;
2. `getItem` lit cette mémoire — **toujours synchrone, les pages ne changent pas** ;
3. `setItem` met à jour la mémoire et envoie l'écriture au serveur (avec une file d'attente si le réseau manque) ;
4. les clés « preference » (menu épinglé, ville de la météo) restent locales ; les « journal » deviennent des ajouts côté serveur.

**Le seul changement dans les pages** : leur script doit attendre que la mémoire soit chargée (`VigieStore.pret()`) avant de démarrer — une modification mécanique, de même nature que celles déjà faites pour l'échappement ou les dates, et vérifiable de la même façon (rendu avant/après).

**Ce qui se déplace vers le serveur** : la vérification des droits (les rôles et les permissions par module existent déjà — `ETAT-DU-PROJET.md` §7 — ils deviennent des règles appliquées par le serveur, la page ne faisant plus qu'afficher), les mots de passe (hachés, jamais en clair), le journal d'audit, la séparation des organisations. Le motif « always-merge seed + stockage » garde son sens pour les **paramètres par défaut** (référentiels, modèles) ; les **données de démonstration** ne vivront plus que dans une organisation de démonstration.

**Deux personnes qui modifient les mêmes données en même temps** — tranché à l'étape P1a (§4 bis) : ni « le dernier qui enregistre gagne », ni un refus systématique. Chaque registre porte un numéro de version ; si quelqu'un a enregistré entre-temps, les deux modifications sont **fusionnées enregistrement par enregistrement, puis champ par champ**. Seul le même champ du même enregistrement modifié différemment des deux côtés est refusé — la seconde personne en est avertie, rien n'est écrasé.

## 4 bis. Étape P1a — le serveur local (fait le 2026-09-24)

**Ce que c'est.** Un petit serveur Node (`serveur/serveur.js`, aucune dépendance à installer — Node 22.5 ou plus récent suffit) qui sert les pages et garde les données dans une base **SQLite** : un seul fichier, `serveur/donnees/vigie.db`, jamais versionné (`.gitignore`). Lancement, depuis la racine du dépôt :

```
node serveur/serveur.js
```

puis ouvrir http://localhost:8780. Plusieurs onglets, plusieurs navigateurs ou plusieurs comptes sur ce poste voient **les mêmes données**, et elles survivent à la fermeture du navigateur.

**Comment ça marche, sans toucher aux pages.** En servant une page, le serveur glisse juste avant `assets/stockage.js` l'état de la base (`window.__VIGIE_SERVEUR__`). `VigieStore` le voit et bascule : `getItem` lit cet état (toujours synchrone), `setItem` envoie l'écriture au serveur **de façon synchrone**, comme `localStorage` — une page qui enregistre puis change d'écran ne perd donc pas sa saisie, et l'étape `VigieStore.pret()` prévue au §4 n'est pas nécessaire. Ouverte sans ce serveur (fichier local, GitHub Pages), une page garde exactement son stockage navigateur d'avant. Les préférences d'appareil (menu épinglé, ville de la météo) restent dans le navigateur.

**Écritures simultanées.** Chaque clé a une révision ; le serveur refuse une écriture faite sur une révision périmée, et la page fusionne alors sa modification avec la version actuelle (voir §4) avant de réessayer. Mesuré : deux ajouts simultanés dans le même registre sont gardés tous les deux, une page restée ouverte sur une vieille liste n'efface pas l'ajout de l'autre, le même champ modifié des deux côtés est refusé avec un bandeau. Le journal d'audit, écrit par toutes les pages, se fusionne de la même façon (ajouts des deux côtés).

**Garde-fous.**
- Chaque écriture garde l'ancienne valeur (les 20 dernières par registre, table `historique`) ; « Réinitialiser les données » prend d'abord une **copie complète de la base** (`serveur/donnees/sauvegarde-avant-effacement-….db`) — et le message de confirmation dit que l'effacement vaut pour tous les utilisateurs.
- Serveur arrêté ou injoignable : bandeau « la dernière modification n'a PAS été enregistrée », jamais de perte silencieuse.
- Le serveur n'écoute que ce poste (127.0.0.1), refuse un autre nom d'hôte que `localhost` (un site piégé ne peut pas se faire passer pour lui), exige un en-tête propre à l'application pour écrire (un autre site ne peut pas écrire à sa place), et ne sert ni les fichiers cachés du dépôt (`.git` contient le jeton du dépôt distant) ni sa propre base.
- La base est le seul fichier qui connaît SQLite (`serveur/base-sqlite.js`, quatre fonctions) : passer à PostgreSQL remplacera ce fichier, ni le serveur ni les pages.

**Ce que P1a ne faisait pas — fait depuis en P1b (§4 ter).** Pas d'authentification côté serveur (les rôles étaient vérifiés par les seules pages) ; c'est pourquoi il n'écoute que ce poste — **et il ne s'ouvrira au réseau qu'avec HTTPS** (étape P1c). Pas encore de séparation des organisations (P3). Les écritures synchrones sont idéales sur un même poste ; à travers Internet, P1b devra mesurer si elles restent assez rapides ou s'il faut une file d'attente. Enfin, les données déjà saisies dans un navigateur n'y sont pas transférées d'office : on les reprend avec les exports Excel et le kit de reprise.

**Vérifié** (harnais `test-serveur.js` et `test-fusion.js`, dans le vrai serveur avec une base jetable) : les 24 pages, deux fois chacune, avec leurs données de test : 0 erreur, mêmes registres et mêmes nombres d'enregistrements qu'en mode navigateur ; 20 cas de fusion ; sécurité (hôte étranger, écriture sans en-tête, `.git`, base, sortie du dépôt, clé inconnue) ; valeur piégée `</script>` relue à l'identique sans être exécutée ; réinitialisation avec copie ; serveur arrêté ; redémarrage. Mode navigateur inchangé : `usage-normal.js` (120 visites, 0 erreur), `aller-retour.js`, `test-stockage.js`. Contrôlé aussi dans un vrai Chromium.

## 4 ter. Étape P1b — connexion et droits sur le serveur (fait le 2026-09-24)

**Ce qui était faux jusque-là, en mode serveur.** La liste des comptes — mots de passe en clair compris — était envoyée à chaque page, même à l'écran de connexion : quiconque atteignait le serveur pouvait les lire. La connexion se faisait dans la page, et le serveur ne vérifiait ni qui écrivait ni quoi : un agent « en lecture seule » l'était parce que les boutons étaient cachés, un appel direct à l'API pouvait tout écrire.

**La connexion** (`serveur/comptes.js`). L'écran de connexion envoie identifiant et mot de passe au serveur, qui les vérifie et répond avec la même session qu'avant (rôle, services, permissions) : les 24 pages n'ont pas changé. Le navigateur reçoit un cookie de session **illisible par les pages** (HttpOnly, SameSite=Strict), valable tant qu'on s'en sert (8 h sans activité et il faut se reconnecter) ; la base n'en garde que l'empreinte. La session est recopiée depuis le serveur à chaque page : un rôle trafiqué dans le navigateur est remplacé. Aller sur l'écran de connexion — ce que fait le bouton « Déconnexion » de toutes les pages — ferme la session côté serveur. Un compte désactivé ou supprimé perd sa session ouverte. Cinq échecs de suite sur un identifiant : cinq minutes de pause.

**Les mots de passe.** Ils ne sont plus jamais dans les données : quand Administration enregistre un compte avec un mot de passe (création, réinitialisation), le serveur en range l'**empreinte** (scrypt, salée) dans sa propre table et le retire de la liste avant de l'enregistrer. Ni les données, ni leur historique, ni ce que reçoivent les pages ne contiennent de mot de passe ; une base écrite avant P1b est nettoyée au démarrage, historique compris. **Premier lancement** (base sans aucun compte) : l'écran de connexion y inscrit les comptes de démonstration, comme dans un navigateur — depuis ce poste seulement. Tant que le mot de passe de démonstration de l'administrateur fonctionne, le serveur l'annonce à chaque démarrage : il est publié dans le dépôt, à changer avant tout usage réel.

**Les droits d'écriture** (`serveur/droits.js`), relevés page par page sur les écrans (`ETAT-DU-PROJET.md` §7) :
- Administration (comptes, référentiels, Flash Info, veille) et la réinitialisation générale : administrateur seul.
- Modules à permission granulaire : RH et administrateurs, ou la permission accordée en écriture.
- **Ajout seul** — ajouter sans modifier ni retirer ce qui existe : le Registre SST pour tous (chacun peut y déposer une observation, seuls RH et administrateurs y répondent), les journaux pour tous (chacun y laisse la trace de ses actions, personne d'autre que RH/admin ne peut les effacer), la déclaration d'AT/MP avec la permission « Déclarer ».
- Tout le reste : RH et administrateurs.

Les pages écrivent parfois d'elles-mêmes (fusion de valeurs par défaut, import des données de démonstration). Mesuré : un agent qui arrive le premier sur une base neuve déclenchait ainsi des écritures dans presque tous les registres. La page reçoit donc les droits de son compte : une écriture automatique non autorisée reste dans la page, sans alerte ; après un clic ou une frappe, c'est une vraie action, et un refus s'affiche (« votre compte n'a pas le droit… »). Le serveur refuse de toute façon, et trace chaque refus dans son journal.

**Comptes anonymisés (2026-09-25, module 13).** Un compte coché « anonymisé » dans Administration — pour un représentant du personnel, réponse du préventeur à la question 16 — ne reçoit du serveur aucune donnée de santé : les dossiers AT/MP, arrêtés, analyses d'accident, visites et rendez-vous médicaux ne lui sont pas transmis, et le registre AT/MP lui arrive réduit (service, mois, type, arrêt, jours, famille de risque ; ni nom, ni lésion), réponses de conflit comprises. Il ne peut qu'y ajouter, et ses ajouts sont greffés sur le registre complet qu'il n'a jamais reçu (`serveur/anonymisation.js`, vérifié par `test-anonymisation.js`, 13/13). C'est la première lecture filtrée par le serveur ; le périmètre d'un manager viendra en P1c.

**Ce que P1b ne faisait pas — fait depuis en P1c (§4 quater).** Pas de HTTPS (le mot de passe circulait en clair : sans risque sur un même poste, exclu sur le réseau) ; lectures non filtrées (un manager recevait tous les registres, c'était l'écran qui n'affichait que ses services) ; nom d'une ligne du journal d'audit venu de la page.

**Vérifié** : `test-serveur.js` 44/44 (pages derrière la connexion, empreintes sans mot de passe, cookie HttpOnly, jeton seulement haché en base, pause après cinq échecs, changement de mot de passe, compte désactivé, déconnexion, rôle trafiqué, reprise d'une base d'avant P1b), `test-droits.js` 25/25 (agent premier sur une base neuve, quatre comptes × 23 pages sans erreur ni bandeau, contournements par l'API refusés, ajouts seuls acceptés, refus annoncé seulement après une action). Le harnais émule les requêtes synchrones du navigateur avec un pot de cookies par personne : celui de l'outil de test (jsdom) mélangeait les sessions entre fenêtres.

## 4 quater. Étape P1c — ouverture au réseau (fait le 2026-09-25)

**Chacun ne reçoit que son périmètre** (`serveur/perimetre.js`). Un compte limité à certains services — un manager, un RH d'une direction — ne reçoit plus du serveur que les enregistrements de ses services : API, état glissé dans la page, réponses de conflit. Une règle unique pour tous les registres : un enregistrement dont le champ `service` nomme un service hors du périmètre n'est pas transmis ; ce qui n'a pas de service (référentiels, modèles, catalogues, trames) l'est, comme avant. En écriture, le compte ne renvoie que sa part, greffée sur le registre complet : il ne peut ni toucher un enregistrement qu'il ne voit pas (même en reprenant son identifiant), ni en créer un hors de ses services, et effacer un registre n'efface que sa part. Les enregistrements des autres services gardent leur version et leur place.

Mesuré avant et après, pour le manager et pour un RH limité à un service, sur chacune des 25 pages : 19 pages identiques au caractère près. Les 6 autres :
- Administration (jauge de stockage) et la vitrine (état glissé) : moins de données reçues — attendu.
- EPI : la liste « Dotation concernée » du lavage proposait les dotations des agents **des autres services** — une fuite, close.
- Tableau de bord : la carte Registre SST comptait les observations de toute la collectivité (15) alors que le registre n'affiche que celles du compte (4) ; elle compte désormais les mêmes.
- **Reporting et indicateurs du Dialogue social** : ils montraient à un tel compte les chiffres de toute la collectivité ; ils portent désormais sur ses services, et un avertissement le dit — « Périmètre : vos services (…) — les chiffres ne portent que sur eux », à l'écran et sur le rapport imprimé — pour qu'un chiffre partiel ne soit pas présenté comme celui de toute la collectivité. Un compte qui doit présenter les chiffres de tous les services (en F3SCT) reçoit « tous services » dans Administration.

**Journal d'audit signé par le serveur** : le nom inscrit dans une ligne nouvelle est celui de la session, pas celui qu'envoie la page ; les lignes existantes ne changent pas.

**Ouverture au réseau** — variables d'environnement, données au lancement de `node serveur/serveur.js` :

| Variable | Rôle |
|---|---|
| `VIGIE_CERT`, `VIGIE_CLE` | Certificat et clé (fichiers PEM) : le serveur parle HTTPS lui-même |
| `VIGIE_HTTPS=1` | Ou bien : derrière un proxy HTTPS (IIS, nginx, Caddy…) qui lui transmet les requêtes |
| `VIGIE_ECOUTE` | Adresse d'écoute — `127.0.0.1` par défaut (ce poste seul), `0.0.0.0` pour le réseau |
| `VIGIE_HOTES` | Noms sous lesquels on l'appelle, séparés par des virgules (`vigie.mairie.local`), acceptés avec ou sans port |

Le serveur **refuse de démarrer** ouvert au réseau (`VIGIE_ECOUTE` autre que ce poste, `VIGIE_HOTES` ou `VIGIE_HTTPS` donnés) : sans HTTPS ; sans aucun compte (les créer d'abord sur ce poste seul) ; tant qu'un des sept comptes de démonstration garde son mot de passe publié dans le dépôt (il les nomme — les changer ou les désactiver dans Administration, sur ce poste seul). En HTTPS : cookie de session `Secure`, en-tête HSTS. Un nom d'hôte qui n'est pas dans la liste reste refusé (421). La création des comptes au premier lancement exige, en plus de l'adresse de ce poste, un nom local : derrière un proxy installé sur le même poste, l'adresse seule ne suffisait pas. Enfin, seuls les types de fichiers de l'application sont servis (pages, scripts, styles, images, `.xlsx`, `.md`) : une clé de certificat ou une copie de base posée par erreur dans le dossier ne sort pas.

Sous Windows, la première écoute sur le réseau fait demander par le pare-feu l'autorisation d'ouvrir le port — c'est à l'administrateur du poste d'y répondre.

**Sauvegardes planifiées** (`serveur/sauvegardes.js`) : une copie complète au démarrage si la dernière a plus d'un intervalle, puis à chaque intervalle, prise sans arrêter le serveur (`VACUUM INTO`) ; les plus anciennes au-delà du nombre gardé sont supprimées. `VIGIE_SAUVEGARDES` (dossier, `serveur/donnees/sauvegardes` par défaut), `VIGIE_SAUVEGARDE_HEURES` (24 ; 0 les désactive), `VIGIE_SAUVEGARDES_GARDER` (14). **Restaurer** : arrêter le serveur, remplacer `serveur/donnees/vigie.db` par la copie choisie (supprimer `vigie.db-wal` et `vigie.db-shm` s'ils existent), relancer. Une copie sur le même disque protège d'une erreur ou d'une base abîmée, pas d'une panne du disque : le dossier doit être recopié ailleurs, ou pointer vers un autre disque.

**Ce qui reste pour le pilote (P2)** : un vrai poste du réseau avec un certificat au vrai nom (autorité de la collectivité, ou Let's Encrypt derrière un proxy) ; la copie des sauvegardes hors du disque ; PostgreSQL si l'hébergeur l'impose (seul `serveur/base-sqlite.js` change). La liste des comptes (`vigie_hse_users` : identifiants, rôles, services — jamais de mot de passe) reste transmise à tout compte connecté : à restreindre avant plusieurs organisations (P3).

**Vérifié** : `test-perimetre.js` 29/29 (greffe : modification, suppression, écrasement d'un enregistrement invisible, création hors périmètre, registre absent ; API, page et réponse 409 filtrées ; dépôt SST du manager et modification d'un RH limité sans rien perdre des autres services ; journal signé), photo des 25 pages avant/après pour deux comptes limités, `test-reseau.js` 22/22 (certificat de test : les quatre refus de démarrer, HTTPS sous le nom configuré, HSTS, 421, pas de réponse en clair, ancien mot de passe publié refusé, cookie `Secure`, clé `.pem` non servie, sauvegarde au démarrage sans doublon, copie identique à la base révisions et empreintes comprises, rotation), et les suites précédentes inchangées (`test-serveur.js` 44/44, `test-droits.js` 30/30, `test-anonymisation.js` 13/13, `test-fusion.js` 20/20).

## 5. Les étapes

| Étape | Contenu | Condition pour passer à la suivante |
|---|---|---|
| **P0 — fait** | Point de passage unique, kit de reprise, imports fiables, V1.0 du prototype | Checklist QA V1 déroulée en direct, regard d'un professionnel externe |
| **P1a — fait (2026-09-24)** | Serveur local : API, base SQLite, bascule de `VigieStore`, fusion des écritures simultanées (§4 bis) | Toutes les pages fonctionnent à l'identique sur le serveur — **vérifié** |
| **P1b — fait (2026-09-24)** | Connexion vérifiée par le serveur, mots de passe hachés, aucune donnée sans session, droits d'écriture appliqués par le serveur (§4 ter) | Mêmes harnais, plus : un compte sans droit n'écrit pas un registre par l'API — **vérifié** |
| **P1c — fait (2026-09-25)** | HTTPS (natif ou derrière un proxy), adresse d'écoute et noms d'hôte configurables, refus de s'ouvrir tant que ce n'est pas sûr, lectures filtrées au périmètre d'un compte, journal signé par le serveur, sauvegardes planifiées (§4 quater) ; PostgreSQL si l'hébergement l'impose | Un manager ne reçoit que ses services — **vérifié** ; HTTPS sous un nom configuré — **vérifié sur ce poste** (un vrai poste du réseau : au pilote) |
| **P2 — pilote** | Un premier client réel, hébergement France/UE, reprise de ses données avec le kit | Sauvegardes testées (restauration comprise), retours du pilote traités |
| **P3 — plusieurs clients** | Séparation des organisations, vocabulaire configurable (jalon J0 de la roadmap : collectivités **et** privé) | Deux organisations en service sans fuite de l'une à l'autre |
| **P4 — autres déploiements** | Instance dédiée, puis installation sur site si un client l'exige | — |

## 6. Hébergement et conformité — à vérifier, pas à supposer

- **Données sensibles.** L'application contient des données qui relèvent probablement de l'**article 9 du RGPD** (santé) : la nature et le siège des lésions dans le Registre AT/MP, les dossiers AT/MP & CITIS (certificats, taux d'IPP), le suivi des visites médicales et les rendez-vous. Le registre `VigieStore.CLES` marque ces clés (`sensible:true`).
- **HDS.** En France, héberger des données de santé peut imposer un hébergeur certifié **HDS** (*Hébergeur de Données de Santé*). **Savoir si c'est notre cas est une question juridique** — pour un juriste ou le délégué à la protection des données d'un client, pas pour nous ni pour le préventeur. La réponse conditionne la liste des hébergeurs possibles ; elle est à obtenir **avant** de choisir l'hébergement.
- **Minimiser.** Moins l'application détient de données de santé, plus la question est simple. D'où la question posée au préventeur (question 14 du Cahier) : quelles informations médicales sont réellement nécessaires à la prévention ?
- **Analyse d'impact (AIPD).** Un traitement de données de santé à grande échelle appelle en général une analyse d'impact relative à la protection des données ; à confirmer avec le même interlocuteur.
- **Hébergeurs** candidats, en France : OVHcloud, Scaleway, Outscale, entre autres — plusieurs ont des offres certifiées HDS ; certaines collectivités exigent en plus la qualification SecNumCloud.

## 6 bis. Volume : « tout l'historique » dans un navigateur

Le préventeur demande de reprendre **tout l'historique** d'un client (question 13). Mesuré sur les données de démonstration : **865 caractères par accident**, 445 par ligne du document unique, environ 1 000 par inspection, 285 par habilitation, 260 par suivi de visite. Pour une collectivité moyenne (quinze ans d'accidents, 850 agents avec habilitations et EPI, plusieurs années d'inspections, un journal d'audit qui ne fait que grandir), l'ordre de grandeur est de **3,5 à 4 millions de caractères** — or un navigateur accorde **environ 5 millions** à un site (et GitHub Pages partage ce quota entre tous les sites d'un même compte). **La reprise d'un historique complet chez un vrai client est donc un argument de plus pour le serveur de l'étape P1**, pas pour le prototype. En attendant, un enregistrement refusé faute de place affiche un bandeau au lieu d'être perdu.

## 7. GitHub : dépôt privé et site en ligne

- **Rendre le dépôt privé est gratuit** (les dépôts privés sont inclus dans l'offre gratuite de GitHub) : cela cache le code.
- Mais **GitHub Pages depuis un dépôt privé demande un abonnement payant** (GitHub Pro ou supérieur), **et le site publié reste accessible à qui a l'adresse** : payer GitHub cache le code, pas l'application.
- Surtout, **GitHub Pages ne sert que des fichiers** : pas de base de données, pas d'authentification réelle — il ne peut pas être l'hébergement d'un produit en service, seulement celui de la démonstration.
- **Conséquence pratique** : garder la démonstration sur GitHub Pages tant qu'elle sert (le Cahier du préventeur et la checklist y renvoient), et prévoir le vrai hébergement à l'étape P1. Avant de passer le dépôt en privé, vérifier que le lien de démonstration n'est pas utilisé (sans abonnement, il cesserait de fonctionner).
- **À faire dans tous les cas** : le jeton d'accès (PAT) est inscrit dans l'adresse du dépôt distant de ce poste ; ce n'est pas grave tant qu'il reste sur ce poste, mais un jeton à durée limitée et à droits restreints au seul dépôt est préférable.

## 8. Décisions à prendre

| Décision | Qui | Pourquoi maintenant |
|---|---|---|
| Profil du premier client (collectivité ? entreprise ? taille ?) | Porteur du projet | Il fixe l'hébergement, le vocabulaire et le modèle de déploiement |
| Hébergement HDS nécessaire ou non | Juriste / délégué à la protection des données — le préventeur n'en a pas encore sollicité (question 14) | Conditionne le choix de l'hébergeur |
| Données de santé réellement nécessaires | Délégué à la protection des données (le préventeur l'a renvoyée vers lui, question 14) | Moins on en garde, plus tout est simple |
| ~~Données qu'un client apporte, et combien d'années d'historique~~ | Tranché (question 13) : tout l'historique, tout type de fichier ; la priorité entre les 17 fichiers reste à préciser | — |
| Dépôt privé, et où garder la démonstration | Porteur du projet | Voir §7 |
