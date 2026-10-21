// Revue de direction (ISO 45001 § 9.3, 2026-10-12).
//   RACINE=<dossier> node test-revue-direction.js
process.env.TZ = 'Pacific/Auckland';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const XLSX = require('../../assets/xlsx.full.min.js');
const ROOT = (process.env.RACINE || require('path').resolve(__dirname, '../..')).replace(/\\/g, '/').replace(/\/?$/, '/');
const results = [];
const check = (label, cond, info) => results.push({ label, ok: !!cond, info });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const LECTEUR = { user:'L', role:'ag', email:'L', services:['*'], profils:['Lecteur'], droits:{ 'revue-direction':'consulter' }, compte:{ libelle:'Lecteur', pastille:'L' } };

async function page(fichier, session, stock, query){
  const html = fs.readFileSync(ROOT + fichier, 'utf8');
  const vc = new VirtualConsole(); const erreurs = []; let navigation = false;
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (/navigation/.test(m)) navigation = true; if (!/Not implemented|Could not load/.test(m)) erreurs.push(m.split('\n')[0].slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/' + fichier + (query || '') });
  const w = dom.window;
  for (const [k, v] of Object.entries(stock || {})) w.localStorage.setItem(k, v);
  w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(session));
  w.fetch = () => Promise.reject(new TypeError('hors réseau'));
  const confirms = [], alertes = [];
  w.XLSX = Object.assign({}, XLSX, { writeFile: () => {} });
  w.alert = (m) => alertes.push(m); w.confirm = (m) => { confirms.push(m); return true; }; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  for (const m of html.matchAll(/<script src="(assets\/(?!xlsx\.)[^"]+)"><\/script>/g)) w.eval(fs.readFileSync(ROOT + m[1], 'utf8'));
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ erreurs.push('sync : ' + e.message); } }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await sleep(30);
  const d = w.document, $ = id => d.getElementById(id);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles:true, cancelable:true }));
  const lire = k => JSON.parse(w.localStorage.getItem(k) || 'null');
  const stockage = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
  return { w, d, $, ev, lire, stockage, erreurs, confirms, alertes, navigation: () => navigation };
}
const visible = el => !!el && el.style.display !== 'none';

(async () => {
  const fen = {}; new Function('window', fs.readFileSync(ROOT + 'assets/dates-locales.js', 'utf8'))(fen); const VD = fen.VigieDates;
  const ilYa = j => { const d = new Date(); d.setDate(d.getDate() - j); return VD.iso(d); };
  const auj = VD.aujourdhui();
  const stock0 = {
    vigie_hse_dataset: JSON.stringify([
      { id:'a1', dateAT: ilYa(30), typeAtMp:'Accident de travail', arret:true, joursArret:12, service:'Voirie & Réseaux' },
      { id:'a2', dateAT: ilYa(60), typeAtMp:'Presque accident', arret:false, service:'Voirie & Réseaux' },
      { id:'a3', dateAT: ilYa(500), typeAtMp:'Accident de travail', arret:true, joursArret:5, service:'Patrimoine Bâti' } ]),
    vigie_hse_veille: JSON.stringify([{ id:'v1', titre:'Décret sur les risques <b>chimiques</b>', date: ilYa(40), source:'Légifrance', statut:'À lire' }, { id:'v2', titre:'Ancienne', date: ilYa(800), statut:'Lu' }]),
    vigie_hse_rsst: JSON.stringify([{ id:'r1', date: ilYa(10), statut:'Traitée' }, { id:'r2', date: ilYa(20), statut:'Nouvelle' }]),
    vigie_hse_signalements_parametres: JSON.stringify({ objectifAnnuel: 24 }),
  };

  // 1. RH : aucune revue, création d'un brouillon
  let p = await page('revue-direction.html', RH, stock0);
  check('RH : page ouverte, sans erreur', !p.navigation() && p.erreurs.length === 0, p.erreurs);
  check('RH : liste vide, bouton « Nouvelle revue »', /Aucune revue de direction/.test(p.$('tbody').textContent) && !!p.$('btnNouvelle'));
  p.$('btnNouvelle').click();
  let revues = p.lire('vigie_hse_revues_direction') || [];
  let r1 = revues[0] || {};
  const debutAttendu = (() => { const d = VD.lire(auj); d.setFullYear(d.getFullYear() - 1); d.setDate(d.getDate() + 1); return VD.iso(d); })();
  check('brouillon créé : date du jour, 12 derniers mois, auteur', revues.length === 1 && r1.statut === 'Brouillon' && r1.dateRevue === auj && r1.periodeFin === auj && r1.periodeDebut === debutAttendu && r1.auteur === 'RH1', r1);
  check('chiffres photographiés', r1.chiffres && r1.chiffres.incidents.total === 2 && r1.chiffres.incidents.avecArret === 1 && r1.chiffres.incidents.joursArret === 12, r1.chiffres && r1.chiffres.incidents);
  check('… les mêmes que le composant d\'indicateurs (Reporting)', (() => { const I = p.w.VigieIndicateurs.calculer(p.w.VigieStore, r1.periodeDebut, r1.periodeFin); return I.atTotal === r1.chiffres.incidents.total && Math.round(I.tf * 10) / 10 === r1.chiffres.incidents.tf && I.rsstTotal === r1.chiffres.participation.observations; })());
  check('revue ouverte : 7 données d\'entrée, 4 résultats', visible(p.$('revue')) && p.d.querySelectorAll('[data-entree]').length === 7 && p.d.querySelectorAll('[data-sortie]').length === 4);
  check('veille de la période listée (échappée), l\'ancienne non', /Décret sur les risques <b>chimiques<\/b>/.test(p.$('revue').textContent) && !/Ancienne/.test(p.$('revue').textContent) && !p.$('revue').querySelector('.liste-auto b b'));
  const secObj = [...p.d.querySelectorAll('#revue .sec')].find(x => /Politique et objectifs/.test(x.querySelector('h4').textContent));
  const txtObj = secObj ? secObj.textContent.replace(/\s+/g, '') : '';
  check('objectif de remontée : 24 par an, 1 presque-accident remonté', /24objectifannuelderemontée/.test(txtObj) && /1presque-accidentsremontés/.test(txtObj), txtObj);
  check('a) aucune revue validée auparavant', /Aucune revue validée auparavant/.test(p.$('revue').textContent));

  // 2. saisie, actions, enregistrement
  p.$('rParticipants').value = 'Maire adjoint, DGS, RH1, préventeur <img src=x onerror=alert(1)>';
  p.d.querySelector('[data-entree="performance"]').value = 'Un accident avec arrêt, en baisse.';
  p.d.querySelector('[data-sortie="conclusions"]').value = 'Démarche pertinente, efficacité à renforcer.';
  p.$('btnAjoutDecision').click(); p.$('btnAjoutDecision').click();
  let lignes = p.d.querySelectorAll('#rDecisions .dyn-row');
  lignes[0].querySelector('[data-k="description"]').value = 'Former les encadrants à l\'analyse d\'accident';
  lignes[0].querySelector('[data-k="responsable"]').value = 'RH';
  lignes[0].querySelector('[data-k="echeance"]').value = '2027-03-31';
  lignes[1].querySelector('[data-k="description"]').value = 'Fixer un objectif de taux de fréquence';
  p.ev(p.$('revueForm'), 'submit');
  r1 = p.lire('vigie_hse_revues_direction')[0];
  check('enregistré : participants, analyse, conclusions, 2 actions', /DGS/.test(r1.participants) && r1.entrees.performance === 'Un accident avec arrêt, en baisse.' && r1.sorties.conclusions && r1.decisions.length === 2 && r1.decisions[0].responsable === 'RH', r1);
  check('participants affichés comme du texte', !p.d.querySelector('#tbody img') && /<img src=x/.test(p.$('tbody').textContent));
  check('liste : « 2 prévues », brouillon', /2 prévues/.test(p.$('tbody').textContent) && /Brouillon/.test(p.$('tbody').textContent));
  // période changée → chiffres recalculés
  p.$('rDebut').value = ilYa(45); p.ev(p.$('revueForm'), 'submit');
  r1 = p.lire('vigie_hse_revues_direction')[0];
  check('période changée : chiffres recalculés (1 événement)', r1.periodeDebut === ilYa(45) && r1.chiffres.periode.debut === ilYa(45) && r1.chiffres.incidents.total === 1, r1.chiffres.incidents);
  p.$('rDebut').value = debutAttendu; p.ev(p.$('revueForm'), 'submit');
  // actualiser
  const avant = p.lire('vigie_hse_revues_direction')[0].chiffres.calculeLe;
  await sleep(5);
  p.$('btnActualiser').click();
  check('« Actualiser les chiffres » refait la photo', p.lire('vigie_hse_revues_direction')[0].chiffres.calculeLe !== avant);
  // période inversée refusée
  p.$('rDebut').value = '2099-01-01'; p.ev(p.$('revueForm'), 'submit');
  check('période inversée refusée', p.alertes.some(a => /début de la période est après sa fin/.test(a)) && p.lire('vigie_hse_revues_direction')[0].periodeDebut === debutAttendu);
  p.$('rDebut').value = debutAttendu;

  // 3. valider
  p.$('btnValider').click();
  r1 = p.lire('vigie_hse_revues_direction')[0];
  check('validée : statut, par, le', r1.statut === 'Validée' && r1.validePar === 'RH1' && r1.valideLe === auj);
  check('validée : champs désactivés, pas de bouton enregistrer', p.$('rParticipants').disabled && p.d.querySelector('[data-entree]').disabled && !p.d.querySelector('#revueForm button[type=submit]') && !!p.$('btnRouvrir'));
  check('validée : actions listées « À faire »', (p.$('rDecisions').textContent.match(/À faire/g) || []).length === 2);
  check('audit : validation notée', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Revue de direction' && a.type === 'Validation'));
  let stock = p.stockage();

  // 4. Plan d'actions : les deux actions, origine « Revue de direction »
  p = await page('plan-actions.html', RH, stock);
  const pa = (p.lire('vigie_hse_actions') || []).filter(a => a.origine === 'Revue de direction');
  check('plan d\'actions : 2 actions reprises', pa.length === 2 && pa.every(a => /^pa-rd-/.test(a.id) && /Revue de direction du /.test(a.titre)), pa);
  check('plan d\'actions : pastille', /origine-chip revue/.test(p.d.body.innerHTML));
  // l'une passe à « Fait » au Plan d'actions
  const acts = p.lire('vigie_hse_actions'); acts.find(a => a.id === pa[0].id).statut = 'Fait';
  p.w.localStorage.setItem('vigie_hse_actions', JSON.stringify(acts));
  stock = p.stockage();

  // 5. seconde revue : période à la suite, suites de la précédente
  p = await page('revue-direction.html', RH, stock);
  check('liste : « 1 / 2 soldée », KPI', /1 \/ 2 soldées/.test(p.$('tbody').textContent) && p.$('kpiRevues').textContent === '1' && p.$('kpiDecisions').textContent === '1', [p.$('tbody').textContent, p.$('kpiDecisions').textContent]);
  // une brouille : revue précédente dont la période finit il y a 100 jours
  revues = p.lire('vigie_hse_revues_direction'); revues[0].periodeFin = ilYa(100); p.w.localStorage.setItem('vigie_hse_revues_direction', JSON.stringify(revues));
  p.$('btnNouvelle').click();
  revues = p.lire('vigie_hse_revues_direction');
  const r2 = revues.find(r => r.id !== r1.id);
  check('seconde revue : période à partir du lendemain de la précédente', r2 && r2.periodeDebut === ilYa(99) && r2.periodeFin === auj, r2 && [r2.periodeDebut, ilYa(99)]);
  check('a) suites : les 2 actions de la revue précédente, dont 1 « Fait »', /Former les encadrants/.test(p.$('revue').textContent) && /Fait/.test(p.$('revue').querySelector('.sec').textContent) && r2.chiffres.precedentes.length === 2);
  // impression
  p.$('btnImprimer').click();
  const imp = p.$('rd-impression');
  check('impression : compte rendu, sections, signatures', imp && /Compte rendu de revue de direction/.test(imp.textContent) && /Données d'entrée/.test(imp.textContent) && /Pour la direction/.test(imp.textContent) && /brouillon, non validé/.test(imp.textContent));
  // supprimer le brouillon
  p.$('btnSupprimer').click();
  check('brouillon supprimé', p.lire('vigie_hse_revues_direction').length === 1);
  // rouvrir la revue validée
  p.d.querySelector('[data-ouvrir]').click();
  p.$('btnImprimer').click();
  check('impression d\'une revue validée : « validée par RH1 », actions et leur état', /validée par RH1/.test(p.$('rd-impression').textContent) && /Former les encadrants/.test(p.$('rd-impression').textContent) && /\(Fait\)/.test(p.$('rd-impression').textContent));
  p.$('btnRouvrir').click();
  const r1b = p.lire('vigie_hse_revues_direction')[0];
  check('rouverte : brouillon, sans validation, champs modifiables', r1b.statut === 'Brouillon' && !('validePar' in r1b) && !p.$('rParticipants').disabled);
  stock = p.stockage();
  p = await page('plan-actions.html', RH, stock);
  check('rouverte : ses actions restent au Plan d\'actions', (p.lire('vigie_hse_actions') || []).filter(a => a.origine === 'Revue de direction').length === 2);

  // 6. lecteur (consulter) : les seules revues validées, en lecture seule (question 23) ; agent : redirigé
  p = await page('revue-direction.html', LECTEUR, stock, '?ouvrir=' + r1.id);
  check('lecteur : pas de « Nouvelle revue »', !p.$('btnNouvelle') && p.erreurs.length === 0, p.erreurs);
  check('lecteur : un brouillon ne lui est pas montré, ni par ?ouvrir', !p.d.querySelector('[data-ouvrir]') && /Aucune revue de direction validée/.test(p.$('tbody').textContent) && !p.$('rParticipants'), p.$('tbody').textContent);
  check('lecteur : pas de compteur de brouillons', p.$('kpiBrouillons').closest('.ps-kpi').style.display === 'none');
  revues = JSON.parse(stock.vigie_hse_revues_direction); Object.assign(revues[0], { statut:'Validée', validePar:'RH1', valideLe:auj });
  stock.vigie_hse_revues_direction = JSON.stringify(revues);
  p = await page('revue-direction.html', LECTEUR, stock);
  p.d.querySelector('[data-ouvrir]').click();
  check('lecteur : revue validée ouverte en lecture seule, sans boutons', p.$('rParticipants').disabled && !p.$('btnValider') && !p.$('btnActualiser') && !p.$('btnSupprimer') && !p.$('btnRouvrir') && !!p.$('btnImprimer'));
  p = await page('revue-direction.html', AG, stock);
  check('agent : redirigé', p.navigation());

  // 7. droits, menu, serveur
  const VigieDroits = require(ROOT + 'assets/droits.js');
  const prof = VigieDroits.fusionnerProfils([]);
  check('préréglages : admin et RH gèrent, les autres rien', prof.find(x => x.id === 'p-admin').droits['revue-direction'] === 'gerer' && prof.find(x => x.id === 'p-rh').droits['revue-direction'] === 'gerer' && ['p-manager', 'p-agent', 'p-preventeur', 'p-representant'].every(id => prof.find(x => x.id === id).droits['revue-direction'] === 'aucun'));
  const Lecture = require(ROOT + 'serveur/lecture.js'), Droits = require(ROOT + 'serveur/droits.js');
  const sess = droits => ({ user:'u', services:['*'], droits });
  const val = JSON.stringify([{ id:'rd1', dateRevue:'2026-10-12', statut:'Validée', participants:'X', entrees:{ a:'secret' }, decisions:[{ id:'d', description:'x' }] }]);
  check('serveur : sans le module, seules les décisions', JSON.stringify(Object.keys(JSON.parse(Lecture.vue(sess({ actions:'consulter' }), 'vigie_hse_revues_direction', val))[0]).sort()) === JSON.stringify(['dateRevue', 'decisions', 'id', 'statut']));
  check('serveur : « consulter » reçoit tout', Lecture.vue(sess({ 'revue-direction':'consulter' }), 'vigie_hse_revues_direction', val) === val);
  check('serveur : écriture réservée à « gérer »', Droits.niveau(sess({ 'revue-direction':'gerer' }), 'vigie_hse_revues_direction') === 'complet' && Droits.niveau(sess({ 'revue-direction':'consulter' }), 'vigie_hse_revues_direction') === 'aucun' && Droits.cles.includes('vigie_hse_revues_direction'));

  const ok = results.filter(r => r.ok).length;
  results.forEach(r => console.log((r.ok ? 'OK  ' : 'KO  ') + r.label + (r.ok || r.info === undefined ? '' : '  → ' + JSON.stringify(r.info).slice(0, 400))));
  console.log(`\n${ok} OK, ${results.length - ok} KO`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
