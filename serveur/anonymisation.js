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
const RETIREES = new Set(['vigie_hse_atmp_dossiers', 'vigie_hse_atmp_arretes', 'vigie_hse_analyses_accident', 'vigie_hse_visites', 'vigie_hse_rdv_medicaux']);
const PROJETEES = { vigie_hse_dataset: ['id', 'collectivite', 'service', 'dateMois', 'typeAtMp', 'arret', 'joursArret', 'risque'] };

const estAnonyme = page => !!(page && page.anonymise);
const liste = v => { try { const l = JSON.parse(v); return Array.isArray(l) ? l : null; } catch(e){ return null; } };

// la valeur telle que ce compte peut la recevoir (null : rien)
function vue(cle, valeur){
  if (RETIREES.has(cle)) return null;
  const champs = PROJETEES[cle];
  if (!champs || valeur == null) return valeur;
  const l = liste(valeur);
  if (!l) return '[]';
  return JSON.stringify(l.map(r => {
    const o = {};
    if (!r || typeof r !== 'object') return o;
    for (const c of champs) if (r[c] !== undefined) o[c] = r[c];
    if (typeof r.dateAT === 'string') o.annee = r.dateAT.slice(0, 4);
    return o;
  }));
}

// { cle: { valeur, revision } } filtré pour ce compte (les clés retirées disparaissent)
function filtrer(donnees){
  const r = {};
  for (const [cle, d] of Object.entries(donnees)){
    if (RETIREES.has(cle)) continue;
    r[cle] = PROJETEES[cle] ? { valeur: vue(cle, d.valeur), revision: d.revision } : d;
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

module.exports = { estAnonyme, vue, filtrer, grefferAjouts, RETIREES, PROJETEES };
