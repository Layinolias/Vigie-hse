// Droits d'écriture appliqués par le serveur VIGIE HSE (étape P1b, 2e partie).
//
// Mêmes règles que les écrans (Documentation/ETAT-DU-PROJET.md §7) — relevées page par page le
// 2026-09-24 : jusqu'ici un agent en lecture seule l'était parce que les boutons étaient cachés ; un
// appel direct à l'API pouvait tout écrire. Désormais le serveur refuse ce que l'écran n'autorise pas.
//
// Trois niveaux par registre et par personne :
//   « complet » : écrire, modifier, supprimer ;
//   « ajout »   : ajouter des éléments, sans modifier ni retirer ceux qui existent — le Registre SST
//                 (tout agent peut y déposer une observation, seuls RH et administrateurs y répondent),
//                 les journaux (chacun y laisse la trace de ses actions, personne d'autre que RH/admin
//                 ne peut les effacer), et la déclaration d'un AT/MP avec la permission « atmp-declare » ;
//   « aucun ».
// Un registre absent de la table suit la règle générale : complet pour RH et administrateurs, aucun
// pour les autres. Les lectures ne sont pas filtrées ici (le périmètre d'un manager reste appliqué par
// les écrans) — voir PLAN-MISE-EN-PRODUCTION.md §4 ter.
'use strict';
const PREFIXE = 'vigie_hse_';
const estAdmin = s => s.role === 'admin';
const estRh = s => s.role === 'admin' || s.role === 'rh';
const permission = (s, p) => (s.modulePermissions || {})[p];
// RH et administrateurs, ou la permission de module accordée en écriture
const parModule = p => s => (estRh(s) || permission(s, p) === 'write') ? 'complet' : 'aucun';
const adminSeul = s => estAdmin(s) ? 'complet' : 'aucun';
const ajoutPourTous = s => estRh(s) ? 'complet' : 'ajout';

const REGLES = {
  // Administration (réservée aux administrateurs)
  users: adminSeul, referentials: adminSeul, news: adminSeul, veille: adminSeul,
  // modules à permission granulaire (administration.html → Utilisateurs)
  dataset: s => estRh(s) ? 'complet' : (permission(s, 'atmp-declare') === 'write' ? 'ajout' : 'aucun'),
  atmp_dossiers: parModule('atmp-admin'), atmp_arretes: parModule('atmp-admin'),
  analyses_accident: parModule('accident-analyse'),
  exercices_urgence: parModule('urgences'),
  agents: parModule('gestion-rh'), heures_travaillees: parModule('gestion-rh'),
  interventions_ee: parModule('entreprises-ext'),
  accueils: parModule('accueil-poste'), modeles_accueil: parModule('accueil-poste'), accueil_delai: parModule('accueil-poste'),
  wiki: parModule('documentation'), documents: parModule('documentation'), doc_types: parModule('documentation'),
  // ouverts à tous, en ajout seulement
  rsst: ajoutPourTous, audit_log: ajoutPourTous, duerp_log: ajoutPourTous, rh_log: ajoutPourTous,
};
const regleGenerale = s => estRh(s) ? 'complet' : 'aucun';
const nomCourt = cle => cle.startsWith(PREFIXE) ? cle.slice(PREFIXE.length) : cle;

function niveau(session, cle){ return (REGLES[nomCourt(cle)] || regleGenerale)(session); }

// « ajout » : chaque élément déjà enregistré doit se retrouver, identique, dans la nouvelle valeur
function queDesAjouts(ancienne, nouvelle){
  if (nouvelle === null) return false;
  let n; try { n = JSON.parse(nouvelle); } catch(e){ return false; }
  if (!Array.isArray(n)) return false;
  if (ancienne === null) return true;
  let a; try { a = JSON.parse(ancienne); } catch(e){ return false; }
  if (!Array.isArray(a)) return false;
  const parId = new Map(), sansId = new Map();
  for (const x of n){
    if (x && typeof x === 'object' && x.id != null) parId.set(String(x.id), JSON.stringify(x));
    else { const k = JSON.stringify(x); sansId.set(k, (sansId.get(k) || 0) + 1); }
  }
  for (const x of a){
    if (x && typeof x === 'object' && x.id != null){ if (parId.get(String(x.id)) !== JSON.stringify(x)) return false; }
    else { const k = JSON.stringify(x), c = sansId.get(k) || 0; if (!c) return false; sansId.set(k, c - 1); }
  }
  return true;
}

module.exports = {
  niveau,
  // ancienne / nouvelle : chaînes stockées (null = absente, ou suppression demandée)
  peutEcrire(session, cle, nouvelle, ancienne){
    const n = niveau(session, cle);
    return n === 'complet' || (n === 'ajout' && queDesAjouts(ancienne, nouvelle));
  },
  peutEffacer: session => estAdmin(session),
  // ce que la page reçoit pour ne pas tenter d'écritures vouées au refus (assets/stockage.js)
  resume(session){
    const cles = {};
    for (const k of Object.keys(REGLES)) cles[PREFIXE + k] = REGLES[k](session);
    return { defaut: regleGenerale(session), cles };
  },
  _queDesAjouts: queDesAjouts,
};
