# Scénario de démonstration — 20 minutes

Pour présenter le logiciel à un professionnel de la prévention qui ne le connaît pas (dernier point de la sortie V1.0, `PLAN-VERSIONS-V1.md`). Une seule histoire, du terrain jusqu'à la direction : un presque-accident signalé, l'action qui en sort, l'accident analysé, les chiffres, puis la préparation ISO 45001.

> Document rédigé avec l'aide d'une IA (Claude, d'Anthropic) et relu par le porteur du projet, qui en reste responsable ; le logiciel est développé avec un assistant de programmation à base d'IA (Claude Code). Mention faite par transparence, dans l'esprit du règlement (UE) 2024/1689. Personnes, lieux et faits de la démonstration sont fictifs.
>
> Version en ligne (document partageable) : https://claude.ai/artifact/7EyoBruBNfSuQLybduW2yU — présentation de 8 diapositives pour ouvrir et conclure : https://claude.ai/artifact/5nyp91zdqtqjj2Fsnb5m2U

## Avant la démonstration (10 minutes, le jour même)

1. Ouvrir une **fenêtre de navigation privée** (Chrome, Edge ou Firefox à jour), sur ordinateur, écran d'au moins 1 280 pixels de large. Les données de démonstration vivent dans cette fenêtre : la garder ouverte jusqu'à la fin, ne pas la fermer entre deux scènes.
2. Aller sur https://layinolias.github.io/Vigie-hse/ puis « Se connecter » : `admin@verchamps.fr` / `admin1234`. À cette connexion, les registres des modules récents se remplissent (`DATATEST/13-DEMO-modules.json` : signalements, objectifs, politique, conformité, audit interne, revue de direction, rôles, contexte, communication, engagement de la direction, une analyse d'accident, des actions, des Flash Info). Leurs dates sont calculées à partir du jour même.
3. **Tour de chauffe** : ouvrir une fois chacune de ces pages, dans cet ordre, depuis le menu — chacune charge son fichier de démonstration : Registre AT/MP, Document unique, Registre SST, Santé & Visites, Vérifications périodiques, Inspection / Audit, Produits chimiques, Formation / Habilitation, EPI & Dotation, Situations d'urgence, Dossiers AT/MP, Indicateurs & Reporting, et **en dernier** Plan d'actions (il rassemble les actions de tous les autres : 37).
4. Revenir au tableau de bord : les compteurs sont remplis. Se déconnecter. Tout est prêt.

Pour recommencer à zéro (deux démonstrations de suite) : Administration → « Réinitialiser toutes les données », puis se reconnecter et refaire le tour de chauffe.

## Les comptes

| Compte | Mot de passe | Joue le rôle de |
|---|---|---|
| `AG1` | `1234` | un agent de terrain |
| `manager@verchamps.fr` | `manager1234` | un chef de service (Voirie & Réseaux, Espaces Verts & Paysage) |
| `PREV1` | `1234` | le préventeur |
| `admin@verchamps.fr` | `admin1234` | la direction et l'administrateur |

## Le fil

| # | Durée | Compte | Pages |
|---|---|---|---|
| 1 | 1 min | — | Vitrine, connexion |
| 2 | 2 min | admin | Tableau de bord |
| 3 | 4 min | AG1 puis manager | Signalements |
| 4 | 3 min | PREV1 | Plan d'actions |
| 5 | 3 min | PREV1 | Registre AT/MP, Analyse d'accident, Document unique |
| 6 | 2 min | admin | Indicateurs & Reporting |
| 7 | 4 min | admin | Politique, Objectifs, Conformité, Audit interne, Revue de direction, Préparation ISO 45001 |
| 8 | 1 min | admin | Administration (secteur, marque) — conclusion |

### 1. La vitrine (1 min)
Page d'accueil : les modules dans l'ordre du menu. **À dire** : un seul outil pour les obligations de santé et de sécurité — registres, document unique, suivi, pilotage —, utilisable par une collectivité comme par une entreprise ; installé chez le client, ses données restent chez lui.

### 2. Le tableau de bord (2 min) — `admin@verchamps.fr`
Compteurs du jour, Flash Info (« merci pour vos signalements »), et en tête le **rappel de la politique de santé et de sécurité** que ce compte n'a pas encore lue. **À dire** : chacun arrive sur ce qui le concerne ; ici, la direction a une politique à lire et à confirmer — la preuve de prise de connaissance qu'un auditeur demande.

### 3. Le presque-accident (4 min) — `AG1`, puis `manager@verchamps.fr`
- En `AG1` : Signalements → « Signaler un presque-accident ». Saisir en direct, en quelques lignes, **service Voirie & Réseaux** (par exemple : « Câble de rallonge en travers du couloir du dépôt », ce qui aurait pu arriver, ce qui a été fait sur le moment). L'agent ne voit que ses propres signalements.
- Se reconnecter en `manager@verchamps.fr` : la liste de ses services, avec le signalement qui vient d'être fait et celui de l'**aire de lavage du dépôt** (un camion qui recule sans alarme), **en retard** (plus de 8 jours sans réponse). L'ouvrir, choisir la suite « Action au Plan d'actions » et noter une action.
- **À dire** : c'est la base de la pyramide de Bird — beaucoup de presque-accidents pour un accident ; les faire remonter, c'est agir avant. L'agent voit la suite donnée : il recommence.

### 4. Le Plan d'actions (3 min) — `PREV1`
Toutes les actions au même endroit, quelle que soit leur origine : document unique, inspections, analyses d'accident, signalements, audit interne, conformité, objectifs, revue de direction, risques et opportunités. Montrer :
- le **niveau de la mesure** (supprimer, remplacer, protection collective, organisation, protection individuelle — ISO 45001 § 8.1.2) : les débroussailleuses à batterie (« Remplacer ») ;
- l'action **en retard** (plan d'évacuation du gymnase) ;
- une action faite dont l'**efficacité a été vérifiée** (tapis absorbant du hall : « Efficace », avec le constat).
**À dire** : on ne s'arrête pas à « fait » : on vérifie que ça a marché (§ 10.2).

### 5. De l'accident à ses causes (3 min) — `PREV1`
Registre AT/MP : l'accident de Camille Girard, le 22 janvier, chute dans le hall de l'hôtel de ville. Analyse d'accident : son **arbre des causes** (condensation sur la porte vitrée, panneaux inaccessibles, chaussures de ville), la conclusion, les trois actions — dont deux déjà faites. Un mot du Document unique (unités de travail, cotation). **À dire** : l'accident, son analyse et ses actions sont reliés ; rien ne se ressaisit.

### 6. Les chiffres (2 min) — `admin@verchamps.fr`
Indicateurs & Reporting : taux de fréquence et de gravité, événements par niveau de la pyramide de Bird, export Excel en un clic. **À dire** : les mêmes chiffres partout (tableau de bord, objectifs, revue de direction), une seule définition.

### 7. Le pilotage et la préparation ISO 45001 (4 min) — `admin@verchamps.fr`
- **Politique** : version 1 signée par la directrice générale des services, ses engagements, qui l'a lue (4 comptes sur 7).
- **Objectifs** : trois objectifs chiffrés et leur état du jour (presque-accidents remontés, taux de fréquence, aucune action en retard — celui-là est en écart, à cause du gymnase).
- **Conformité réglementaire** : cinq exigences évaluées ; les secouristes de la cuisine centrale : non conforme, avec son action.
- **Audit interne** : l'audit des services techniques, ses constats (point fort, observation, non-conformité) ; le prochain est planifié.
- **Revue de direction** : celle de février, ses entrées, ses sorties, ses deux décisions — devenues des actions, faites.
- **Préparation ISO 45001** : les 30 exigences de la norme, ce que l'outil couvre et ce que montrent aujourd'hui les registres (une douzaine avec des preuves, autant avec des points à reprendre, quelques-unes sans rien). **À dire** : c'est la page à ouvrir avant un audit de certification — où sont les preuves, ce qui manque. L'outil prépare ; la certification reste délivrée par un organisme certificateur.

### 8. Conclusion (1 min) — `admin@verchamps.fr`
Administration → Référentiels → Organisation → Secteur : passer en « Entreprise privée » et rouvrir une page — « agent » devient « salarié », la F3SCT devient la CSSCT. (Remettre « Collectivité territoriale » ensuite.) Évoquer la marque (nom, logo, couleurs du client) et l'installation sur un poste ou un serveur : données chez le client, droits par profil, journal de qui a consulté les données de santé, sauvegardes quotidiennes recopiées hors du disque.

## Questions probables

- **Où sont les données ?** Sur ce site de démonstration, dans le navigateur seulement : rien ne part ailleurs, rien n'est partagé entre visiteurs. En usage réel, sur un poste ou un serveur de l'organisation (`LIVRAISON-POSTE.md`, `PLAN-MISE-EN-PRODUCTION.md`).
- **Et les données de santé ?** Lues seulement par les profils qui en ont besoin, chaque consultation tracée ; le cadre juridique (RGPD, hébergement de données de santé) est décrit dans le dossier remis à l'avocat — à faire valider par un juriste, ce n'est pas un avis juridique.
- **Peut-on reprendre nos fichiers ?** Oui, par les modèles Excel du kit de reprise (`KIT-REPRISE/`).
- **Une entreprise, plusieurs sites ?** Oui : l'organisation (sites, services) et le vocabulaire se règlent dans Administration.
- **Est-ce que ça certifie ?** Non : l'outil rassemble les preuves et montre ce qui manque ; la certification est délivrée par un organisme accrédité après audit.

## Ce qu'il vaut mieux éviter

- Les modules sans données de démonstration (pages vides en démonstration) : Gestion RH, Pénibilité, Dialogue social, Accueil au poste, Entreprises extérieures, Gestion des changements, Achats et santé-sécurité, Programme annuel de prévention. Ils fonctionnent, mais rien n'y est à montrer.
- Le téléphone : le tableau de bord s'y adapte, mais les registres denses sont faits pour l'ordinateur.
- Les comptes et mots de passe de démonstration sont publics : ne jamais saisir de vraies données sur ce site.

## Après la démonstration

Noter à chaud ce qui a frappé, les questions restées sans réponse et les demandes ; les remonter au projet (le préventeur peut aussi les déposer dans le Cahier du préventeur, rubrique idées).
