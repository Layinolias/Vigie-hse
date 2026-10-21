// Question 21 (réponse du 2026-10-14) : chaque organisation règle les rubriques exigées d'un plan d'urgence.
//   RACINE=<dossier> node test-q21.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const SANS = { user:'X', role:'ag', email:'X', services:['*'], profils:['Perso'], droits:{ atmp:'consulter' }, compte:{ libelle:'Perso', pastille:'P' } };
const CLE = 'vigie_hse_plans_urgence_parametres';

(async () => {
  const fen = {}; new Function('window', require('fs').readFileSync(ROOT + 'assets/dates-locales.js', 'utf8'))(fen);
  const auj = fen.VigieDates.aujourdhui();
  const plan = { id:'pl1', site:'Mairie', collectivite:'Ville', service:'Voirie & Réseaux', dateRevue: auj, periodiciteRevueMois: 12, consignes:'Évacuer.', alerte:'Appeler le 18.',
    contacts:[{ id:'c1', libelle:'Sapeurs-pompiers', numero:'18' }], rassemblement:[{ id:'r1', libelle:'Parking nord' }], designes:[], moyens:[] };
  const stock0 = { vigie_hse_plans_urgence: JSON.stringify([plan]) };
  const carte = (p) => [...p.d.querySelectorAll('.plan-card')].find(c => c.querySelector('h4').textContent === 'Mairie');
  const cases = (p) => [...p.$('planRubriques').querySelectorAll('[data-rubrique]')];

  // 1. Par défaut : toutes les rubriques exigées
  let p = await H.page('urgences-exercices.html', RH, stock0);
  check('RH : sans erreur, bouton « Rubriques exigées », panneau fermé', p.erreurs.length === 0 && !!p.$('btnRubriques') && p.$('planRubriques').style.display === 'none', p.erreurs);
  check('par défaut : Mairie incomplet, manque personnes désignées et moyens de secours', /Incomplet/.test(carte(p).textContent) && /Manque : Personnes désignées, Moyens de secours/.test(carte(p).textContent));
  p.$('btnRubriques').click();
  check('panneau ouvert : les 8 rubriques, toutes cochées', H.visible(p.$('planRubriques')) && cases(p).length === 8 && cases(p).every(c => c.checked) && p.$('btnRubriques').getAttribute('aria-expanded') === 'true');
  // annuler : rien d'enregistré
  cases(p).find(c => c.dataset.rubrique === 'designes').checked = false;
  p.$('btnRubriquesAnnuler').click();
  check('annuler : rien d\'enregistré, panneau fermé', !p.w.localStorage.getItem(CLE) && p.$('planRubriques').style.display === 'none');

  // 2. Retirer deux rubriques
  p.$('btnRubriques').click();
  cases(p).filter(c => ['designes', 'moyens'].includes(c.dataset.rubrique)).forEach(c => { c.checked = false; });
  p.$('btnRubriquesOk').click();
  const par = JSON.parse(p.w.localStorage.getItem(CLE) || 'null');
  check('enregistré : 6 rubriques, dans l\'ordre du plan', par && JSON.stringify(par.rubriques) === '["contacts","alerte","consignes","rassemblement","dateRevue","frequenceRevue"]', par);
  check('Mairie devient « Complet », plus de « Manque »', /Complet/.test(carte(p).querySelector('.chip').textContent) && !/Manque/.test(carte(p).textContent));
  check('synthèse : 0 incomplet', /1<\/b> plan · <b>0<\/b> incomplet/.test(p.$('planSynthese').innerHTML), p.$('planSynthese').innerHTML);
  const audit = (JSON.parse(p.w.localStorage.getItem('vigie_hse_audit_log') || '[]')).map(a => a.description || '');
  check('journal : les rubriques exigées', audit.some(a => a === "Rubriques exigées des plans d'urgence : numéros d'urgence, donner l'alerte, consignes, points de rassemblement, date de dernière revue, fréquence de revue"), audit);
  p.$('btnNewPlan').click();
  check('formulaire : la note dit les 6 rubriques exigées', p.$('pRubriquesNote').textContent === "Rubriques exigées : numéros d'urgence, donner l'alerte, consignes, points de rassemblement, date de dernière revue, fréquence de revue. Un plan incomplet s'enregistre, mais il reste signalé « Incomplet ».", p.$('pRubriquesNote').textContent);
  p.$('btnCancelPlan').click();
  p.$('btnExportPlans').click();
  const lignes = p.ecrits.length ? H.XLSX.utils.sheet_to_json(p.ecrits[0].wb.Sheets[p.ecrits[0].wb.SheetNames[0]]) : [];
  check('export : plus de rubrique manquante pour Mairie', lignes.length === 1 && !lignes[0]['Rubriques manquantes'], lignes[0]);
  p.$('pEtat').value = 'incomplet'; p.ev(p.$('pEtat'), 'change');
  check('filtre « Incomplets » : vide', p.d.querySelectorAll('.plan-card').length === 0);
  p.$('pEtat').value = 'all'; p.ev(p.$('pEtat'), 'change');
  const stock1 = p.stockage();

  // 3. Lecteurs : le même réglage, sans le bouton
  p = await H.page('urgences-exercices.html', AG, stock1);
  check('agent (lecture) : pas de bouton, Mairie « Complet » selon le réglage', p.erreurs.length === 0 && !p.$('btnRubriques') && /Complet/.test(carte(p).querySelector('.chip').textContent), p.erreurs);
  p = await H.page('urgences-exercices.html', PREV, stock1);
  check('préventeur (gère les urgences) : bouton présent', !!p.$('btnRubriques'));

  // 4. Toutes recochées → retour au défaut ; aucune → jamais incomplet
  p = await H.page('urgences-exercices.html', RH, stock1);
  p.$('btnRubriques').click();
  check('panneau rouvert : les 6 cochées', cases(p).filter(c => c.checked).length === 6);
  cases(p).forEach(c => { c.checked = true; });
  p.$('btnRubriquesOk').click();
  check('toutes cochées : le réglage revient au défaut (clé sans liste), Mairie incomplet', !('rubriques' in JSON.parse(p.w.localStorage.getItem(CLE) || '{}')) && /Incomplet/.test(carte(p).textContent));
  p.$('btnRubriques').click();
  cases(p).forEach(c => { c.checked = false; });
  p.$('btnRubriquesOk').click();
  p.$('btnNewPlan').click();
  check('aucune exigée : Mairie « Complet », la note le dit', /Complet/.test(carte(p).querySelector('.chip').textContent) && /Aucune rubrique n'est exigée/.test(p.$('pRubriquesNote').textContent));
  const n = (JSON.parse(p.w.localStorage.getItem('vigie_hse_audit_log') || '[]')).filter(a => /Rubriques exigées/.test(a.description || '')).length;
  check('journal : une ligne par changement (aucune pour un réglage inchangé)', n === 3, n);
  p.$('btnCancelPlan').click();
  p.$('btnRubriques').click(); p.$('btnRubriquesOk').click();
  check('… réenregistrer sans changement n\'ajoute rien', (JSON.parse(p.w.localStorage.getItem('vigie_hse_audit_log') || '[]')).filter(a => /Rubriques exigées/.test(a.description || '')).length === 3);
  // un identifiant inconnu (version future) est ignoré
  p = await H.page('urgences-exercices.html', RH, Object.assign({}, stock0, { [CLE]: JSON.stringify({ rubriques: ['consignes', 'planDesLieux'] }) }));
  check('identifiant inconnu ignoré : seule « consignes » exigée, Mairie complet', /Complet/.test(carte(p).querySelector('.chip').textContent));

  // 5. Serveur et registre des clés
  const SD = require(ROOT + 'serveur/droits.js'), SL = require(ROOT + 'serveur/lecture.js');
  check('registre : clé de paramètres, non sensible', (() => { const c = p.w.VigieStore.CLES[CLE]; return c && c.nature === 'parametres' && c.sensible === false; })());
  check('serveur : règle d\'écriture déclarée ; RH et préventeur écrivent, l\'agent non', SD.cles.includes(CLE) && SD.niveau(RH, CLE) === 'complet' && SD.niveau(PREV, CLE) === 'complet' && SD.niveau(AG, CLE) === 'aucun', [SD.niveau(RH, CLE), SD.niveau(PREV, CLE), SD.niveau(AG, CLE)]);
  check('serveur : lue par qui lit les plans, retirée aux autres', SL.regle(AG, CLE) === null && SL.regle(SANS, CLE) === SL.RETIRE);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
