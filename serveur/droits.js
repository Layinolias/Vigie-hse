// Droits d'écriture appliqués par le serveur VIGIE HSE (étape P1b, 2e partie).
//
// Mêmes règles que les écrans (Documentation/ETAT-DU-PROJET.md §7). Un compte a un niveau d'accès par module,
// donné par ses profils (assets/droits.js) ; chaque registre dépend d'un module et d'un niveau (table REGLES).
//
// Trois niveaux par registre et par personne :
//   « complet » : écrire, modifier, supprimer ;
//   « ajout »   : ajouter des éléments, sans modifier ni retirer ceux qui existent — le Registre SST
//                 (déposer une observation), les journaux (chacun y laisse la trace de ses actions, seuls les
//                 gestionnaires du module peuvent les vider), et la déclaration d'un AT/MP (niveau « déclarer ») ;
//   « aucun ».
// Un registre absent de la table suit la règle générale : réservé à l'administration. Les lectures sont
// filtrées ailleurs : serveur/lecture.js (ce que les écrans d'un compte affichent), serveur/perimetre.js (les
// services d'un compte), serveur/anonymisation.js.
'use strict';
const Anonymisation = require('./anonymisation.js');
const VigieDroits = require('../assets/droits.js');   // catalogue des modules et profils : le même fichier que les pages
const PREFIXE = 'vigie_hse_';

// Les droits d'un compte : ceux de sa session (posés par serveur/comptes.js à partir de ses profils), ou — session
// construite à la main par un test, ancien format role + modulePermissions — résolus à la volée.
const memo = new WeakMap();
function droitsDe(s){
  if (s && s.droits && typeof s.droits === 'object') return s.droits;
  if (!s || typeof s !== 'object') return VigieDroits.resoudre({}, null).droits;
  if (!memo.has(s)) memo.set(s, VigieDroits.resoudre(s, null).droits);
  return memo.get(s);
}
const atteint = (s, module, niveau) => VigieDroits.atteint(droitsDe(s), module, niveau);

// Une règle : « complet » à partir d'un niveau du module ; « ajout » à partir d'un autre niveau, ou pour tous
// (journaux, registre SST) ; sinon « aucun ».
const regle = (module, complet, ajout) => s =>
  atteint(s, module, complet) ? 'complet'
  : ajout === 'tous' ? 'ajout'
  : (ajout && atteint(s, module, ajout)) ? 'ajout' : 'aucun';
const GERER = module => regle(module, 'gerer');

// Chaque registre synchronisé (VigieStore.CLES) a sa règle ici : un registre absent suivrait la règle générale,
// réservée à l'administration (test-droits-differentiel.js vérifie qu'aucun n'est oublié).
const REGLES = {
  // Administration
  users: GERER('administration'), referentials: GERER('administration'), news: GERER('administration'),
  veille: GERER('administration'), profils: GERER('administration'),
  audit_log: regle('administration', 'gerer', 'tous'),
  // Registre AT/MP : l'ajout (déclarer) ne modifie ni ne retire rien
  dataset: regle('atmp', 'gerer', 'declarer'), rh_log: regle('atmp', 'gerer', 'tous'),
  duerp_dataset: GERER('duerp'), duerp_log: regle('duerp', 'gerer', 'tous'),
  rsst: regle('rsst', 'repondre', 'deposer'),
  produits_chimiques: GERER('produits'),
  actions: GERER('actions'),
  verifications: GERER('verifications'),
  inspections: GERER('inspections'), inspection_trames: GERER('inspections'),
  habilitations: GERER('formations'),
  epi_stock: GERER('epi'), epi_dotations: GERER('epi'), epi_lavages: GERER('epi'), epi_catalogue: GERER('epi'),
  atmp_dossiers: GERER('atmp-admin'), atmp_arretes: GERER('atmp-admin'),
  analyses_accident: GERER('accident-analyse'),
  exercices_urgence: GERER('urgences'), plans_urgence: GERER('urgences'),
  visites: GERER('sante-visites'), rdv_medicaux: GERER('sante-visites'), modeles_convocation: GERER('sante-visites'),
  agents: GERER('gestion-rh'), heures_travaillees: GERER('gestion-rh'),
  interventions_ee: GERER('entreprises-ext'),
  accueils: GERER('accueil-poste'), modeles_accueil: GERER('accueil-poste'), accueil_delai: GERER('accueil-poste'),
  wiki: regle('documentation', 'rediger'), documents: regle('documentation', 'rediger'), doc_types: regle('documentation', 'rediger'),
  postes: GERER('penibilite'), expositions: GERER('penibilite'), penibilite_parametres: GERER('penibilite'),
  ds_questions: regle('dialogue-social', 'participer'), ds_reunions: regle('dialogue-social', 'participer'), ds_visites: regle('dialogue-social', 'participer'),
};
const regleGenerale = GERER('administration');
const nomCourt = cle => cle.startsWith(PREFIXE) ? cle.slice(PREFIXE.length) : cle;

function niveau(session, cle){
  const n = (REGLES[nomCourt(cle)] || regleGenerale)(session);
  // compte anonymisé : rien sur les données de santé retirées, au plus l'ajout sur un registre réduit
  if (Anonymisation.estAnonyme(session)){
    if (Anonymisation.RETIREES.has(PREFIXE + nomCourt(cle))) return 'aucun';
    if (Anonymisation.PROJETEES[PREFIXE + nomCourt(cle)]) return n === 'aucun' ? 'aucun' : 'ajout';
  }
  return n;
}

const liste = v => { if (v === null) return null; try { const l = JSON.parse(v); return Array.isArray(l) ? l : null; } catch(e){ return null; } };
const idDe = x => x && typeof x === 'object' && x.id != null ? String(x.id) : null;
const compter = (l, cle) => { const m = new Map(); for (const x of l){ const k = cle(x); if (k !== null) m.set(k, (m.get(k) || 0) + 1); } return m; };

// « ajout » : chaque élément déjà enregistré se retrouve, identique, dans la nouvelle valeur — et un identifiant
// déjà enregistré n'y revient pas une fois de plus : une copie modifiée placée avant l'original passerait sinon
// pour lui (les pages retiennent le premier trouvé, le journal d'audit ne la signerait pas).
function queDesAjouts(ancienne, nouvelle){
  const n = liste(nouvelle);
  if (!n) return false;
  if (ancienne === null) return true;
  const a = liste(ancienne);
  if (!a) return false;
  const restants = compter(n, x => JSON.stringify(x));
  for (const x of a){
    const k = JSON.stringify(x), c = restants.get(k) || 0;
    if (!c) return false;
    restants.set(k, c - 1);
  }
  const idsNouveaux = compter(n, idDe);
  for (const [id, c] of compter(a, idDe)) if (idsNouveaux.get(id) !== c) return false;
  return true;
}

module.exports = {
  niveau, droitsDe, atteint,
  // les registres qui ont une règle explicite (un test vérifie que chaque clé synchronisée de VigieStore.CLES y est)
  cles: Object.keys(REGLES).map(k => PREFIXE + k),
  // ancienne / nouvelle : chaînes stockées (null = absente, ou suppression demandée)
  peutEcrire(session, cle, nouvelle, ancienne){
    const n = niveau(session, cle);
    return n === 'complet' || (n === 'ajout' && queDesAjouts(ancienne, nouvelle));
  },
  peutEffacer: session => atteint(session, 'administration', 'gerer'),
  // ce que la page reçoit pour ne pas tenter d'écritures vouées au refus (assets/stockage.js)
  resume(session){
    const cles = {};
    for (const k of Object.keys(REGLES)) cles[PREFIXE + k] = niveau(session, PREFIXE + k);
    if (Anonymisation.estAnonyme(session)) for (const k of Anonymisation.RETIREES) cles[k] = 'aucun';
    return { defaut: regleGenerale(session), cles };
  },
  _queDesAjouts: queDesAjouts,
};
