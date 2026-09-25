// Périmètre d'un compte (P1c, Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quater) : un compte limité à
// certains services (un manager, un RH d'une direction) ne reçoit plus du serveur que les enregistrements
// de ses services. Jusque-là, il recevait tous les registres et c'était l'écran qui n'affichait que les siens.
//
// Règle unique, pour tous les registres : un enregistrement dont le champ « service » nomme un service hors
// du périmètre n'est pas transmis. Ce qui n'a pas de service (référentiels, modèles, catalogues, trames,
// enregistrements communs à la collectivité) reste transmis, comme avant.
//
// En écriture, le compte ne renvoie que sa part : elle est greffée sur le registre complet, qu'il n'a jamais
// reçu. Il ne peut ni toucher un enregistrement hors de son périmètre, ni en créer un.
'use strict';

const limite = page => !!(page && Array.isArray(page.services) && !page.services.includes('*'));
const liste = v => { if (v == null) return null; try { const l = JSON.parse(v); return Array.isArray(l) ? l : null; } catch(e){ return null; } };
const hors = (r, services) => !!(r && typeof r === 'object' && typeof r.service === 'string' && r.service !== '' && !services.includes(r.service));

// la valeur telle que ce compte peut la recevoir
function vue(valeur, services){
  const l = liste(valeur);
  if (!l || !l.some(r => hors(r, services))) return valeur;
  return JSON.stringify(l.filter(r => !hors(r, services)));
}

// { cle: { valeur, revision } } filtré pour ce compte
function filtrer(donnees, services){
  const r = {};
  for (const [cle, d] of Object.entries(donnees)) r[cle] = { valeur: vue(d.valeur, services), revision: d.revision };
  return r;
}

// Écriture d'un compte limité : sa part (soumis) greffée sur le registre complet. Les enregistrements hors
// périmètre gardent leur version et leur place (chacun suit l'enregistrement du périmètre qui le précédait) ;
// ceux que le compte soumettrait hors de son périmètre, ou sous l'identifiant d'un enregistrement qu'il ne
// voit pas, sont ignorés. Suppression (soumis null) : le compte n'efface que sa part.
function greffer(complet, soumis, services){
  const base = complet == null ? [] : liste(complet);   // registre encore absent : rien hors périmètre
  if (!base) return soumis;
  const s = soumis === null ? [] : liste(soumis);
  if (!s) return soumis;
  const idsHors = new Set(base.filter(r => hors(r, services) && r.id != null).map(r => String(r.id)));
  const retenus = s.filter(r => !hors(r, services) && !(r && r.id != null && idsHors.has(String(r.id))));
  if (!base.some(r => hors(r, services))) return soumis === null || retenus.length === s.length ? soumis : JSON.stringify(retenus);
  const gardes = new Set(retenus.filter(r => r && r.id != null).map(r => String(r.id)));
  const apres = new Map();   // identifiant d'un enregistrement du périmètre → enregistrements hors périmètre qui le suivent
  const enTete = [];
  let ancre = null;
  for (const r of base){
    if (hors(r, services)){ if (ancre === null) enTete.push(r); else apres.get(ancre).push(r); }
    else if (r && r.id != null && gardes.has(String(r.id))){ ancre = String(r.id); if (!apres.has(ancre)) apres.set(ancre, []); }
  }
  const sortie = enTete.slice();
  for (const r of retenus){
    sortie.push(r);
    const id = r && r.id != null ? String(r.id) : null;
    if (id !== null && apres.has(id)){ sortie.push(...apres.get(id)); apres.delete(id); }
  }
  return JSON.stringify(sortie);
}

module.exports = { limite, vue, filtrer, greffer, hors };
