// Plans d'urgence — réponse du préventeur à la question 19 (2026-10-11) : fréquence de revue propre à chaque plan,
// rubriques obligatoires signalées, lecture des plans par tout compte (module « plans-urgence »).
//   RACINE=<dossier> node test-plans-q19.js
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
const MANAGER = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['*'], modulePermissions:{} };
const SANS = { user:'X', role:'ag', email:'X', services:['*'], profils:['Perso'], droits:{ atmp:'consulter' }, compte:{ libelle:'Perso', pastille:'P' } };

async function page(session, stock){
  const html = fs.readFileSync(ROOT + 'urgences-exercices.html', 'utf8');
  const vc = new VirtualConsole(); const erreurs = []; let navigation = false;
  vc.on('jsdomError', e => { const m = String(e && e.message || e); if (/navigation/.test(m)) navigation = true; if (!/Not implemented|Could not load/.test(m)) erreurs.push(m.split('\n')[0].slice(0, 160)); });
  const dom = new JSDOM(html, { runScripts:'outside-only', pretendToBeVisual:true, virtualConsole:vc, url:'https://layinolias.github.io/Vigie-hse/urgences-exercices.html' });
  const w = dom.window;
  for (const [k, v] of Object.entries(stock || {})) w.localStorage.setItem(k, v);
  w.sessionStorage.setItem('vigie_hse_session', JSON.stringify(session));
  w.fetch = () => Promise.reject(new TypeError('hors réseau'));
  const ecrits = [];
  w.XLSX = Object.assign({}, XLSX, { writeFile: (wb, nom) => ecrits.push({ wb, nom }), writeFileXLSX: () => {} });
  w.alert = () => {}; w.confirm = () => true; w.print = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {}; w.setInterval = () => 0;
  for (const m of html.matchAll(/<script src="(assets\/(?!xlsx\.)[^"]+)"><\/script>/g)) w.eval(fs.readFileSync(ROOT + m[1], 'utf8'));
  for (const s of [...w.document.querySelectorAll('script')].filter(s => !s.src)){ try { w.eval(s.textContent); } catch(e){ erreurs.push('sync : ' + e.message); } }
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  await sleep(30);
  const d = w.document, $ = id => d.getElementById(id);
  const ev = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles:true, cancelable:true }));
  const plans = () => JSON.parse(w.localStorage.getItem('vigie_hse_plans_urgence') || '[]');
  const stockage = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };
  return { w, d, $, ev, erreurs, ecrits, plans, stockage, navigation: () => navigation };
}
const visible = (el) => !!el && el.style.display !== 'none';
const carte = (p, site) => [...p.d.querySelectorAll('.plan-card')].find(c => c.querySelector('h4').textContent === site);

(async () => {
  const fen = {}; new Function('window', fs.readFileSync(ROOT + 'assets/dates-locales.js', 'utf8'))(fen); const VD = fen.VigieDates;
  const ilYa = (mois, jours) => { const t = new Date(); t.setMonth(t.getMonth() - mois); t.setDate(t.getDate() + (jours || 0)); return VD.iso(t); };

  // 1. RH : création d'un plan partiel → enregistré, signalé incomplet, fréquence enregistrée
  let p = await page(RH);
  check('RH : pas d\'erreur au chargement', p.erreurs.length === 0, p.erreurs);
  check('RH : onglets visibles', visible(p.$('ongletsUrgence')));
  p.$('btnNewPlan').click();
  check('formulaire : note des rubriques exigées (toutes, par défaut)', /Rubriques exigées : numéros d'urgence, donner l'alerte, consignes, points de rassemblement, personnes désignées, moyens de secours, date de dernière revue, fréquence de revue/.test(p.$('pRubriquesNote').textContent), p.$('pRubriquesNote').textContent);
  p.$('pSite').value = 'Gymnase Nord';
  p.$('pConsignes').value = 'Évacuer par la sortie est.';
  p.$('pPeriodiciteRevue').value = '12';
  p.ev(p.$('planForm'), 'submit');
  let pl = p.plans().find(x => x.site === 'Gymnase Nord');
  check('plan partiel enregistré', !!pl);
  check('… fréquence de revue enregistrée (nombre)', pl && pl.periodiciteRevueMois === 12, pl && pl.periodiciteRevueMois);
  let c = carte(p, 'Gymnase Nord');
  check('carte : « Incomplet »', c && /Incomplet/.test(c.querySelector('.plan-etat').textContent));
  const manque = c && c.querySelector('.plan-manque') ? c.querySelector('.plan-manque').textContent : '';
  check('carte : rubriques manquantes listées (5 + date)', /Donner l'alerte/.test(manque) && /Points de rassemblement/.test(manque) && /Personnes désignées/.test(manque) && /Moyens de secours/.test(manque) && /Date de dernière revue/.test(manque) && !/Consignes/.test(manque) && !/Numéros d'urgence/.test(manque) && !/Fréquence/.test(manque), manque);
  check('carte : « Date de revue manquante »', c && /Date de revue manquante/.test(c.textContent));
  check('carte : « à revoir tous les 12 mois »', c && /à revoir tous les 12 mois/.test(c.querySelector('.plan-meta').textContent));

  // 2. plans complets, en retard / bientôt / à jour
  const base = (id, site, dateRevue, mois) => ({ id, site, collectivite:'Ville', service:'Patrimoine Bâti', dateRevue, periodiciteRevueMois: mois,
    consignes:'Évacuer', alerte:'Appeler le 18', contacts:[{ id:'c', libelle:'Pompiers', numero:'18' }], rassemblement:[{ id:'r', libelle:'Parking', emplacement:'' }],
    designes:[{ id:'d', role:'Serre-file', personne:'Jean Martin', telephone:'' }], moyens:[{ id:'m', type:'Extincteur', emplacement:'Hall', quantite:2 }], auteur:'RH1', dateCreation:'2026-01-01' });
  const stock = { vigie_hse_plans_urgence: JSON.stringify([
    base('plu-a', 'Mairie', ilYa(13), 12),          // en retard
    base('plu-b', 'Médiathèque', ilYa(12, 30), 12), // dans 30 jours
    base('plu-c', 'Crèche', ilYa(1), 12),            // à jour
    Object.assign(base('plu-d', 'Piscine', ilYa(1), 12), { periodiciteRevueMois: '' }),   // fréquence manquante
    Object.assign(base('plu-e', 'Ateliers', ilYa(1), 6), { moyens: [{ id:'m2', type:'', emplacement:'Hall' }] }),   // moyen sans type
  ]) };
  p = await page(RH, stock);
  const etat = site => carte(p, site).querySelector('.plan-etat').textContent;
  check('Mairie : Complet + « À revoir »', /Complet/.test(etat('Mairie')) && /À revoir(?! bientôt)/.test(etat('Mairie')), etat('Mairie'));
  check('Mairie : prochaine revue affichée', /prochaine revue avant le \d{2}\/\d{2}\/\d{4}/.test(etat('Mairie')), etat('Mairie'));
  check('Médiathèque : « À revoir bientôt »', /À revoir bientôt/.test(etat('Médiathèque')), etat('Médiathèque'));
  check('Crèche : « À jour »', /À jour/.test(etat('Crèche')) && /Complet/.test(etat('Crèche')), etat('Crèche'));
  check('Piscine : incomplet, « Fréquence de revue manquante »', /Incomplet/.test(etat('Piscine')) && /Fréquence de revue manquante/.test(etat('Piscine')), etat('Piscine'));
  check('Ateliers : moyen sans type = rubrique manquante', /Moyens de secours/.test(carte(p, 'Ateliers').querySelector('.plan-manque').textContent));
  check('synthèse : 5 plans · 2 incomplets · 2 à revoir', /5 plans · 2 incomplets · 2 à revoir/.test(p.$('planSynthese').textContent), p.$('planSynthese').textContent);
  p.$('pEtat').value = 'incomplet'; p.ev(p.$('pEtat'), 'change');
  check('filtre « Incomplets » : Piscine, Ateliers', [...p.d.querySelectorAll('.plan-card h4')].map(h => h.textContent).sort().join(',') === 'Ateliers,Piscine');
  p.$('pEtat').value = 'arevoir'; p.ev(p.$('pEtat'), 'change');
  check('filtre « À revoir » : Mairie, Médiathèque', [...p.d.querySelectorAll('.plan-card h4')].map(h => h.textContent).sort().join(',') === 'Mairie,Médiathèque');
  p.$('pReset').click();
  check('réinitialiser : état remis à « Tous »', p.$('pEtat').value === 'all' && p.d.querySelectorAll('.plan-card').length === 5);

  // 3. modifier : la fréquence revient dans le formulaire, est conservée
  p.d.querySelector('[data-modifier-plan="plu-a"]').click();
  check('modifier : fréquence pré-remplie', p.$('pPeriodiciteRevue').value === '12');
  p.$('pPeriodiciteRevue').value = '24'; p.ev(p.$('planForm'), 'submit');
  check('modifier : fréquence 24 enregistrée', p.plans().find(x => x.id === 'plu-a').periodiciteRevueMois === 24);
  check('Mairie à 24 mois : plus à revoir', /À jour/.test(etat('Mairie')), etat('Mairie'));

  // 4. export : colonnes nouvelles
  p.$('btnExportPlans').click();
  const ws = p.ecrits.length && p.ecrits[0].wb.Sheets['Plans'];
  const lignes = ws ? XLSX.utils.sheet_to_json(ws, { defval:'' }) : [];
  const piscine = lignes.find(l => l.Site === 'Piscine') || {};
  const mairie = lignes.find(l => l.Site === 'Mairie') || {};
  check('export : colonnes de revue', ws && ['Revue tous les (mois)', 'Prochaine revue', 'État de la revue', 'Rubriques manquantes'].every(k => k in piscine), Object.keys(piscine));
  check('export : Mairie 24 mois, À jour, rien ne manque', mairie['Revue tous les (mois)'] === 24 && mairie['État de la revue'] === 'À jour' && mairie['Rubriques manquantes'] === '', mairie);
  check('export : Piscine « Fréquence de revue »', piscine['Rubriques manquantes'] === 'Fréquence de revue' && piscine['État de la revue'] === 'Fréquence de revue manquante', piscine);

  // 5. import : sans la colonne, la fréquence reste ; avec, elle est lue
  const importer = async (lignesFichier) => {
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lignesFichier), 'Plans');
    const buf = XLSX.write(wb, { type:'array', bookType:'xlsx' });
    const input = p.$('importPlansFile');
    const file = { name:'plans.xlsx', arrayBuffer: async () => buf };   // le File de jsdom n'a pas arrayBuffer()
    Object.defineProperty(input, 'files', { value:[file], configurable:true });
    p.ev(input, 'change'); await sleep(300);
  };
  await importer([{ ID:'plu-c', Site:'Crèche', Collectivité:'Ville', Service:'Patrimoine Bâti', 'Dernière revue': ilYa(1), Consignes:'Évacuer', "Donner l'alerte":'Appeler le 18' }]);
  check('import sans colonne de fréquence : 12 mois conservés', p.plans().find(x => x.id === 'plu-c').periodiciteRevueMois === 12, p.plans().find(x => x.id === 'plu-c'));
  await importer([{ ID:'plu-c', Site:'Crèche', Collectivité:'Ville', Service:'Patrimoine Bâti', 'Dernière revue': ilYa(1), 'Revue tous les (mois)': 36, Consignes:'Évacuer', "Donner l'alerte":'Appeler le 18' }]);
  check('import avec colonne : 36 mois lus', p.plans().find(x => x.id === 'plu-c').periodiciteRevueMois === 36, p.plans().find(x => x.id === 'plu-c').periodiciteRevueMois);

  // 6. impression : prochaine revue dans l'en-tête
  p.d.querySelector('[data-imprimer-plan="plu-b"]').click();
  const imp = p.$('plan-impression');
  check('impression : prochaine revue', imp && /prochaine revue avant le/.test(imp.querySelector('.pi-meta').textContent));

  // 7. agent : plans en lecture seule, sans les exercices
  const stockAg = p.stockage();
  for (const [nom, s] of [['agent', AG], ['manager', MANAGER]]){
    const q = await page(s, stockAg);
    check(nom + ' : page ouverte (pas de redirection)', !q.navigation(), q.erreurs);
    check(nom + ' : pas d\'erreur', q.erreurs.length === 0, q.erreurs);
    check(nom + ' : onglets et compteurs des exercices masqués', !visible(q.$('ongletsUrgence')) && !visible(q.$('kpisExercices')));
    check(nom + ' : onglet des plans affiché', q.$('tab-plans').classList.contains('show') && !q.$('tab-exercices').classList.contains('show'));
    check(nom + ' : titre « Plans d\'urgence par site »', q.$('pageTitre').textContent === "Plans d'urgence par site");
    check(nom + ' : 5 plans visibles', q.d.querySelectorAll('.plan-card').length === 5, q.d.querySelectorAll('.plan-card').length);
    check(nom + ' : ni modifier, ni supprimer, ni nouveau, ni importer', !q.d.querySelector('[data-modifier-plan]') && !q.d.querySelector('[data-supprimer-plan]') && !q.$('btnNewPlan') && !q.$('btnImportPlans'));
    check(nom + ' : « Imprimer la consigne » disponible', q.d.querySelectorAll('[data-imprimer-plan]').length === 5);
    check(nom + ' : pas de ligne « Exercices » sous les plans', ![...q.d.querySelectorAll('.plan-liens')].some(l => /Exercices :/.test(l.textContent)));
    check(nom + ' : pas de bandeau des sites sans plan', q.$('sansPlan').textContent.trim() === '');
    check(nom + ' : état des plans visible', /Incomplet|Complet/.test(q.$('planList').textContent));
  }
  // 8. compte sans aucun des deux modules : renvoyé au tableau de bord
  const r = await page(SANS, stockAg);
  check('profil sans plans ni urgences : redirigé', r.navigation());

  // 9. droits : catalogue, menu, serveur
  const VigieDroits = require(ROOT + 'assets/droits.js');
  const mod = VigieDroits.MODULES.find(m => m.id === 'plans-urgence');
  check('catalogue : module plans-urgence (consulter)', mod && mod.niveaux.join(',') === 'aucun,consulter');
  const prof = VigieDroits.fusionnerProfils([]);
  const niv = id => prof.find(x => x.id === id).droits['plans-urgence'];
  check('préréglages : agent, manager, représentant, admin, RH → consulter', ['p-agent', 'p-manager', 'p-representant', 'p-admin', 'p-rh'].every(id => niv(id) === 'consulter'), prof.map(x => x.id + ':' + x.droits['plans-urgence']));
  // un préréglage déjà enregistré (avant ce module) prend la graine
  const anciens = [{ id:'p-agent', nom:'Agent', droits: Object.assign({}, prof.find(x => x.id === 'p-agent').droits) }];
  delete anciens[0].droits['plans-urgence']; anciens[0].droits.urgences = 'aucun';
  check('préréglage agent enregistré avant le module : consulter', VigieDroits.fusionnerProfils(anciens).find(x => x.id === 'p-agent').droits['plans-urgence'] === 'consulter');
  const Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = droits => ({ user:'u', services:['*'], droits });
  check('serveur : agent (plans-urgence) reçoit les plans', Lecture.regle(sess({ 'plans-urgence':'consulter' }), 'vigie_hse_plans_urgence') === null);
  check('serveur : préventeur (urgences) reçoit les plans', Lecture.regle(sess({ urgences:'gerer' }), 'vigie_hse_plans_urgence') === null);
  check('serveur : profil sans les deux → retiré', Lecture.regle(sess({ atmp:'consulter' }), 'vigie_hse_plans_urgence') === Lecture.RETIRE);
  check('serveur : autre registre de page unique inchangé (EPI stock)', Lecture.regle(sess({ 'plans-urgence':'consulter' }), 'vigie_hse_epi_stock') === Lecture.RETIRE && Lecture.regle(sess({ epi:'consulter' }), 'vigie_hse_epi_stock') === null);
  const Droits = require(ROOT + 'serveur/droits.js');
  check('serveur : un agent ne peut pas écrire les plans', Droits.niveau(sess({ 'plans-urgence':'consulter' }), 'vigie_hse_plans_urgence') === 'aucun');

  const ok = results.filter(r => r.ok).length;
  results.forEach(r => console.log((r.ok ? 'OK  ' : 'KO  ') + r.label + (r.ok || r.info === undefined ? '' : '  → ' + JSON.stringify(r.info).slice(0, 300))));
  console.log(`\n${ok} OK, ${results.length - ok} KO`);
})().catch(e => { console.error(e); process.exit(1); });
