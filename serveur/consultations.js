// Journal des consultations des données de santé (2026-09-29 — question 8.10 du dossier remis à l'avocat).
// Le journal d'audit ne trace que les modifications : ici, chaque fois que le serveur transmet à un compte une
// page ou une réponse contenant un registre de santé, une ligne est notée — quand, quel compte, quelle page,
// quels registres et combien d'enregistrements — après les droits de lecture, l'anonymisation et le périmètre,
// donc ce que le compte a réellement reçu. Le journal vit dans sa propre table (base-sqlite.js) : aucune page
// ne le reçoit ni ne peut l'écrire ; seul l'administrateur le lit (GET /api/consultations). Les lignes de plus
// de VIGIE_CONSULTATIONS_JOURS jours (365 par défaut, durée à confirmer avec l'avocat) sont supprimées au
// démarrage puis chaque jour.
'use strict';

// Les registres marqués « sensible » dans VigieStore.CLES (assets/stockage.js) — test-consultations.js vérifie
// que les deux listes restent identiques.
const SANTE = ['vigie_hse_dataset', 'vigie_hse_atmp_dossiers', 'vigie_hse_atmp_arretes', 'vigie_hse_analyses_accident',
  'vigie_hse_visites', 'vigie_hse_rdv_medicaux', 'vigie_hse_rh_log'];
const JOURS = Math.max(1, Number(process.env.VIGIE_CONSULTATIONS_JOURS) || 365);
const LIMITE = 2000;

function nombre(valeur){
  if (valeur == null) return 0;
  try { const v = JSON.parse(valeur); return Array.isArray(v) ? v.length : (v == null ? 0 : 1); } catch(e){ return 0; }
}

// donnees : { cle: { valeur, revision } } tel que transmis ; une ligne seulement si un registre de santé non vide y est
function noter(base, page, chemin, donnees){
  if (!page || !donnees) return false;
  const registres = [];
  for (const cle of SANTE){ const d = donnees[cle]; const n = d ? nombre(d.valeur) : 0; if (n) registres.push({ cle, n }); }
  if (!registres.length) return false;
  base.noterConsultation(String(page.user || '—'), String(chemin || ''), registres);
  return true;
}

const peutLire = page => !!page && page.role === 'admin' && !page.anonymise;
const lister = (base, depuis) => base.consultations(depuis || '', LIMITE);

function purger(base){
  const avant = new Date(Date.now() - JOURS * 86400000).toISOString();
  return base.purgerConsultations(avant);
}
// au démarrage, puis toutes les 24 h ; renvoie la fonction qui arrête
function planifierPurge(base, journal){
  const une = () => { try { const n = purger(base); if (n) journal('Consultations : ' + n + ' ligne(s) de plus de ' + JOURS + ' jours supprimée(s).'); } catch(e){ journal('PURGE DES CONSULTATIONS ÉCHOUÉE : ' + e.message); } };
  une();
  const t = setInterval(une, 24 * 3600 * 1000); t.unref();
  return () => clearInterval(t);
}

module.exports = { SANTE, JOURS, noter, peutLire, lister, purger, planifierPurge };
