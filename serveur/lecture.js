// Droits de lecture (Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quinquies, 2026-09-27) : un compte ne reçoit
// du serveur que ce que ses écrans affichent. Jusque-là, tout compte connecté recevait tous les registres dans
// sa page — y compris les données de santé — et c'était l'écran qui masquait ce que son rôle ne devait pas voir.
//
// Depuis les profils de droits (2026-10-01), « RH/admin », « manager » et « permission de module » ci-dessous se
// lisent en niveaux de module (assets/droits.js, via serveur/droits.js) : « RH/admin » = le niveau de gestion du
// module, « permission » = son niveau de consultation, « l'encadrement » = le niveau de consultation de Santé & Visites.
//
// Relevé page par page (garde d'accès de chaque page, colonnes affichées selon le rôle, clés lues) :
//   - Registre AT/MP : complet pour RH/admin et les permissions « atmp-admin » / « accident-analyse » (leurs pages
//     affichent l'identité des victimes) ; pour les autres, les seules colonnes que registre-at-mp.html leur montre
//     (COLUMN_VISIBILITY, vue « ag ») — ni identité, ni situation administrative, ni volet maladie professionnelle.
//     Tableau de bord, Reporting, Plan d'actions et Dialogue social n'en lisent pas davantage.
//   - Dossiers AT/MP & CITIS, arrêtés : RH/admin et « atmp-admin » (seule page qui les lit, gardée).
//   - Analyses d'accident : RH/admin et « accident-analyse » ; les autres n'en reçoivent que les actions, que le
//     Plan d'actions affiche à tous (generateAnalyseActionSeeds).
//   - Journal de saisie AT/MP (copie complète des déclarations) : comptes qui reçoivent le registre complet.
//   - Journal d'audit, comptes utilisateurs : administrateur (Administration est la seule page qui les lit).
//   - Revues de direction (2026-10-12) : complètes pour le niveau « consulter » du module ; aux autres, les seules
//     décisions (le Plan d'actions les affiche à tous, comme les actions des analyses d'accident).
//   - Objectifs santé-sécurité (2026-10-13) : complets pour le niveau « consulter » des Objectifs ou de la Revue de
//     direction (qui les reprend) ; aux autres, les seules actions (le Plan d'actions les affiche à tous).
//   - Exigences de conformité réglementaire (2026-10-15) : complètes pour le niveau « consulter » de la Conformité
//     réglementaire ou de la Revue de direction (qui en reprend le bilan) ; aux autres, les seules actions, avec leur service.
//   - Programmes annuels de prévention (question 25, 2026-10-15) : niveau « consulter » du Programme ou de la Revue de
//     direction (qui le reprend) ; rien aux autres (aucune autre page ne les lit).
//   - Signalements de presque-accidents et leurs photos (question 20, 2026-10-12) : complets (périmètre appliqué) pour
//     qui peut les traiter ; à tout autre compte, ses seuls signalements (champ « auteur »), qu'il suit sur sa page.
//   - Suivi médical et rendez-vous : l'encadrement seulement — manager (ses services, par le périmètre), RH et
//     administrateur ; un agent n'en reçoit rien, et la page Santé & Visites le renvoie au tableau de bord.
//     Réponse du préventeur à la question 17 (2026-09-29, option « l'encadrement seulement ») ; un autre compte y
//     accède par la permission « sante-visites » (lecture ou écriture), donnée dans Administration (ex. PREV1).
//
// Un compte qui ne reçoit pas une valeur complète peut encore y AJOUTER (déclarer un AT/MP, laisser une ligne au
// journal) : ses seuls enregistrements nouveaux sont greffés sur le registre complet (Anonymisation.grefferAjouts),
// jamais sa vue réduite à la place du registre.
'use strict';
const { grefferAjouts } = require('./anonymisation.js');
const { atteint } = require('./droits.js');

const RETIRE = 'retire';
const SIENS = 'siens';   // les seuls enregistrements dont le compte est l'auteur
const ATMP_VUE_AGENT = ['id', 'collectivite', 'service', 'dateAT', 'dateMois', 'typeAtMp', 'arret', 'statutArret', 'joursArret',
  'circonstances', 'etat', 'risque', 'siege', 'nature', 'elementMateriel', 'signalementId'];
const ANALYSE_VUE_ACTIONS = ['id', 'atmpId', 'collectivite', 'service', 'dateAnalyse', 'actions'];
const REVUE_VUE_DECISIONS = ['id', 'dateRevue', 'statut', 'decisions'];
const OBJECTIF_VUE_ACTIONS = ['id', 'intitule', 'actions'];
const EXIGENCE_VUE_ACTIONS = ['id', 'intitule', 'service', 'actions'];
const AUDIT_INTERNE_VUE_ACTIONS = ['id', 'titre', 'service', 'constats'];
// ce qu'il faut au Plan d'actions pour reprendre les mesures d'un changement (generateChangementActionSeeds)
const CHANGEMENT_VUE_ACTIONS = ['id', 'titre', 'service', 'risques'];
// ce qu'il faut au Plan d'actions pour reprendre les actions d'un risque ou d'une opportunité (generateContexteActionSeeds)
const CONTEXTE_VUE_ACTIONS = ['id', 'registre', 'type', 'texte', 'actions'];

// ce que les profils du compte lui donnent (assets/droits.js, via serveur/droits.js)
const peut = (p, module, niveau) => !!p && atteint(p, module, niveau);
const registreComplet = p => peut(p, 'atmp', 'gerer') || peut(p, 'atmp-admin', 'consulter') || peut(p, 'accident-analyse', 'consulter');
const encadrement = p => peut(p, 'sante-visites', 'consulter');
const administrateur = p => peut(p, 'administration', 'gerer') && !p.anonymise;

// Registres lus par UNE seule page (relevé du 2026-10-01 : aucune autre page ne les nomme) → le module dont elle dépend
// (ou une liste de modules : le niveau « consulter » de l'un d'eux suffit).
// Un compte qui n'a pas le niveau « consulter » de ce module (profil sans accès) ne reçoit plus ces registres : sa page
// est de toute façon fermée. Les registres que d'autres pages lisent aussi (tableau de bord, Reporting, Plan d'actions,
// sélecteur d'agents, fiches utiles…) restent transmis : les retirer vide leur affichage.
const PAGE_UNIQUE = {
  vigie_hse_epi_stock: 'epi', vigie_hse_epi_lavages: 'epi',
  vigie_hse_accueils: 'accueil-poste', vigie_hse_modeles_accueil: 'accueil-poste', vigie_hse_accueil_delai: 'accueil-poste',
  vigie_hse_expositions: 'penibilite', vigie_hse_penibilite_parametres: 'penibilite',
  vigie_hse_ds_questions: 'dialogue-social', vigie_hse_ds_reunions: 'dialogue-social',
  vigie_hse_documents: 'documentation', vigie_hse_doc_types: 'documentation',
  vigie_hse_inspection_trames: 'inspections',
  vigie_hse_grilles_audit: 'audit-interne',
  vigie_hse_roles_prevention: ['roles-prevention', 'preparation-iso'],   // lu par tous les profils préréglés (§ 5.3)
  vigie_hse_engagement_direction: ['engagement-direction', 'preparation-iso'],   // § 5.1
  vigie_hse_modeles_convocation: 'sante-visites',
  vigie_hse_plans_urgence: ['urgences', 'plans-urgence'],   // tout compte lit les plans (question 19)
  vigie_hse_plans_urgence_parametres: ['urgences', 'plans-urgence'],   // et les rubriques exigées (question 21)
};
// un registre s'ouvre au niveau « consulter » de l'un des modules cités
const ouvert = (page, modules) => [].concat(modules).some(m => peut(page, m, 'consulter'));

// null : valeur complète ; RETIRE : rien ; SIENS : les enregistrements du compte ; tableau : les seuls champs transmis de chaque enregistrement
function regle(page, cle){
  switch (cle){
    case 'vigie_hse_dataset':           return registreComplet(page) ? null : ATMP_VUE_AGENT;
    case 'vigie_hse_rh_log':            return registreComplet(page) ? null : RETIRE;
    case 'vigie_hse_atmp_dossiers':
    case 'vigie_hse_atmp_arretes':      return peut(page, 'atmp-admin', 'consulter') ? null : RETIRE;
    case 'vigie_hse_analyses_accident': return peut(page, 'accident-analyse', 'consulter') ? null : ANALYSE_VUE_ACTIONS;
    case 'vigie_hse_visites':
    case 'vigie_hse_rdv_medicaux':      return encadrement(page) ? null : RETIRE;
    case 'vigie_hse_revues_direction':  return peut(page, 'revue-direction', 'consulter') ? null : REVUE_VUE_DECISIONS;
    case 'vigie_hse_objectifs':         return ouvert(page, ['objectifs', 'revue-direction']) ? null : OBJECTIF_VUE_ACTIONS;
    case 'vigie_hse_exigences':         return ouvert(page, ['conformite', 'revue-direction']) ? null : EXIGENCE_VUE_ACTIONS;
    case 'vigie_hse_programmes':        return ouvert(page, ['programme', 'revue-direction']) ? null : RETIRE;
    case 'vigie_hse_politiques':        return ouvert(page, ['politique', 'revue-direction']) ? null : RETIRE;
    case 'vigie_hse_politique_lectures': return peut(page, 'politique', 'gerer') ? null : SIENS;
    case 'vigie_hse_audits_internes':   return ouvert(page, ['audit-interne', 'revue-direction']) ? null : AUDIT_INTERNE_VUE_ACTIONS;
    case 'vigie_hse_changements':       return ouvert(page, ['changements', 'revue-direction']) ? null : CHANGEMENT_VUE_ACTIONS;
    case 'vigie_hse_contexte':          return ouvert(page, ['contexte', 'revue-direction']) ? null : CONTEXTE_VUE_ACTIONS;
    case 'vigie_hse_signalements':
    case 'vigie_hse_signalements_photos': return peut(page, 'signalements', 'traiter') ? null : SIENS;
    case 'vigie_hse_audit_log':
    case 'vigie_hse_users':
    case 'vigie_hse_profils':           return administrateur(page) ? null : RETIRE;
    default:                            return PAGE_UNIQUE[cle] && !ouvert(page, PAGE_UNIQUE[cle]) ? RETIRE : null;
  }
}

function projeter(valeur, champs){
  let l; try { l = JSON.parse(valeur); } catch(e){ return '[]'; }
  if (!Array.isArray(l)) return '[]';
  return JSON.stringify(l.map(r => {
    const o = {};
    if (r && typeof r === 'object') for (const c of champs) if (r[c] !== undefined) o[c] = r[c];
    return o;
  }));
}

// la valeur telle que ce compte peut la recevoir (null : rien)
function vue(page, cle, valeur){
  const r = regle(page, cle);
  if (r === null || valeur == null) return valeur;
  if (r === SIENS){
    let l; try { l = JSON.parse(valeur); } catch(e){ return '[]'; }
    return JSON.stringify(Array.isArray(l) ? l.filter(x => x && typeof x === 'object' && page && x.auteur != null && x.auteur === page.user) : []);
  }
  return r === RETIRE ? null : projeter(valeur, r);
}

// { cle: { valeur, revision } } pour ce compte ; une clé retirée garde sa révision (valeur vide), pour que la
// page puisse encore y ajouter sans conflit
function filtrer(page, donnees){
  const s = {};
  for (const [cle, d] of Object.entries(donnees)) s[cle] = regle(page, cle) === null ? d : { valeur: vue(page, cle, d.valeur), revision: d.revision };
  return s;
}

// écriture d'un compte qui n'a pas la valeur complète : ses seuls ajouts, greffés sur le registre complet
// (une suppression du registre entier ne lui est pas permise : le registre complet reste)
function ecriture(page, cle, complet, soumis){
  if (regle(page, cle) === null) return soumis;
  if (soumis === null) return complet;
  return grefferAjouts(complet, soumis);
}

// les clés dont ce compte reçoit une valeur différente de la valeur complète (retirée, projetée, filtrée à ses services
// ou à ses enregistrements, santé masquée) : « tout » et « recu » au format de filtrer() — VigieStore.complet côté page
function partielles(tout, recu){
  return Object.keys(tout).filter(k => !recu[k] || recu[k].valeur !== tout[k].valeur).sort();
}

module.exports = { regle, vue, filtrer, ecriture, partielles, RETIRE, SIENS, ATMP_VUE_AGENT, REVUE_VUE_DECISIONS, OBJECTIF_VUE_ACTIONS, EXIGENCE_VUE_ACTIONS, AUDIT_INTERNE_VUE_ACTIONS, CHANGEMENT_VUE_ACTIONS, CONTEXTE_VUE_ACTIONS, PAGE_UNIQUE };
