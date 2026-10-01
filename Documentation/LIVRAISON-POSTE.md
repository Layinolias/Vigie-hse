# Livraison sur le poste d'un utilisateur

Remettre VIGIE HSE à quelqu'un — le collègue préventeur d'abord — pour qu'il l'essaie **sur son propre ordinateur, avec ses propres données**. Mis en place le 2026-09-25. Pour un serveur partagé sur un réseau, voir `PLAN-MISE-EN-PRODUCTION.md` (§4 quater).

## Ce que reçoit l'utilisateur

Un fichier `VIGIE-HSE-AAAA-MM-JJ.zip` (≈ 600 Ko), préparé par `node serveur/preparer-livraison.js`, qui contient :

- les pages, `assets/` (bibliothèque Excel comprise), le serveur (`serveur/*.js`) et `KIT-REPRISE/` (un modèle Excel par module) ;
- `Lancer VIGIE HSE.bat` — le double-clic qui lance tout (`serveur/lancer-poste.js`) ;
- `Restaurer une sauvegarde.bat` — revenir à une sauvegarde sans manipuler de fichier (`serveur/restaurer.js`, depuis le 2026-09-29) : refus si VIGIE HSE tourne (repère « base en service » posé par le serveur, puis vérifié de nouveau juste avant de remplacer la base), liste des copies avec leur date et leur contenu, copie choisie vérifiée (intégrité SQLite) avant toute modification, confirmation par « OUI », données actuelles mises de côté d'abord (`sauvegardes\vigie-avant-restauration-….db`, 5 gardées — une restauration se défait avec le même outil), aucun `-wal`/`-shm` résiduel ; le journal des consultations et le journal d'audit ne reviennent pas en arrière (leurs lignes postérieures sont reprises, une ligne dit la restauration) ;
- `LISEZ-MOI.txt` — son guide, en français, sans rien de technique : installer Node.js, lancer, première connexion, changer les mots de passe, adapter les référentiels, importer ses données, où sont ses données, installer une nouvelle version, restaurer une sauvegarde, confidentialité ;
- `VERSION.txt` — la date et le commit du paquet (à demander en cas de problème).

N'y entrent **pas** : la documentation interne (`Documentation/`, `CLAUDE.md`), les fichiers de démonstration (`DATATEST/`), aucune base, ni l'outil de préparation. Seuls les fichiers suivis par git y entrent ; le script refuse un dossier de travail non commité (sauf `--brouillon`, pour un essai).

Prérequis chez lui : **Node.js 22.5 ou plus récent** (version « LTS » de nodejs.org) — le lanceur le dit et ouvre la page de téléchargement s'il manque.

## Comment ses données sont protégées

**Hors du dossier de l'application.** Le lanceur range la base et les sauvegardes dans `C:\Users\<nom>\VIGIE HSE\` (`vigie.db`, `sauvegardes\`, `version-application.txt`). Installer une nouvelle version = supprimer l'ancien dossier de l'application et décompresser le nouveau : les données ne sont pas dedans. Pas dans « Documents » : ce dossier est souvent synchronisé avec OneDrive, et des données de santé n'ont pas à partir dans un nuage sans décision de la collectivité.

**Une copie avant chaque nouvelle version.** Au démarrage, le serveur calcule l'empreinte de ses fichiers (pages, `assets/*.js`, `serveur/*.js`) ; si elle diffère de celle notée à côté de la base, il copie la base (`sauvegardes\vigie-avant-mise-a-jour-….db`) **avant** qu'elle ne serve à la nouvelle version. Les 5 dernières sont gardées, hors de la rotation quotidienne (`serveur/sauvegardes.js`, `avantMiseAJour`). S'y ajoutent les sauvegardes quotidiennes (14 gardées). Rien à numéroter à la main : toute modification d'un fichier de l'application compte comme une nouvelle version.

**Le test de mise à jour, avant de remettre un paquet.** `test-mise-a-jour.js <commit>` (scratchpad, harnais jsdom) : l'ancienne version — extraite du dépôt au commit du dernier paquet remis — remplit une base (tous les modules, plus une saisie), puis la nouvelle version démarre dessus. Il vérifie : copie « avant mise à jour » prise et identique à la base ; comptes et mots de passe repris ; les 25 pages s'ouvrent sans erreur ; **aucun registre et aucun enregistrement perdu** (par identifiant) ; la saisie intacte ; pas de seconde copie au redémarrage. Passé le 2026-09-25 depuis `HEAD` et depuis `ae512f8` (avant P1c) : 8/8, aucun registre réécrit.

**Mise à jour et profils de droits (2026-10-01).** Une base d'avant les profils garde ses comptes tels quels : ils sont lus à l'ancien format (rôle + permissions de module) et donnent **exactement les mêmes droits qu'avant**. À la première ouverture d'Administration, ils sont convertis en profils (ligne « Comptes convertis au modèle de profils » dans le journal) ; `role` et `modulePermissions` restent sur chaque fiche, de sorte qu'une restauration d'une sauvegarde d'avant la mise à jour fonctionne. Le serveur lit désormais `assets/droits.js` : le fichier fait partie des indispensables du paquet.

**Pas de données de démonstration.** Servies par le serveur, les pages importent d'elles-mêmes les fichiers de `DATATEST/` : les données fictives de Verchamps se seraient mêlées aux siennes. Le lanceur pose `VIGIE_DEMO=0` : le serveur ne sert plus `DATATEST/` (404), et les registres restent vides. Mesuré sur une base neuve : seuls les comptes et le contenu de référence s'y trouvent (fiches de risque, types de document, modèles d'accueil et de convocation, veille).

**Le navigateur ne garde rien.** Mesuré en mode serveur, 25 pages ouvertes avec écritures : `localStorage` vide, `sessionStorage` = le seul repère de connexion (nom, profils, droits par module, services — environ 650 caractères depuis les profils de droits, effacé à la fermeture de l'onglet) ; aucune page de l'application ne touche `localStorage` directement (règle 14) ; toutes les réponses portent `Cache-Control: no-store`. Seules deux préférences d'affichage peuvent y aller (menu épinglé, ville de la météo). Restent hors de l'application : les exports Excel/PDF qu'il fait lui-même (dossier Téléchargements), et le mot de passe si le navigateur propose de le retenir.

**Sans Internet.** La bibliothèque Excel (SheetJS 0.18.5, licence Apache-2.0) est embarquée dans `assets/xlsx.full.min.js` — copie identique à l'octet près de celle de cdnjs, d'où les pages la chargeaient jusque-là : un poste sans Internet, ou derrière un proxy de collectivité qui bloque le CDN, n'aurait pu ni importer ni exporter. Les polices aussi sont embarquées depuis le 2026-09-29 (`assets/polices/`, licence SIL OFL 1.1) : chargées jusque-là depuis Google Fonts, elles transmettaient à Google l'adresse IP du poste à chaque page affichée. Seule va encore sur Internet, sans aucune donnée : la météo du tableau de bord (Open-Meteo), et seulement si l'utilisateur choisit une ville — aucune n'est choisie d'office ; le panneau de la météo dit ce qui est envoyé, et « Ne plus afficher la météo » l'arrête (2026-09-29).

## Préparer et remettre un paquet

1. Commiter.
2. `node test-mise-a-jour.js <commit du dernier paquet remis>` (tableau ci-dessous) : 0 KO.
3. `node test-paquet.js` : le paquet préparé, décompressé dans un dossier vide et lancé par son lanceur — contenu (ni documentation, ni démonstration, ni base), fins de ligne Windows du lanceur et du guide, **le `.bat` exécuté par `cmd.exe` sans aucun message d'erreur** (le 2026-09-27 : un `>nul` réécrit en `>/dev/null` à la création du fichier faisait afficher « Le chemin d'accès spécifié est introuvable » à chaque lancement, et rendait muette la détection de Node.js absent — ne jamais écrire le `.bat` par une commande shell), aucun avertissement technique au lancement, première connexion, 25 pages sans erreur, bibliothèque Excel servie par le poste, registres vides, données hors du dossier de l'application, puis dossier de l'application supprimé et remplacé : données et comptes toujours là, copie « avant mise à jour » prise ; l'outil de restauration présent, avec ses fins de ligne Windows ; les polices fournies par le paquet, aucune page ne les demandant à Google. 17/17 le 2026-09-29.
4. `node test-restauration.js` : l'outil de restauration essayé comme un utilisateur sur un vrai dossier de données — refus si VIGIE HSE tourne, annulations et numéro invalide sans effet, copie abîmée refusée avant toute modification, restauration complète (un `-wal` résiduel éliminé), VIGIE HSE qui redémarre dessus, restauration défaite, rotation des copies mises de côté, repère « base en service » (processus vivant : refus, même sur un autre port ; processus disparu : ignoré ; VIGIE HSE lancé : refus), journaux reportés, et le `.bat` exécuté par `cmd.exe` sans message d'erreur. 22/22 le 2026-09-29.
5. `node serveur/preparer-livraison.js` → `livraison/VIGIE-HSE-AAAA-MM-JJ.zip` (dossier hors dépôt).
6. Remettre le zip, noter la version ci-dessous.

| Date | Commit | Remis à | Remarque |
|---|---|---|---|
| — | — | — | Aucun paquet remis pour l'instant |

## Avant qu'il y mette de vraies données

- **Données de santé sur un ordinateur personnel.** Le registre AT/MP et les visites médicales sont des données de santé de la collectivité. Les garder sur un ordinateur personnel est une question pour le délégué à la protection des données, pas encore sollicité (question 14). Plus sûr : l'ordinateur professionnel, ou des données où les noms sont remplacés par des codes.
- **Comptes de démonstration.** Leurs mots de passe sont publiés dans le dépôt. Le serveur n'écoute que le poste (personne d'autre ne peut s'y connecter), mais le guide fait changer celui de l'administrateur et désactiver les autres dès la première connexion.
- **Deux structures fixes.** L'application distingue « Ville » et « Agglomération » (jalon J0 de la roadmap) : une organisation différente devra ranger ses services au mieux.

## Essai en direct

Double-clic sur `Lancer VIGIE HSE.bat` (depuis un paquet décompressé, pas depuis le dépôt : lancé depuis le dépôt, il servirait aussi les fichiers de développement). Le lanceur ne fait qu'ouvrir le navigateur s'il tourne déjà. Variables pour les essais : `VIGIE_DOSSIER` (dossier des données), `PORT`, `VIGIE_NAVIGATEUR=0`.
