// Objectifs santé-sécurité (ISO 45001 § 6.2, 2026-10-13).
//   RACINE=<dossier> node test-objectifs.js
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
const LECTEUR = { user:'L', role:'ag', email:'L', services:['*'], profils:['Lecteur'], droits:{ objectifs:'consulter' }, compte:{ libelle:'Lecteur', pastille:'L' } };

async function page(fichier, session, stock, query){
  const html = fs.readFileSync(ROOT + fichier, 'utf8');
  const vc = new VirtualConsole(); const erreurs = []; let navigation = false;
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (/navigation/.test(m)) navigation = true; if (!/Not implemented|Could not load/.test(m)) erreurs.push(m.split('\n')[0].slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/' + fichier + (query || '') });
  const w = dom.window;
  for (const [k, v] of Object.entries(stock || {})) w.localStorage.setItem(k, v);
  w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(session));
  w.fetch = () => Promise.reject(new TypeError('hors réseau'));
  const confirms = [], alertes = [], fichiers = [];
  w.XLSX = Object.assign({}, XLSX, { writeFile: (wb, nom) => fichiers.push({ wb, nom }) });
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
  const choisir = (id, v) => { $(id).value = v; ev($(id), 'change'); };
  const soumettre = () => ev($('ficheForm'), 'submit');
  return { w, d, $, ev, lire, stockage, erreurs, confirms, alertes, fichiers, choisir, soumettre, navigation: () => navigation };
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
  };

  // 1. RH : page vide, création d'un objectif « au plus 0 accident avec arrêt »
  let p = await page('objectifs.html', RH, stock0);
  check('RH : page ouverte, sans erreur', !p.navigation() && p.erreurs.length === 0, p.erreurs);
  check('RH : liste vide, bouton « Nouvel objectif »', /Aucun objectif pour le moment/.test(p.$('tbody').textContent) && !!p.$('btnNouveau'));
  p.$('btnNouveau').click();
  check('nouvel objectif : formulaire ouvert sur l\'année civile', visible(p.$('fiche')) && p.$('oDebut').value === auj.slice(0, 4) + '-01-01' && p.$('oFin').value === auj.slice(0, 4) + '-12-31');
  check('nouvel objectif : unité et valeur relevée cachées, pas de « Clore »', !visible(p.d.querySelector('[data-manuel]')) && !p.$('btnClore') && !p.$('btnSupprimer'));
  p.soumettre();
  check('refus : intitulé manquant', /Indiquez l'objectif/.test(p.alertes.pop() || ''));
  p.$('oIntitule').value = 'Moins de <b>accidents</b>';
  p.$('oSens').value = 'min';
  p.choisir('oIndicateur', 'atAvec');
  check('indicateur choisi : sens habituel proposé (au plus), aide affichée', p.$('oSens').value === 'max' && /avec arrêt, datés de la période/.test(p.$('oAide').textContent));
  check('sans cible : « Sans cible chiffrée »', /Sans cible chiffrée/.test(p.$('oLecture').textContent));
  p.soumettre();
  check('refus : cible manquante', /Indiquez la cible/.test(p.alertes.pop() || ''));
  p.$('oCible').value = 'abc'; p.soumettre();
  check('refus : cible non numérique', /doit être un nombre/.test(p.alertes.pop() || ''));
  p.$('oCible').value = '0'; p.$('oDebut').value = ilYa(200); p.choisir('oFin', ilYa(-100));
  check('lecture en direct : 1 accident, écart +1, « Non atteint » (cible déjà dépassée)', /Non atteint/.test(p.$('oLecture').textContent) && /\+1/.test(p.$('oLecture').textContent), p.$('oLecture').textContent);
  p.$('btnAjoutAction').click(); p.$('btnAjoutAction').click();
  const lignes = p.$('oActions').querySelectorAll('.dyn-row');
  lignes[0].querySelector('[data-k=description]').value = 'Former les chefs d\'équipe';
  lignes[0].querySelector('[data-k=responsable]').value = 'Mme Durand';
  lignes[0].querySelector('[data-k=echeance]').value = ilYa(-60);
  p.soumettre();
  let objs = p.lire('vigie_hse_objectifs') || [];
  const o1 = objs[0] || {};
  check('enregistré : un objectif, une action (la ligne vide ignorée), auteur', objs.length === 1 && o1.indicateur === 'atAvec' && o1.cible === 0 && o1.sens === 'max' && o1.actions.length === 1 && o1.actions[0].id && o1.auteur === 'RH1' && o1.statut === 'En vigueur', o1);
  check('enregistré : pas d\'unité ni de valeur relevée hors mesure manuelle', !('unite' in o1) && !('valeurManuelle' in o1));
  check('audit : création notée', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Objectifs santé-sécurité' && a.type === 'Création'));
  check('liste : intitulé échappé, cible, valeur, état', /&lt;b&gt;accidents/.test(p.$('tbody').innerHTML) && /au plus 0/.test(p.$('tbody').textContent) && /Non atteint/.test(p.$('tbody').textContent) && /0 \/ 1 soldée/.test(p.$('tbody').textContent), p.$('tbody').textContent);
  check('KPI : 1 en vigueur, 0 tenu, 1 en écart, 1 action', p.$('kpiEnVigueur').textContent === '1' && p.$('kpiTenus').textContent === '0' && p.$('kpiEcart').textContent === '1' && p.$('kpiActions').textContent === '1');

  // 2. autres objectifs : taux de fréquence (tenu), signalements (en cours), mesure manuelle
  const creer = (intitule, ind, cible, extra) => {
    p.$('btnNouveau').click();
    p.$('oIntitule').value = intitule; p.choisir('oIndicateur', ind); p.$('oCible').value = cible;
    p.$('oDebut').value = ilYa(200); p.$('oFin').value = ilYa(-100);
    if (extra) extra();
    p.soumettre();
  };
  creer('TF sous 5', 'tf', '5');
  creer('Remontée des presque-accidents', 'presqueAccidents', '10');
  creer('Agents formés SST', 'manuel', '', () => { p.$('oUnite').value = 'agents'; p.$('oValeur').value = '12'; });
  objs = p.lire('vigie_hse_objectifs');
  check('quatre objectifs enregistrés', objs.length === 4, p.alertes);
  const W = p.w;
  const I = W.VigieIndicateurs.calculer(W.VigieStore, ilYa(200), auj);
  const tfAttendu = Math.round(W.VigieFormules.tauxFrequence(1, I.dureeAtJours) * 10) / 10;
  const eTf = W.VigieObjectifs.evaluer(objs[1], W.VigieStore);
  check('TF : valeur = formule du Reporting sur la période écoulée, « Tenu à ce jour »', eTf.valeur === tfAttendu && eTf.etat === 'tenu' && eTf.borne === auj, [eTf, tfAttendu]);
  check('presque-accidents remontés (au moins 10, 1 au registre) : « En cours »', (e => e.etat === 'en-cours' && e.valeur === 1)(W.VigieObjectifs.evaluer(objs[2], W.VigieStore)));
  const eMan = W.VigieObjectifs.evaluer(objs[3], W.VigieStore);
  check('mesure manuelle sans cible : « Sans cible chiffrée », valeur 12 agents', eMan.etat === 'sans-cible' && eMan.valeur === 12 && W.VigieObjectifs.formater(12, objs[3]) === '12 agents' && objs[3].unite === 'agents');
  check('KPI : 4 en vigueur, 1 tenu, 1 en écart', p.$('kpiEnVigueur').textContent === '4' && p.$('kpiTenus').textContent === '1' && p.$('kpiEcart').textContent === '1');

  // 3. clôture de la mesure manuelle : constat obligatoire
  p.d.querySelector(`[data-ouvrir="${objs[3].id}"]`).click();
  check('mesure manuelle : unité et valeur visibles, constat proposé', visible(p.d.querySelector('[data-manuel]')) && visible(p.$('oConstatBloc')));
  p.$('btnClore').click();
  check('clôture refusée sans constat', /résultat constaté/.test(p.alertes.pop() || '') && p.lire('vigie_hse_objectifs')[3].statut === 'En vigueur');
  p.$('oConstat').value = 'atteint'; p.$('btnClore').click();
  let o4 = p.lire('vigie_hse_objectifs')[3];
  check('clos : « Atteint » constaté, par, le, figé', o4.statut === 'Clos' && o4.resultat.etat === 'atteint' && o4.closPar === 'RH1' && o4.closLe === auj && o4.resultat.valeur === 12);
  check('clos : formulaire en lecture seule, « Rouvrir »', p.$('oIntitule').disabled && !p.d.querySelector('#ficheForm button[type=submit]') && !!p.$('btnRouvrir') && !visible(p.$('oConstatBloc')));
  check('filtre « En vigueur » : l\'objectif clos n\'apparaît plus', !/Agents formés SST/.test(p.$('tbody').textContent));
  p.choisir('fStatut', 'Clos');
  check('filtre « Clos » : lui seul', /Agents formés SST/.test(p.$('tbody').textContent) && p.$('tbody').querySelectorAll('tr').length === 1);
  p.choisir('fStatut', '');

  // 4. clôture de l'objectif « accidents » : résultat figé, même si les données bougent ensuite
  p.d.querySelector(`[data-ouvrir="${o1.id}"]`).click();
  p.$('btnClore').click();
  let o1c = p.lire('vigie_hse_objectifs')[0];
  check('clos : « Non atteint », valeur 1', o1c.statut === 'Clos' && o1c.resultat.etat === 'non-atteint' && o1c.resultat.valeur === 1 && o1c.resultat.ecart === 1, o1c.resultat);
  check('audit : clôture notée', (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Clôture' && /Non atteint/.test(a.description)));
  let stock = p.stockage();
  const ds = JSON.parse(stock.vigie_hse_dataset); ds.push({ id:'a4', dateAT: ilYa(5), typeAtMp:'Accident de travail', arret:true, joursArret:3, service:'Voirie & Réseaux' });
  stock.vigie_hse_dataset = JSON.stringify(ds);

  // 5. Plan d'actions : l'action de l'objectif, origine « Objectif »
  p = await page('plan-actions.html', RH, stock);
  const pa = (p.lire('vigie_hse_actions') || []).filter(a => a.origine === 'Objectif');
  check('plan d\'actions : 1 action reprise, identifiant stable, titre', pa.length === 1 && pa[0].id === 'pa-obj-' + o1.id + '-' + o1.actions[0].id && /^Objectif : Moins de/.test(pa[0].titre) && pa[0].responsable === 'Mme Durand', pa);
  check('plan d\'actions : pastille « Objectif »', /origine-chip objectif/.test(p.d.body.innerHTML) && p.erreurs.length === 0, p.erreurs);
  const acts = p.lire('vigie_hse_actions'); acts.find(a => a.id === pa[0].id).statut = 'Fait';
  p.w.localStorage.setItem('vigie_hse_actions', JSON.stringify(acts));
  stock = p.stockage();

  // 6. retour : valeur figée malgré le nouvel accident, action suivie au Plan d'actions
  p = await page('objectifs.html', RH, stock);
  p.choisir('fStatut', '');
  check('objectif clos : la liste garde la valeur de la clôture (1, pas 2)', (() => { const tr = [...p.$('tbody').querySelectorAll('tr')].find(t => /Moins de/.test(t.textContent)); return tr && tr.querySelectorAll('td')[4].textContent.trim() === '1' && /1 \/ 1 soldée/.test(tr.textContent); })());
  p.d.querySelector(`[data-ouvrir="${o1.id}"]`).click();
  check('action déjà au Plan d\'actions : en lecture, avec son état « Fait » et le lien', !!p.$('oActions').querySelector('[data-fixe]') && /Fait/.test(p.$('oActions').textContent) && !!p.$('oActions').querySelector('a[href="plan-actions.html"]'));
  p.$('btnRouvrir').click();
  o1c = p.lire('vigie_hse_objectifs')[0];
  check('rouvert : en vigueur, résultat effacé, valeur recalculée (2)', o1c.statut === 'En vigueur' && !('resultat' in o1c) && !('closPar' in o1c) && W === W && p.w.VigieObjectifs.evaluer(o1c, p.w.VigieStore).valeur === 2);
  check('rouvert : l\'action reprise reste en lecture, une nouvelle peut s\'ajouter', !!p.$('oActions').querySelector('[data-fixe]') && !!p.$('btnAjoutAction'));
  p.$('btnAjoutAction').click();
  p.$('oActions').querySelector('.dyn-row:not([data-fixe]) [data-k=description]').value = 'Audit des postes';
  p.soumettre();
  o1c = p.lire('vigie_hse_objectifs')[0];
  check('enregistré : l\'ancienne action gardée, la nouvelle ajoutée', o1c.actions.length === 2 && o1c.actions[0].description === 'Former les chefs d\'équipe' && o1c.actions[1].description === 'Audit des postes', o1c.actions);
  // suppression
  const o3 = p.lire('vigie_hse_objectifs')[2];
  p.d.querySelector(`[data-ouvrir="${o3.id}"]`).click();
  p.$('btnSupprimer').click();
  check('supprimé, audit', p.lire('vigie_hse_objectifs').length === 3 && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Suppression'));
  // export
  p.$('btnExport').click();
  const f = p.fichiers[0];
  const lignesX = f ? XLSX.utils.sheet_to_json(f.wb.Sheets['Objectifs']) : [];
  check('export : deux feuilles, une ligne par objectif, « Imprimer / PDF » branché', f && /^objectifs_sante_securite_/.test(f.nom) && lignesX.length === 3 && f.wb.SheetNames.includes('Actions') && /Imprimer/.test(p.d.body.textContent), lignesX[0]);
  stock = p.stockage();

  // 7. lecteur : lecture seule ; agent : redirigé
  p = await page('objectifs.html', LECTEUR, stock);
  check('lecteur : pas de « Nouvel objectif », export présent', !p.$('btnNouveau') && !!p.$('btnExport') && p.erreurs.length === 0, p.erreurs);
  p.d.querySelector('[data-ouvrir]').click();
  check('lecteur : fiche en lecture seule, sans boutons', p.$('oIntitule').disabled && !p.d.querySelector('.form-actions') && !p.$('btnAjoutAction'));
  p = await page('objectifs.html', AG, stock);
  check('agent : redirigé', p.navigation());

  // 8. Revue de direction : les objectifs de la période dans « Politique et objectifs »
  p = await page('revue-direction.html', RH, stock);
  p.$('btnNouvelle').click();
  const rv = p.lire('vigie_hse_revues_direction')[0];
  check('revue : les objectifs qui croisent la période, lus au jour du calcul', Array.isArray(rv.chiffres.objectifs) && rv.chiffres.objectifs.length === 3 && rv.chiffres.objectifs.some(x => x.indicateurId === 'tf' && x.etat === 'tenu'), rv.chiffres.objectifs);
  const sec = [...p.$('revue').querySelectorAll('.sec')].find(s => /Politique et objectifs/.test(s.textContent));
  check('revue : liste affichée, échappée, avec cible et état', sec && /Objectifs santé-sécurité de la période/.test(sec.textContent) && /&lt;b&gt;accidents/.test(sec.innerHTML) && /cible au plus 5/.test(sec.textContent) && /Tenu à ce jour/.test(sec.textContent) && /12 agents/.test(sec.textContent), sec && sec.textContent);
  // une revue d'avant (sans objectifs dans sa photo) : affichage inchangé
  const rvs = p.lire('vigie_hse_revues_direction'); delete rvs[0].chiffres.objectifs; rvs[0].statut = 'Validée'; p.w.localStorage.setItem('vigie_hse_revues_direction', JSON.stringify(rvs));
  p = await page('revue-direction.html', RH, p.stockage());
  p.d.querySelector('[data-ouvrir]').click();
  const sec2 = [...p.$('revue').querySelectorAll('.sec')].find(s => /Politique et objectifs/.test(s.textContent));
  check('revue antérieure : ni liste ni intertitre ajoutés', sec2 && !/Objectifs santé-sécurité de la période|Aucun objectif|Remontée des presque-accidents/.test(sec2.textContent) && /objectif annuel de remontée/.test(sec2.textContent));
  check('revue : aides dites avec les mots du secteur (rien ne change en collectivité)', /attentes des agents/.test(p.$('revue').textContent) && /orientations de la collectivité\./.test(p.$('revue').textContent));

  // 9. lecture d'un objectif : cas limites
  const VO = W.VigieObjectifs, S = W.VigieStore;
  const base = { indicateur:'paTaux', sens:'min', cible:80, periodeDebut: ilYa(100), periodeFin: ilYa(10) };
  check('échéance passée, taux : « Atteint » ou « Non atteint », valeur bornée à l\'échéance', (() => { const e = VO.evaluer(base, S); return (e.etat === 'non-atteint' || e.etat === 'sans-donnee') && e.borne === ilYa(10); })(), VO.evaluer(base, S));
  check('à venir', VO.evaluer({ indicateur:'tf', cible:1, periodeDebut: ilYa(-5), periodeFin: ilYa(-50) }, S).etat === 'a-venir');
  check('TF réel sans heures saisies : « Pas de donnée »', VO.evaluer({ indicateur:'tfReel', cible:1, periodeDebut: ilYa(100), periodeFin: ilYa(-10) }, S).etat === 'sans-donnee');
  check('cumul « au moins » franchi : « Atteint » avant l\'échéance', VO.evaluer({ indicateur:'atJours', sens:'min', cible:10, periodeDebut: ilYa(100), periodeFin: ilYa(-10) }, S).etat === 'atteint');
  check('manuel sans cible, échéance passée : « À constater »', VO.evaluer({ indicateur:'manuel', valeurManuelle:3, periodeDebut: ilYa(100), periodeFin: ilYa(10) }, S).etat === 'a-constater');
  check('indicateur inconnu', VO.evaluer({ indicateur:'zz', cible:1 }, S).etat === 'sans-donnee');
  check('formats : %, j, décimales, écart signé', VO.formater(85, { indicateur:'paTaux' }) === '85 %' && VO.formater(6, { indicateur:'atJours' }) === '6 j' && VO.formater(1.256, { indicateur:'tg' }) === '1,26' && VO.formaterEcart(-1.25, { indicateur:'tg' }) === '−1,25' && VO.formaterEcart(2, { indicateur:'atAvec' }) === '+2' && VO.formater(null, {}) === '—');
  check('nombres : virgule, espaces, refus', VO.nombre('1,5') === 1.5 && VO.nombre(' 12 ') === 12 && VO.nombre('1.2.3') === null && VO.nombre('') === null && VO.nombre(0) === 0);
  check('pourPeriode : seuls les objectifs qui croisent la période', VO.pourPeriode([{ id:'x', indicateur:'tf', cible:1, periodeDebut:'2020-01-01', periodeFin:'2020-12-31' }, { id:'y', indicateur:'tf', cible:1, periodeDebut:'2026-01-01', periodeFin:'2026-12-31' }], S, '2026-03-01', '2026-06-30', '2026-06-30').map(x => x.id).join() === 'y');
  const I2 = W.VigieIndicateurs.calculer(S, ilYa(200), auj);
  check('TG estimé : même formule que le Registre AT/MP', I2.tg === W.VigieFormules.tauxGravite(I2.atJours, I2.dureeAtJours) && I2.tg > 0);

  // 10. droits, serveur
  const VigieDroits = require(ROOT + 'assets/droits.js');
  const prof = VigieDroits.fusionnerProfils([]);
  check('préréglages (question 24) : admin, RH et préventeur gèrent, manager consulte, agent et représentant rien', ['p-admin', 'p-rh', 'p-preventeur'].every(id => prof.find(x => x.id === id).droits.objectifs === 'gerer') && prof.find(x => x.id === 'p-manager').droits.objectifs === 'consulter' && ['p-agent', 'p-representant'].every(id => prof.find(x => x.id === id).droits.objectifs === 'aucun'));
  const Lecture = require(ROOT + 'serveur/lecture.js'), Droits = require(ROOT + 'serveur/droits.js');
  const sess = droits => ({ user:'u', services:['*'], droits });
  const val = JSON.stringify([{ id:'o1', intitule:'X', indicateur:'tf', cible:5, justification:'secret', actions:[{ id:'a', description:'x' }] }]);
  check('serveur : sans le module, seules les actions', JSON.stringify(Object.keys(JSON.parse(Lecture.vue(sess({ actions:'consulter' }), 'vigie_hse_objectifs', val))[0]).sort()) === JSON.stringify(['actions', 'id', 'intitule']));
  check('serveur : « consulter » des Objectifs ou de la Revue reçoit tout', Lecture.vue(sess({ objectifs:'consulter' }), 'vigie_hse_objectifs', val) === val && Lecture.vue(sess({ 'revue-direction':'consulter' }), 'vigie_hse_objectifs', val) === val);
  check('serveur : écriture réservée à « gérer »', Droits.niveau(sess({ objectifs:'gerer' }), 'vigie_hse_objectifs') === 'complet' && Droits.niveau(sess({ objectifs:'consulter' }), 'vigie_hse_objectifs') === 'aucun' && Droits.cles.includes('vigie_hse_objectifs'));

  const ok = results.filter(r => r.ok).length;
  results.forEach(r => console.log((r.ok ? 'OK  ' : 'KO  ') + r.label + (r.ok || r.info === undefined ? '' : '  → ' + JSON.stringify(r.info).slice(0, 400))));
  console.log(`\n${ok} OK, ${results.length - ok} KO`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
