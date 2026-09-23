# Plan de mise en production

> Rédigé le 2026-09-23, à la demande du porteur du projet : « comment se rapprocher d'un produit en service, faut-il un serveur privé, comment couvrir plusieurs types de déploiement, comment reprendre les données d'un client ». Ce document pose le chemin ; les décisions qu'il appelle sont listées à la fin.

## 1. Où on en est

VIGIE HSE est aujourd'hui un **prototype complet côté écran** (24 pages, 16 modules sur 18) dont **toutes les données vivent dans le navigateur** (`localStorage`). C'est parfait pour une démonstration, et c'est ce qui l'empêche d'être un produit :

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
- **Stockage plein signalé** : un enregistrement refusé faute de place n'est plus perdu en silence (bandeau), et `VigieStore.occupation()` mesure l'espace utilisé.

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

**Question ouverte, à trancher à ce moment-là** : deux personnes qui modifient le même enregistrement en même temps. Le plus simple (« le dernier qui enregistre gagne ») convient au démarrage ; un contrôle de version par enregistrement évitera ensuite d'écraser sans le savoir.

## 5. Les étapes

| Étape | Contenu | Condition pour passer à la suivante |
|---|---|---|
| **P0 — fait** | Point de passage unique, kit de reprise, imports fiables, V1.0 du prototype | Checklist QA V1 déroulée en direct, regard d'un professionnel externe |
| **P1 — serveur minimal** | API + PostgreSQL + authentification, une seule organisation, bascule de `VigieStore` | Toutes les pages fonctionnent à l'identique sur le serveur (mêmes harnais qu'aujourd'hui) |
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
