// Sauvegardes planifiées de la base (P1c, Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quater).
// Une copie complète au démarrage si la dernière date de plus d'un intervalle, puis à chaque intervalle ;
// seules les GARDER plus récentes restent. Une copie se prend sans arrêter le serveur (base.copier).
//
// Restaurer : arrêter le serveur, remplacer serveur/donnees/vigie.db par la copie choisie (et supprimer
// vigie.db-wal et vigie.db-shm s'ils existent), relancer.
//
// Une sauvegarde sur le même disque protège d'une erreur de saisie ou d'une base abîmée, pas d'une panne
// du disque : le dossier (VIGIE_SAUVEGARDES) doit être recopié ailleurs, ou pointer vers un autre disque.
'use strict';
const fs = require('fs'), path = require('path');

const MOTIF = /^vigie-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;
const deux = n => String(n).padStart(2, '0');
// nom lisible, à l'heure locale : vigie-2026-09-25_14-30-00.db
const nom = d => 'vigie-' + d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '_' + deux(d.getHours()) + '-' + deux(d.getMinutes()) + '-' + deux(d.getSeconds()) + '.db';

function existantes(dossier){
  try { return fs.readdirSync(dossier).filter(f => MOTIF.test(f)).sort(); } catch(e){ return []; }
}

// une sauvegarde maintenant, puis le ménage : renvoie le chemin de la copie
function sauvegarder(base, dossier, garder){
  fs.mkdirSync(dossier, { recursive: true });
  const f = path.join(dossier, nom(new Date()));
  if (fs.existsSync(f)) return f;   // deux dans la même seconde : la première suffit
  base.copier(f);
  const liste = existantes(dossier);
  for (const vieille of liste.slice(0, Math.max(0, liste.length - garder))) fs.rmSync(path.join(dossier, vieille), { force: true });
  return f;
}

// planifie les sauvegardes ; heures = 0 les désactive. Renvoie la fonction qui les arrête.
function planifier(base, { dossier, heures, garder, journal }){
  if (!(heures > 0)) { journal('Sauvegardes planifiées désactivées (VIGIE_SAUVEGARDE_HEURES=0).'); return () => {}; }
  const intervalle = heures * 3600 * 1000;
  const une = () => {
    try { journal('Sauvegarde : ' + sauvegarder(base, dossier, garder)); }
    catch(e){ journal('SAUVEGARDE ÉCHOUÉE : ' + e.message); }
  };
  const derniere = existantes(dossier).pop();
  const age = derniere ? Date.now() - fs.statSync(path.join(dossier, derniere)).mtimeMs : Infinity;
  let minuteur = null;
  const premiere = setTimeout(() => { une(); minuteur = setInterval(une, intervalle); minuteur.unref(); }, Math.max(0, Math.min(intervalle, intervalle - age)));
  premiere.unref();
  journal('Sauvegardes : toutes les ' + heures + ' h dans ' + dossier + ' (les ' + garder + ' dernières gardées).');
  return () => { clearTimeout(premiere); if (minuteur) clearInterval(minuteur); };
}

module.exports = { planifier, sauvegarder, existantes };
