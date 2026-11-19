// Comptes anonymisés (module 13 Dialogue social, réponse Q16 du préventeur, 2026-09-24) : « le compte doit
// anonymiser toutes les données sensibles », quel que soit son titulaire (représentant du personnel…).
//
// Un compte coché « anonymisé » dans Administration ne reçoit du serveur AUCUNE donnée de santé — celles
// que le registre VigieStore.CLES marque « sensible » (article 9 du RGPD). Ce n'est pas un masquage à
// l'écran : ces données ne quittent pas le serveur pour ce compte.
//   - Dossiers AT/MP & CITIS, arrêtés, analyses d'accident, visites médicales, rendez-vous : retirés.
//   - Registre AT/MP : réduit aux champs qui servent les indicateurs, sans identité ni lésion — service,
//     mois, année, type, arrêt, jours d'arrêt, famille de risque.
// Un tel compte ne peut rien modifier dans ces registres ; il peut au plus AJOUTER (déclarer un AT/MP
// s'il en a la permission) : ses ajouts sont greffés sur le registre complet, qu'il n'a jamais reçu.
'use strict';
// le journal de saisie AT/MP (copie complète de chaque déclaration) et le journal d'audit (ses lignes nomment les
// agents : « RDV médical « Dupont Jean » ») en font partie
const RETIREES = new Set(['vigie_hse_atmp_dossiers', 'vigie_hse_atmp_arretes', 'vigie_hse_analyses_accident', 'vigie_hse_visites', 'vigie_hse_rdv_medicaux', 'vigie_hse_rh_log', 'vigie_hse_audit_log']);
const PROJETEES = { vigie_hse_dataset: ['id', 'collectivite', 'service', 'dateMois', 'typeAtMp', 'arret', 'joursArret', 'risque'] };
// Données privées retirées d'un registre transmis par ailleurs (2026-11-19, demande de l'utilisateur : « pas de données
// privées non plus ») : la base agents, que la recherche d'agent des formulaires lit, arrive sans date de naissance ni civilité.
// Le compte peut la modifier selon ses droits : ces champs, qu'il n'a pas reçus, sont repris du registre complet.
const MASQUES = { vigie_hse_agents: ['dateNaissance', 'civilite'] };

const estAnonyme = page => !!(page && page.anonymise);
const liste = v => { try { const l = JSON.parse(v); return Array.isArray(l) ? l : null; } catch(e){ return null; } };

// la valeur telle que ce compte peut la recevoir (null : rien)
function vue(cle, valeur){
  if (RETIREES.has(cle)) return null;
  if (MASQUES[cle] && valeur != null){
    const l = liste(valeur);
    if (!l) return '[]';
    return JSON.stringify(l.map(r => { if (!r || typeof r !== 'object') return r; const o = Object.assign({}, r); MASQUES[cle].forEach(c => delete o[c]); return o; }));
  }
  const champs = PROJETEES[cle];
  if (!champs || valeur == null) return valeur;
  const l = liste(valeur);
  if (!l) return '[]';
  return JSON.stringify(l.map(r => {
    const o = {};
    if (!r || typeof r !== 'object') return o;
    for (const c of champs) if (r[c] !== undefined) o[c] = r[c];
    if (typeof r.dateAT === 'string'){
      o.annee = r.dateAT.slice(0, 4);
      // La date ramenée au premier jour du mois (le jour exact n'est pas transmis : question 16). Sans aucune
      // date, les pages écartaient chaque enregistrement (registre-at-mp.html ne garde que ceux qui ont une
      // date) et ne pouvaient compter par période : un compte anonymisé ne voyait plus rien (2026-11-19).
      const m = /^(\d{4})-(\d{2})/.exec(r.dateAT);
      if (m) o.dateAT = m[1] + '-' + m[2] + '-01';
    }
    return o;
  }));
}

// { cle: { valeur, revision } } filtré pour ce compte (les clés retirées arrivent vides, avec leur révision)
function filtrer(donnees){
  const r = {};
  for (const [cle, d] of Object.entries(donnees)){
    // rien de la valeur, mais sa révision : la page peut encore y ajouter (journal d'audit) sans conflit
    if (RETIREES.has(cle)){ r[cle] = { valeur: null, revision: d.revision }; continue; }
    r[cle] = (PROJETEES[cle] || MASQUES[cle]) ? { valeur: vue(cle, d.valeur), revision: d.revision } : d;
  }
  return r;
}

// Écriture d'un compte anonymisé sur un registre réduit : seuls les enregistrements NOUVEAUX (identifiant
// inconnu du registre complet) sont retenus, et greffés sur le registre complet.
function grefferAjouts(complet, soumis){
  const base = liste(complet || '[]') || [], s = liste(soumis);
  if (!s) return complet;
  const connus = new Set(base.filter(r => r && r.id != null).map(r => String(r.id)));
  const nouveaux = s.filter(r => r && r.id != null && !connus.has(String(r.id)));
  return nouveaux.length ? JSON.stringify(base.concat(nouveaux)) : complet;
}

// Écriture d'un compte anonymisé sur un registre masqué : chaque enregistrement déjà connu reprend, du registre
// complet, les champs que ce compte n'a pas reçus (sa page les aurait sinon effacés).
function remettreMasques(cle, complet, soumis){
  const champs = MASQUES[cle], s = liste(soumis);
  if (!champs || !s) return soumis;
  const parId = new Map((liste(complet || '[]') || []).filter(r => r && r.id != null).map(r => [String(r.id), r]));
  return JSON.stringify(s.map(r => {
    const avant = r && r.id != null ? parId.get(String(r.id)) : null;
    if (!avant) return r;
    const o = Object.assign({}, r);
    champs.forEach(c => { if (avant[c] !== undefined) o[c] = avant[c]; else delete o[c]; });
    return o;
  }));
}

module.exports = { estAnonyme, vue, filtrer, grefferAjouts, remettreMasques, RETIREES, PROJETEES, MASQUES };
