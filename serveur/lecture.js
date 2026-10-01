// Droits de lecture (Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quinquies, 2026-09-27) : un compte ne reçoit
// du serveur que ce que ses écrans affichent. Jusque-là, tout compte connecté recevait tous les registres dans
// sa page — y compris les données de santé — et c'était l'écran qui masquait ce que son rôle ne devait pas voir.
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
const ATMP_VUE_AGENT = ['id', 'collectivite', 'service', 'dateAT', 'dateMois', 'typeAtMp', 'arret', 'statutArret', 'joursArret',
  'circonstances', 'etat', 'risque', 'siege', 'nature', 'elementMateriel'];
const ANALYSE_VUE_ACTIONS = ['id', 'atmpId', 'collectivite', 'service', 'dateAnalyse', 'actions'];

// ce que les profils du compte lui donnent (assets/droits.js, via serveur/droits.js)
const peut = (p, module, niveau) => !!p && atteint(p, module, niveau);
const registreComplet = p => peut(p, 'atmp', 'gerer') || peut(p, 'atmp-admin', 'consulter') || peut(p, 'accident-analyse', 'consulter');
const encadrement = p => peut(p, 'sante-visites', 'consulter');
const administrateur = p => peut(p, 'administration', 'gerer') && !p.anonymise;

// null : valeur complète ; RETIRE : rien ; tableau : les seuls champs transmis de chaque enregistrement
function regle(page, cle){
  switch (cle){
    case 'vigie_hse_dataset':           return registreComplet(page) ? null : ATMP_VUE_AGENT;
    case 'vigie_hse_rh_log':            return registreComplet(page) ? null : RETIRE;
    case 'vigie_hse_atmp_dossiers':
    case 'vigie_hse_atmp_arretes':      return peut(page, 'atmp-admin', 'consulter') ? null : RETIRE;
    case 'vigie_hse_analyses_accident': return peut(page, 'accident-analyse', 'consulter') ? null : ANALYSE_VUE_ACTIONS;
    case 'vigie_hse_visites':
    case 'vigie_hse_rdv_medicaux':      return encadrement(page) ? null : RETIRE;
    case 'vigie_hse_audit_log':
    case 'vigie_hse_users':
    case 'vigie_hse_profils':           return administrateur(page) ? null : RETIRE;
    default:                            return null;
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

module.exports = { regle, vue, filtrer, ecriture, RETIRE, ATMP_VUE_AGENT };
