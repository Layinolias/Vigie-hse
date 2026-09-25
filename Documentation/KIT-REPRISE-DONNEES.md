# Kit de reprise des données

> Fichier **généré** par `Documentation/outils/generer-kit-reprise.js` — ne pas l'éditer à la main, relancer le générateur. Dernière génération : 2026-09-25.

Pour mettre en service VIGIE HSE chez un nouveau client, ses données existantes (registres Excel, historique des accidents, suivi des visites…) se chargent par les imports de chaque module. Le dossier `KIT-REPRISE/` contient un modèle Excel par module importable et un mode d'emploi (`00-mode-d-emploi.xlsx`).

**Comment les modèles sont faits.** Chaque modèle est l'export réel du module : mêmes feuilles, mêmes colonnes. Un aller-retour export → import a été vérifié sur tous les modules (les enregistrements reviennent à l'identique, champ par champ, arbre causal des analyses d'accident compris). Les consignes de chaque colonne ne sont pas rédigées à la main : le générateur **importe réellement** les exemples dans la page, vide chaque colonne pour voir si les lignes sont refusées (colonne obligatoire), et y met une valeur inconnue pour voir si elle est gardée (texte libre), remplacée ou refusée (liste).

## Ordre de chargement

| Étape | Fichier | Contenu | Où l'importer | Remarques |
|---|---|---|---|---|
| Avant | *saisie à l'écran* | Comptes utilisateurs | Administration → Utilisateurs | Créés un par un (ils relèveront de la future authentification). |
| 00 | `00-referentiels.xlsx` | Référentiels (services, familles de risque, listes) | Administration → Référentiels → Importer .xlsx | À charger en tout premier : les colonnes « Service » des autres fichiers doivent reprendre exactement ces libellés. L'import ajoute les valeurs manquantes et n'en retire jamais ; la colonne « Définition » ne sert qu'aux familles de risque. |
| 01 | `01-agents.xlsx` | Agents (Gestion RH) | Gestion RH → onglet Agents → Importer .xlsx | À charger juste après les référentiels : les autres modules peuvent ensuite proposer ces agents dans leurs formulaires. Le responsable se désigne par son « Nom Prénom » ; il peut figurer plus bas dans le fichier. |
| 02 | `02-heures-travaillees.xlsx` | Heures travaillées (Gestion RH) | Gestion RH → onglet Heures travaillées → Importer .xlsx | Un total par mois, collectivité et service (pas un pointage individuel). Alimente le taux de fréquence et de gravité « réels ». Une ligne déjà présente pour le même mois, la même collectivité et le même service est ignorée. |
| 03 | `03-registre-at-mp.xlsx` | Registre AT/MP | Registre AT/MP → Importer .xlsx | L'historique des accidents du travail et maladies professionnelles. À charger avant les dossiers et les analyses d'accident, qui s'y rattachent. |
| 04 | `04-dossiers-atmp-citis.xlsx` | Dossiers AT/MP & CITIS | Dossiers AT/MP & CITIS → Importer .xlsx | Chaque ligne se rattache à un accident déjà présent dans le Registre AT/MP, par sa colonne « ID AT/MP » ou, à défaut, par « Nom » + « Date AT ». |
| 05 | `05-analyses-accident.xlsx` | Analyses d'accident | Analyse d'accident → Importer .xlsx | La méthode, la conclusion, les actions correctives et l'arbre causal (feuilles « Faits », « Pourquoi », « Ishikawa ») se reprennent. Dans « Faits », la colonne « Découle du fait n° » désigne un autre fait de la même analyse par son numéro. |
| 06 | `06-document-unique.xlsx` | Document Unique (DUERP) | Document Unique → Importer .xlsx | Une ligne par unité de travail et par risque. |
| 07 | `07-plan-actions.xlsx` | Plan d'actions | Plan d'actions → Importer .xlsx | Les actions saisies à la main. Celles qui découlent du Document Unique, des inspections, des analyses d'accident ou des exercices se créent toutes seules depuis ces modules : inutile de les importer ici. |
| 08 | `08-registre-sst.xlsx` | Registre santé et sécurité au travail | Registre SST → Importer .xlsx |  |
| 09 | `09-sante-visites.xlsx` | Santé & visites médicales | Santé & Visites → onglet Suivi → Importer .xlsx | Le suivi des visites (dernière visite, périodicité). Les rendez-vous se saisissent dans l'agenda. |
| 10 | `10-verifications-periodiques.xlsx` | Vérifications périodiques | Vérifications périodiques → Importer .xlsx |  |
| 11 | `11-formation-habilitation.xlsx` | Formation & habilitations | Formation / Habilitation → Importer .xlsx |  |
| 12 | `12-produits-chimiques.xlsx` | Produits chimiques | Produits chimiques → Importer .xlsx |  |
| 13 | `13-inspection-trames.xlsx` | Trames d'inspection | Inspection / Audit → Importer les trames | Une ligne par point de contrôle ; les lignes qui portent le même nom de trame forment une trame. À charger avant les inspections. |
| 14 | `14-inspections.xlsx` | Inspections réalisées | Inspection / Audit → Importer .xlsx | La colonne « Trame » doit reprendre le nom exact d'une trame déjà chargée (fichier 13). |
| 15 | `15-urgences-exercices.xlsx` | Exercices d'urgence | Situations d'urgence → Importer .xlsx | La périodicité est obligatoire : l'application ne la devine jamais (réponse du préventeur à la question 6). |
| 16 | `16-epi-catalogue.xlsx` | Catalogue des EPI | EPI & Dotation → onglet Catalogue → Importer .xlsx | À charger avant les dotations : une dotation désigne un article du catalogue par son nom. |
| 17 | `17-epi-dotations.xlsx` | Dotations d'EPI | EPI & Dotation → onglet Dotations → Importer .xlsx |  |
| — | *saisie à l'écran* | Accueil au poste | Accueil au poste | Pas d'import : les parcours se créent à l'arrivée de chaque agent. |
| — | *saisie à l'écran* | Entreprises extérieures | Entreprises extérieures | Pas d'import : une fiche par intervention. |
| — | *saisie à l'écran* | Base documentaire | Base documentaire | Pas d'import : fiches et documents se saisissent à l'écran. |
| — | *saisie à l'écran* | Stock et lavages des EPI | EPI & Dotation | Pas d'import pour ces deux onglets. |
| — | *saisie à l'écran* | Rendez-vous médicaux | Santé & Visites → Agenda | Pas d'import : l'agenda démarre à la mise en service. |

## Colonnes obligatoires, par fichier

Le détail complet (format, valeurs acceptées, remarques) est dans la feuille « Consignes » de chaque modèle. Ci-dessous, les colonnes **sans lesquelles une ligne est refusée** — mesurées, pas supposées.

- **`00-referentiels.xlsx`** — Référentiels (services, familles de risque, listes) : obligatoires « Liste », « Valeur » ; listes : « Liste » (une valeur inconnue fait refuser la ligne).
- **`01-agents.xlsx`** — Agents (Gestion RH) : obligatoires « Nom » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`02-heures-travaillees.xlsx`** — Heures travaillées (Gestion RH) : obligatoires « Période », « Service », « Heures » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`03-registre-at-mp.xlsx`** — Registre AT/MP : au moins une de « date AT », « Nom », « Circonstances » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Avec ou sans arret » (une valeur inconnue est remplacée par « Sans Arrêt »).
- **`04-dossiers-atmp-citis.xlsx`** — Dossiers AT/MP & CITIS : obligatoires Arretes › « Type ».
- **`05-analyses-accident.xlsx`** — Analyses d'accident : obligatoires Actions › « Action », Faits › « Fait », Ishikawa › « Catégorie », Ishikawa › « Cause » ; listes : « Type » (une valeur inconnue est remplacée par « Fait »), « Catégorie » (une valeur inconnue fait refuser la ligne).
- **`06-document-unique.xlsx`** — Document Unique (DUERP) : au moins une de « Risques », « Taches » ; listes : « Collectivite » (une valeur inconnue est remplacée par « Ville »).
- **`07-plan-actions.xlsx`** — Plan d'actions : obligatoires « Titre » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Priorité » (une valeur inconnue est remplacée par « Moyenne »), « Statut » (une valeur inconnue est remplacée par « À faire »).
- **`08-registre-sst.xlsx`** — Registre santé et sécurité au travail : au moins une de « Nature », « Description » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Gravité » (une valeur inconnue est remplacée par « Moyenne »), « Statut » (une valeur inconnue est remplacée par « Nouvelle »).
- **`09-sante-visites.xlsx`** — Santé & visites médicales : obligatoires « Nom » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`10-verifications-periodiques.xlsx`** — Vérifications périodiques : obligatoires « Équipement » ; listes : « Catégorie » (une valeur inconnue est remplacée par « Installations électriques »), « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Conformité » (une valeur inconnue est remplacée par « Conforme »).
- **`11-formation-habilitation.xlsx`** — Formation & habilitations : au moins une de « Nom », « Type d'habilitation » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`12-produits-chimiques.xlsx`** — Produits chimiques : obligatoires « Produit » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`13-inspection-trames.xlsx`** — Trames d'inspection : obligatoires « Trame », « Point de contrôle ».
- **`14-inspections.xlsx`** — Inspections réalisées : obligatoires « Trame » ; listes : « Trame » (une valeur inconnue fait refuser la ligne), « Collectivité » (une valeur inconnue est remplacée par « Ville »).
- **`15-urgences-exercices.xlsx`** — Exercices d'urgence : obligatoires Exercices › « Périodicité mois », Actions › « ID Exercice », Actions › « Action » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Type » (une valeur inconnue est remplacée par « Évacuation incendie »).
- **`16-epi-catalogue.xlsx`** — Catalogue des EPI : obligatoires « Nom ».
- **`17-epi-dotations.xlsx`** — Dotations d'EPI : obligatoires « Article » ; listes : « Collectivité » (une valeur inconnue est remplacée par « Ville »), « Article » (une valeur inconnue fait refuser la ligne).

## Limites connues

- **Formats** : Excel (`.xlsx`, `.xls`), LibreOffice (`.ods`) et CSV (point-virgule ou virgule, UTF-8 avec ou sans BOM, Windows-1252 — `assets/import-fichier.js`). Un document Word, PDF ou papier se recopie d'abord dans le modèle : le préventeur prévient que « tout type de fichier est à prévoir » (question 13) — la reprise d'un client devra donc souvent passer par une transcription accompagnée.
- **Comptes utilisateurs** : pas d'import (ils relèveront de la future authentification). Les **référentiels** s'importent (fichier `00-referentiels.xlsx`) et se chargent en premier : les colonnes « Service » des autres fichiers doivent reprendre exactement leurs libellés.
- **Accueil au poste, entreprises extérieures, base documentaire, stock et lavages d'EPI, rendez-vous médicaux** : pas d'import, saisie à l'écran.
- **Données dans le navigateur** : tant que l'application n'a pas de serveur, la reprise se fait sur le poste qui servira (voir `PLAN-MISE-EN-PRODUCTION.md`).
