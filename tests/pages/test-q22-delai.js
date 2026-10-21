// Question 22 (réponse du 2026-10-14) : délai de traitement d'un signalement — 8 jours, réglable.
//   RACINE=<dossier> node test-q22-delai.js
process.env.TZ = 'Pacific/Auckland';
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');
const XLSX = require('../../assets/xlsx.full.min.js');
const ROOT = (process.env.RACINE || require('path').resolve(__dirname, '../..')).replace(/\\/g, '/').replace(/\/?$/, '/');
const results = [];
const check = (label, cond, info) => results.push({ label, ok: !!cond, info });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const AG1 = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const MAN_VOIRIE = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const MAN_TOUS = { user:'m3', role:'manager', email:'m3', services:['*'], modulePermissions:{} };

async function page(fichier, session, stock, query){
  const html = fs.readFileSync(ROOT + fichier, 'utf8');
  const vc = new VirtualConsole(); const erreurs = []; let navigation = false;
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (/navigation/.test(m)) navigation = true; if (!/Not implemented|Could not load/.test(m)) erreurs.push(m.split('\n')[0].slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/' + fichier + (query || '') });
  const w = dom.window;
  for (const [k, v] of Object.entries(stock || {})) w.localStorage.setItem(k, v);
  w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(session));
  w.fetch = () => Promise.reject(new TypeError('hors réseau'));
  const ecrits = [], alertes = [];
  w.XLSX = Object.assign({}, XLSX, { writeFile: (wb, nom) => ecrits.push({ wb, nom }), writeFileXLSX: () => {} });
  w.alert = (m) => alertes.push(m); w.confirm = () => true; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  for (const m of html.matchAll(/<script src="(assets\/(?!xlsx\.)[^"]+)"><\/script>/g)) w.eval(fs.readFileSync(ROOT + m[1], 'utf8'));
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ erreurs.push('sync : ' + e.message); } }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await sleep(40);
  const d = w.document, $ = id => d.getElementById(id);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles:true, cancelable:true }));
  const lire = k => JSON.parse(w.localStorage.getItem(k) || 'null');
  const stockage = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
  return { w, d, $, ev, lire, stockage, erreurs, ecrits, alertes, navigation: () => navigation };
}
const visible = el => !!el && el.style.display !== 'none';

(async () => {
  // 1. Référentiel
  global.window = global;
  eval(fs.readFileSync(ROOT + 'assets/dates-locales.js', 'utf8'));
  eval(fs.readFileSync(ROOT + 'assets/signalements-ref.js', 'utf8'));
  const S = global.VigieSignalements, VD = global.VigieDates;
  check('délai par défaut : 8 jours', S.DELAI_TRAITEMENT === 8 && S.delaiTraitement({}) === 8 && S.delaiTraitement(null) === 8);
  check('délai réglé : 15 ; « 10 » lu comme 10', S.delaiTraitement({ delaiTraitement:15 }) === 15 && S.delaiTraitement({ delaiTraitement:'10' }) === 10);
  check('délai invalide → 8 (0, 2,5, 400, texte)', [0, 2.5, 400, 'abc', -3].every(v => S.delaiTraitement({ delaiTraitement:v }) === 8));
  // envoyé le 1er octobre à 00 h 30, heure locale (la veille en UTC) : échéance le 9
  const envoi = new Date(2026, 9, 1, 0, 30).toISOString();
  check('échéance : jour de l\'envoi (heure locale) + 8', S.echeanceTraitement({ dateCreation:envoi, date:'2026-09-20' }, 8) === '2026-10-09', S.echeanceTraitement({ dateCreation:envoi }, 8));
  check('échéance : à défaut d\'envoi, jour des faits', S.echeanceTraitement({ date:'2026-09-20' }, 8) === '2026-09-28');
  check('échéance : franchit un mois (31 + 8)', S.echeanceTraitement({ date:'2026-10-28' }, 8) === '2026-11-05');
  check('échéance : sans date lisible → null', S.echeanceTraitement({ date:'20/09/2026' }, 8) === null && S.echeanceTraitement({}, 8) === null);
  const nouveau = { dateCreation:envoi, traitement:{ suites:[], commentaire:'' } };
  check('en retard le lendemain de l\'échéance, pas le jour même', S.enRetard(nouveau, '2026-10-10', 8) && !S.enRetard(nouveau, '2026-10-09', 8));
  check('pas en retard : en cours (commentaire), clos', !S.enRetard({ dateCreation:envoi, traitement:{ suites:[], commentaire:'Vu' } }, '2026-12-01', 8) && !S.enRetard({ dateCreation:envoi, clos:true }, '2026-12-01', 8));

  // 2. Page, compte qui traite (tous services)
  const auj = VD.aujourdhui();
  const ilYa = j => { const d = new Date(); d.setDate(d.getDate() - j); return d; };
  const sig = (id, jours, service, extra) => Object.assign({ id, date: VD.iso(ilYa(jours + 1)), heure:'', collectivite:'Ville', service, lieu:'Lieu ' + id, faits:'Faits ' + id, risque:'Risque', mesure:'', auteur:'AG1',
    dateCreation: ilYa(jours).toISOString(), nbPhotos:0, traitement:{ suites:[], commentaire:'' }, actions:[], clos:false }, extra || {});
  const stock0 = { vigie_hse_signalements: JSON.stringify([
    sig('s1', 10, 'Voirie & Réseaux'),                                  // nouveau, envoyé il y a 10 jours : en retard
    sig('s2', 2, 'Voirie & Réseaux'),                                   // nouveau, il y a 2 jours
    sig('s3', 20, 'Patrimoine Bâti', { traitement:{ suites:[], commentaire:'Pris en charge' } }),   // en cours
    sig('s4', 30, 'Patrimoine Bâti', { clos:true, closLe:auj }),        // clos
    sig('s5', 9, 'Patrimoine Bâti')                                     // nouveau, il y a 9 jours : en retard
  ]) };
  let p = await page('signalements.html', MAN_TOUS, stock0);
  check('page ouverte sans erreur', !p.navigation() && p.erreurs.length === 0, p.erreurs);
  check('compteur : « Nouveaux · 2 en retard »', p.$('kpiNouveau').textContent === '3' && p.$('kpiNouveauLabel').textContent === 'Nouveaux · 2 en retard', p.$('kpiNouveauLabel').textContent);
  const chips = [...p.d.querySelectorAll('#tbody .chip.s-retard')];
  check('liste : 2 pastilles « En retard », avec la date limite au survol', chips.length === 2 && chips.every(c => c.textContent === 'En retard' && /^À traiter avant le \d{2}\/\d{2}\/\d{4}$/.test(c.title)), chips.map(c => c.title));
  p.$('fStatut').value = 'retard'; p.ev(p.$('fStatut'), 'change');
  check('filtre « En retard » : s1 et s5', p.$('resultCount').textContent === '2' && /Lieu s1/.test(p.$('tbody').textContent) && /Lieu s5/.test(p.$('tbody').textContent) && !/Lieu s2/.test(p.$('tbody').textContent));
  p.$('fStatut').value = 'Nouveau'; p.ev(p.$('fStatut'), 'change');
  check('filtre « Nouveau » : les 3, en retard ou non', p.$('resultCount').textContent === '3');
  p.$('fStatut').value = 'all'; p.ev(p.$('fStatut'), 'change');
  p.d.querySelector('[data-ouvrir="s2"]').click();
  const ech2 = S.echeanceTraitement(JSON.parse(stock0.vigie_hse_signalements)[1], 8);
  check('fiche d\'un nouveau : « à traiter avant le » sa date limite, pas de retard', p.$('fiche').querySelector('.fiche-meta').textContent.includes('à traiter avant le ' + ech2.split('-').reverse().join('/')) && !p.$('fiche').querySelector('.s-retard'), p.$('fiche').querySelector('.fiche-meta').textContent);
  p.d.querySelector('[data-ouvrir="s1"]').click();
  check('fiche en retard : la pastille', !!p.$('fiche').querySelector('.fiche-meta .s-retard'));
  p.d.querySelector('[data-ouvrir="s3"]').click();
  check('fiche en cours : ni date limite ni retard', !/à traiter avant/.test(p.$('fiche').textContent) && !p.$('fiche').querySelector('.s-retard'));
  // traiter s1 → il sort du retard
  p.d.querySelector('[data-ouvrir="s1"]').click();
  p.$('tCommentaire').value = 'Marche refixée.';
  p.ev(p.$('traitementForm'), 'submit');
  await sleep(20);
  check('traité (commentaire) : n\'est plus en retard', p.$('kpiNouveauLabel').textContent === 'Nouveaux · 1 en retard', p.$('kpiNouveauLabel').textContent);
  // export
  p.$('btnExport').click();
  const ws = p.ecrits.length && p.ecrits[0].wb.Sheets['Signalements'];
  const lignes = ws ? XLSX.utils.sheet_to_json(ws) : [];
  const l5 = lignes.find(l => l.ID === 's5'), l2 = lignes.find(l => l.ID === 's2');
  check('export : colonnes « À traiter avant » et « En retard »', l5 && l5['En retard'] === 'Oui' && /^\d{4}-\d{2}-\d{2}$/.test(l5['À traiter avant']) && l2 && !l2['En retard'] && l2['À traiter avant'] === ech2, [l5, l2]);

  // 3. Réglage du délai
  check('réglage : champ délai à 8', p.$('oDelai') && p.$('oDelai').value === '8');
  p.$('oDelai').value = '0'; p.$('btnObjectif').click();
  check('délai 0 refusé, rien d\'enregistré', p.alertes.some(a => /nombre entier de jours, de 1 à 365/.test(a)) && !p.lire('vigie_hse_signalements_parametres'));
  p.$('oDelai').value = '12'; p.$('btnObjectif').click();
  const par = p.lire('vigie_hse_signalements_parametres') || {};
  check('délai 12 enregistré, objectif absent', par.delaiTraitement === 12 && !('objectifAnnuel' in par), par);
  check('délai 12 : plus aucun retard (10 et 9 jours)', p.$('kpiNouveauLabel').textContent === 'Nouveaux' && !p.d.querySelector('#tbody .s-retard'), p.$('kpiNouveauLabel').textContent);
  const audit = (p.lire('vigie_hse_audit_log') || []).map(a => a.description || a.details || JSON.stringify(a));
  check('journal : le délai, pas l\'objectif', audit.some(a => /Délai de traitement des signalements : 12 jours/.test(a)) && !audit.some(a => /Objectif de remontée/.test(a)), audit);
  p.$('oObjectif').value = '40'; p.$('oDelai').value = '8'; p.$('btnObjectif').click();
  const par2 = p.lire('vigie_hse_signalements_parametres') || {};
  check('retour à 8 : le réglage disparaît (défaut), objectif 40 gardé', !('delaiTraitement' in par2) && par2.objectifAnnuel === 40, par2);
  const stock1 = p.stockage();

  // 4. Manager d'un service : le délai est affiché, pas réglable ; ses seuls services
  p = await page('signalements.html', MAN_VOIRIE, stock1);
  check('manager limité : « délai de traitement : 8 jours », sans champ', /délai de traitement : 8 jours/.test(p.$('objectif').textContent) && !p.$('oDelai'), p.$('objectif').textContent);
  check('manager limité : aucun retard dans ses services (s1 traité, s2 récent)', p.$('kpiNouveauLabel').textContent === 'Nouveaux');

  // 5. Agent : ses signalements, le retard visible
  p = await page('signalements.html', AG1, stock1);
  check('agent : pas de réglage, pastille de retard sur le sien (s5)', !p.$('oDelai') && p.d.querySelectorAll('#tbody .s-retard').length === 1 && p.$('kpiNouveauLabel').textContent === 'Nouveaux · 1 en retard', p.$('kpiNouveauLabel').textContent);

  // 6. Tableau de bord
  p = await page('dashboard.html', MAN_TOUS, stock1);
  check('tableau de bord (traite) : « 2 nouveaux à traiter, dont 1 en retard »', p.$('modSigCount').textContent === '2' && p.$('modSigLabel').textContent === 'nouveaux à traiter, dont 1 en retard' && p.erreurs.length === 0, [p.$('modSigLabel').textContent, p.erreurs]);
  p = await page('dashboard.html', MAN_VOIRIE, stock1);
  check('tableau de bord (Voirie) : « 1 nouveau à traiter », sans retard', p.$('modSigCount').textContent === '1' && p.$('modSigLabel').textContent === 'nouveau à traiter', p.$('modSigLabel').textContent);
  p = await page('dashboard.html', AG1, stock1);
  check('tableau de bord (agent) : ses signalements envoyés', p.$('modSigLabel').textContent === 'signalements envoyés' && p.erreurs.length === 0);

  let ok = 0, ko = 0;
  for (const r of results){ console.log((r.ok ? 'OK  ' : 'KO  ') + r.label + (r.ok ? '' : '  → ' + JSON.stringify(r.info))); r.ok ? ok++ : ko++; }
  console.log(`\n${ok} OK, ${ko} KO`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
