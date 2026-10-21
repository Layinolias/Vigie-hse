// Question 24 (réponse du 2026-10-14) : objectifs par service, lus par l'encadrement, fixés par le HSE ; relevés pour
// les comptes qui reçoivent des données filtrées du serveur.   RACINE=<dossier> node test-q24.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const MAN_VOIRIE = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const MAN_TOUS = { user:'m3', role:'manager', email:'m3', services:['*'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';

// le serveur, tel que serveur.js prépare une page : filtres de lecture, puis périmètre ; clés partielles
const Lecture = require(ROOT + 'serveur/lecture.js'), Perimetre = require(ROOT + 'serveur/perimetre.js');
function servi(S, stock, defaut){
  const tout = {};
  for (const k of Object.keys(stock)) if (k.startsWith('vigie_hse_')) tout[k] = { valeur: stock[k], revision: 1 };
  let d = Lecture.filtrer(S, tout);
  if (Perimetre.limite(S)) d = Perimetre.filtrer(d, S.services);
  const donnees = {};
  for (const [k, x] of Object.entries(d)) donnees[k] = { v: x.valeur, r: x.revision };
  return { api: '/api/', donnees, session: S, droits: { defaut: defaut || 'aucun' }, partielles: Lecture.partielles(tout, d) };
}
// XMLHttpRequest simulé : chaque appel noté, réponse 200 avec une révision
function avantServeur(etat, appels){
  return (w) => {
    w.__VIGIE_SERVEUR__ = etat;
    w.XMLHttpRequest = class { open(m, u){ this.m = m; this.u = u; } setRequestHeader(){} send(c){ appels.push({ m: this.m, u: this.u, c }); this.status = 200; this.responseText = JSON.stringify({ ok: true, revision: 2 }); } };
  };
}

(async () => {
  // ---- 1. Référentiel ----
  global.window = global;
  for (const f of ['dates-locales.js', 'hse-formulas.js', 'signalements-ref.js', 'indicateurs.js', 'objectifs-ref.js']) eval(require('fs').readFileSync(ROOT + 'assets/' + f, 'utf8'));
  const VO = global.VigieObjectifs, VD = global.VigieDates;
  const auj = VD.aujourdhui(), an = auj.slice(0, 4);
  check('par service : pas les taux estimés (effectif de l\'organisation), le reste oui', !VO.parService('tf') && !VO.parService('tg') && ['tfReel', 'atAvec', 'atJours', 'presqueAccidents', 'paTaux', 'svLateTous', 'epiLateTous', 'manuel'].every(VO.parService));
  check('chaque indicateur dit ses sources (registres lus)', VO.INDICATEURS.every(i => Array.isArray(i.sources)) && VO.indicateur('presqueAccidents').sources.includes('vigie_hse_signalements'));
  const at = (id, service, arret, jours, extra) => Object.assign({ id, dateAT: auj, typeAtMp: 'Accident de travail', arret, joursArret: jours || 0, service, collectivite: 'Ville' }, extra || {});
  const DATASET = [at('a1', V, true, 5), at('a2', V, true, 3), at('a3', P, true, 10), at('a4', V, false), at('a5', P, false, 0, { typeAtMp: 'Presque accident' })];
  const SIG = [{ id: 's1', date: auj, service: V, auteur: 'AG1' }, { id: 's2', date: auj, service: P, auteur: 'AG1' }, { id: 's3', date: auj, service: P, auteur: 'AG2' }];
  const HEURES = [{ id: 'h1', periode: auj.slice(0, 7), heures: 100000, service: V, collectivite: 'Ville' }, { id: 'h2', periode: auj.slice(0, 7), heures: 400000, service: P, collectivite: 'Ville' }];
  const store = { getItem: k => ({ vigie_hse_dataset: JSON.stringify(DATASET), vigie_hse_signalements: JSON.stringify(SIG), vigie_hse_heures_travaillees: JSON.stringify(HEURES), vigie_hse_epi_catalogue: '[{"id":"c1"}]' })[k] || null };
  const sv = VO.donneesDuService(store, V);
  check('données d\'un service : ses seuls enregistrements ; le catalogue passe', JSON.parse(sv.getItem('vigie_hse_dataset')).length === 3 && JSON.parse(sv.getItem('vigie_hse_epi_catalogue')).length === 1 && sv.getItem('inconnue') === null);
  const obj = (x) => Object.assign({ id: 'o', intitule: 'x', indicateur: 'atAvec', sens: 'max', cible: 10, periodeDebut: an + '-01-01', periodeFin: an + '-12-31', statut: 'En vigueur' }, x);
  check('accidents avec arrêt : 3 pour l\'organisation, 2 pour la Voirie, 1 pour le Patrimoine', VO.evaluer(obj({}), store).valeur === 3 && VO.evaluer(obj({ service: V }), store).valeur === 2 && VO.evaluer(obj({ service: P }), store).valeur === 1);
  check('presque-accidents (Bird, sans doublon) : 4 en tout, 1 Voirie, 3 Patrimoine', VO.evaluer(obj({ indicateur: 'presqueAccidents', sens: 'min' }), store).valeur === 4 && VO.evaluer(obj({ indicateur: 'presqueAccidents', service: V }), store).valeur === 1 && VO.evaluer(obj({ indicateur: 'presqueAccidents', service: P }), store).valeur === 3);
  const tfV = VO.evaluer(obj({ indicateur: 'tfReel', service: V }), store).valeur, tfP = VO.evaluer(obj({ indicateur: 'tfReel', service: P }), store).valeur;
  check('TF réel par service : ses accidents sur ses heures (2 / 100 000 h → 20 ; 1 / 400 000 h → 2,5)', tfV === 20 && tfP === 2.5, [tfV, tfP]);
  const tfS = VO.evaluer(obj({ indicateur: 'tf', service: V }), store);
  check('TF estimé d\'un service : « Pas par service », sans valeur', tfS.etat === 'sans-donnee' && tfS.libelle === 'Pas par service' && tfS.valeur === null);
  // calculable, relevé, lecture
  const partiel = Object.assign({}, store, { complet: k => k !== 'vigie_hse_dataset' });
  check('calculable : oui sans « complet », non si une source est partielle ; une mesure manuelle toujours', VO.calculable(obj({}), store) && !VO.calculable(obj({}), partiel) && VO.calculable(obj({ indicateur: 'manuel' }), partiel));
  const rel = VO.releve(obj({}), store, auj);
  check('relevé : date, valeur, état', rel && rel.le === auj && rel.valeur === 3 && rel.etat === 'en-cours' && rel.libelle === 'En cours');
  check('relevé : rien pour un objectif clos ou non calculable', VO.releve(obj({ statut: 'Clos' }), store) === null && VO.releve(obj({}), partiel) === null);
  check('mêmes relevés comparés champ à champ', VO.memeReleve(rel, Object.assign({}, rel)) && !VO.memeReleve(rel, Object.assign({}, rel, { le: '2000-01-01' })) && !VO.memeReleve(rel, undefined));
  const lu = VO.lire(obj({ releve: Object.assign({}, rel, { valeur: 7, le: '2026-01-05' }) }), partiel);
  check('lire, données partielles : le relevé et sa date', lu.valeur === 7 && lu.releveLe === '2026-01-05' && lu.cible === 10);
  check('lire, données partielles, sans relevé : « Pas encore relevé »', VO.lire(obj({}), partiel).etat === 'non-releve');
  check('lire, données complètes : le calcul (le relevé ignoré)', VO.lire(obj({ releve: Object.assign({}, rel, { valeur: 7 }) }), store).valeur === 3);
  const pp = VO.pourPeriode([obj({ id: 'g' }), obj({ id: 'v', service: V })], store, an + '-01-01', an + '-12-31');
  check('pourPeriode : le service de chaque objectif', pp.length === 2 && pp[0].service === '' && pp[1].service === V && pp[1].valeur === 2);

  // ---- 2. Serveur : clés partielles ----
  const tout = { vigie_hse_dataset: { valeur: JSON.stringify(DATASET), revision: 3 }, vigie_hse_objectifs: { valeur: '[]', revision: 1 }, vigie_hse_users: { valeur: '[]', revision: 1 } };
  check('serveur, RH : rien de partiel… sauf les comptes (administrateur seul)', JSON.stringify(Lecture.partielles(tout, Lecture.filtrer(RH, tout))) === '["vigie_hse_users"]');
  const dm = Perimetre.filtrer(Lecture.filtrer(MAN_VOIRIE, tout), MAN_VOIRIE.services);
  check('serveur, manager de la Voirie : registre AT/MP partiel, objectifs complets', JSON.stringify(Lecture.partielles(tout, dm)) === '["vigie_hse_dataset","vigie_hse_users"]', Lecture.partielles(tout, dm));

  // ---- 3. Droits ----
  const VigieDroits = require(ROOT + 'assets/droits.js');
  const D = s => VigieDroits.pour(s);
  check('RH et préventeur gèrent, le manager consulte, l\'agent rien', D(RH).peut('objectifs', 'gerer') && D(PREV).peut('objectifs', 'gerer') && D(MAN_VOIRIE).niveau('objectifs') === 'consulter' && D(AG).niveau('objectifs') === 'aucun');
  const ancien = { id: 'u9', username: 'PREV9', role: 'ag', modulePermissions: { 'atmp-declare': 'write', 'atmp-admin': 'write', 'accident-analyse': 'write', 'urgences': 'write', 'sante-visites': 'read' } };
  let cv = VigieDroits.convertirComptes([ancien], []);
  check('ancien compte préventeur : converti en Agent + Préventeur, aucun profil créé', JSON.stringify(cv.users[0].profils) === '["p-agent","p-preventeur"]' && cv.crees === 0, cv.users[0].profils);
  cv = VigieDroits.convertirComptes([ancien], [{ id: 'p-preventeur', droits: { urgences: 'consulter', objectifs: 'aucun' } }]);
  check('… même si le profil Préventeur a été modifié dans Administration', JSON.stringify(cv.users[0].profils) === '["p-agent","p-preventeur"]' && cv.crees === 0, cv.users[0].profils);

  // ---- 4. Page, RH : objectifs de toute l'organisation et de services ----
  let stock = { vigie_hse_dataset: JSON.stringify(DATASET), vigie_hse_signalements: JSON.stringify(SIG) };
  let p = await H.page('objectifs.html', RH, stock);
  check('RH : page ouverte sans erreur, colonne « Périmètre »', p.erreurs.length === 0 && /Périmètre/.test(p.d.querySelector('#tableObjectifs thead').textContent), p.erreurs);
  const creer = async (intitule, service, indicateur, cible) => {
    p.$('btnNouveau').click();
    p.$('oIntitule').value = intitule; p.choisir('oService', service); p.choisir('oIndicateur', indicateur); p.$('oCible').value = String(cible);
    p.ev(p.$('ficheForm'), 'submit'); await H.sleep(10);
  };
  p.$('btnNouveau').click();
  const optsSvc = [...p.$('oService').options].map(o => o.value);
  check('périmètre : « Toute l\'organisation » puis les services', p.$('oService').options[0].textContent === "Toute l'organisation" && optsSvc.includes(V) && optsSvc.includes(P));
  p.choisir('oIndicateur', 'tf'); p.choisir('oService', V);
  const optTf = p.$('oIndicateur').querySelector('option[value="tf"]'), optTg = p.$('oIndicateur').querySelector('option[value="tg"]');
  check('service choisi : TF estimé gardé (choisi) mais signalé, TG estimé non proposé', p.$('oIndicateur').value === 'tf' && !optTf.disabled && /toute l'organisation seulement/.test(optTf.textContent) && optTg.disabled);
  p.$('oIntitule').value = 'TF de la voirie'; p.$('oCible').value = '20';
  p.ev(p.$('ficheForm'), 'submit');
  check('TF estimé pour un service : refusé, avec la raison', p.alertes.some(a => /ne se calcule que pour toute l'organisation/.test(a)) && !(p.lire('vigie_hse_objectifs') || []).length, p.alertes);
  p.$('btnFermer').click();
  await creer('Moins de 10 accidents avec arrêt', '', 'atAvec', 10);
  await creer('Voirie : au plus 1 accident avec arrêt', V, 'atAvec', 1);
  await creer('Patrimoine : au plus 2 accidents avec arrêt', P, 'atAvec', 2);
  let objs = p.lire('vigie_hse_objectifs') || [];
  const oG = objs.find(o => /Moins de 10/.test(o.intitule)), oV = objs.find(o => /Voirie : au plus/.test(o.intitule)), oP = objs.find(o => /Patrimoine : au plus/.test(o.intitule));
  check('trois objectifs ; service enregistré (aucun pour toute l\'organisation)', objs.length === 3 && oG && !('service' in oG) && oV.service === V && oP.service === P);
  check('relevé écrit à l\'enregistrement', oV.releve && oV.releve.le === auj && oV.releve.valeur === 2 && oV.releve.etat === 'non-atteint', oV.releve);
  const ligne = (re) => [...p.$('tbody').querySelectorAll('tr')].find(t => re.test(t.textContent));
  const cell = (tr, i) => tr.querySelectorAll('td')[i].textContent.trim();
  check('liste : périmètre et valeur par ligne (3 ; Voirie 2, non atteint ; Patrimoine 1)', cell(ligne(/Moins de 10/), 1) === "Toute l'organisation" && cell(ligne(/Moins de 10/), 4) === '3' && cell(ligne(/Voirie : au plus/), 1) === V && cell(ligne(/Voirie : au plus/), 4) === '2' && /Non atteint/.test(cell(ligne(/Voirie : au plus/), 6)) && cell(ligne(/Patrimoine : au plus/), 4) === '1');
  check('filtre de périmètre : tous, toute l\'organisation, les services des objectifs', [...p.$('fPerimetre').options].map(o => o.textContent).join('|') === `Tous les périmètres|Toute l'organisation|${P}|${V}`);
  p.choisir('fPerimetre', V);
  check('filtre « Voirie » : sa seule ligne', p.$('tbody').querySelectorAll('tr').length === 1 && !!ligne(/Voirie : au plus/));
  p.choisir('fPerimetre', '-');
  check('filtre « Toute l\'organisation » : sa seule ligne', p.$('tbody').querySelectorAll('tr').length === 1 && !!ligne(/Moins de 10/));
  p.choisir('fPerimetre', '');
  p.$('btnExport').click();
  const feuille = p.ecrits.length ? H.XLSX.utils.sheet_to_json(p.ecrits[0].wb.Sheets['Objectifs']) : [];
  check('export : colonne « Périmètre »', feuille.length === 3 && feuille.some(l => l['Périmètre'] === V) && feuille.some(l => l['Périmètre'] === "Toute l'organisation"));
  stock = p.stockage();
  // relevés à l'ouverture : rien de réécrit s'ils n'ont pas changé ; réécrits sinon
  objs = JSON.parse(stock.vigie_hse_objectifs); objs.forEach(o => { if (o.releve) o.releve.le = '2026-01-01'; }); stock.vigie_hse_objectifs = JSON.stringify(objs);
  p = await H.page('objectifs.html', RH, stock);
  check('ouverture par qui gère : relevés remis au jour', (p.lire('vigie_hse_objectifs') || []).every(o => o.releve && o.releve.le === auj));
  const avant = p.w.localStorage.getItem('vigie_hse_objectifs');
  p = await H.page('objectifs.html', RH, p.stockage());
  check('… et pas réécrits s\'ils n\'ont pas changé', p.w.localStorage.getItem('vigie_hse_objectifs') === avant);
  stock = p.stockage();

  // ---- 5. Encadrement (lecture), préventeur, agent ----
  p = await H.page('objectifs.html', MAN_VOIRIE, stock, '?ouvrir=' + oP.id);
  check('manager de la Voirie : sans erreur, sans « Nouvel objectif »', p.erreurs.length === 0 && !p.$('btnNouveau') && !!p.$('btnExport'), p.erreurs);
  check('… voit les objectifs de toute l\'organisation et de la Voirie, pas ceux du Patrimoine (ni par ?ouvrir)', !!ligne(/Moins de 10/) && !!ligne(/Voirie : au plus/) && !ligne(/Patrimoine : au plus/) && p.$('fiche').style.display === 'none');
  check('… valeurs calculées (données locales complètes), sans mention de relevé', cell(ligne(/Moins de 10/), 4) === '3' && !p.d.querySelector('.releve'));
  p.d.querySelector(`[data-ouvrir="${oV.id}"]`).click();
  check('… fiche en lecture seule', p.$('oIntitule').disabled && p.$('oService').disabled && !p.$('btnClore') && !p.d.querySelector('#ficheForm button[type=submit]'));
  p = await H.page('objectifs.html', PREV, stock);
  check('préventeur (Agent + Préventeur) : gère (« Nouvel objectif »)', p.erreurs.length === 0 && !!p.$('btnNouveau'));
  p = await H.page('objectifs.html', AG, stock);
  check('agent : renvoyé', p.navigation());

  // ---- 6. Sur le serveur : un compte qui reçoit des données filtrées lit le relevé ----
  let appels = [];
  p = await H.page('objectifs.html', MAN_VOIRIE, {}, '', avantServeur(servi(MAN_VOIRIE, stock), appels));
  check('serveur, manager de la Voirie : sans erreur ; le serveur ne lui envoie pas l\'objectif du Patrimoine', p.erreurs.length === 0 && !ligne(/Patrimoine : au plus/) && !!ligne(/Voirie : au plus/), p.erreurs);
  check('… valeurs relevées, avec leur date (3 ; Voirie 2)', cell(ligne(/Moins de 10/), 4).startsWith('3') && /relevée le/.test(cell(ligne(/Moins de 10/), 4)) && cell(ligne(/Voirie : au plus/), 4).startsWith('2'), cell(ligne(/Moins de 10/), 4));
  check('… aucun appel d\'écriture', appels.filter(a => a.m !== 'GET').length === 0, appels);
  p.d.querySelector(`[data-ouvrir="${oG.id}"]`).click();
  check('… fiche : « relevée le » dans la lecture', /relevée le \d{2}\/\d{2}\/\d{4}/.test(p.$('oLecture').textContent), p.$('oLecture').textContent);
  const sansReleve = JSON.parse(stock.vigie_hse_objectifs).map(o => { const c = Object.assign({}, o); delete c.releve; return c; });
  p = await H.page('objectifs.html', MAN_VOIRIE, {}, '', avantServeur(servi(MAN_VOIRIE, Object.assign({}, stock, { vigie_hse_objectifs: JSON.stringify(sansReleve) })), []));
  check('… sans relevé : « Pas encore relevé », pas de chiffre inventé', /Pas encore relevé/.test(ligne(/Moins de 10/).textContent) && cell(ligne(/Moins de 10/), 4) === '—');
  appels = [];
  const stockVieux = Object.assign({}, stock, { vigie_hse_objectifs: JSON.stringify(sansReleve) });
  p = await H.page('objectifs.html', RH, {}, '', avantServeur(servi(RH, stockVieux, 'complet'), appels));
  const put = appels.find(a => a.m === 'PUT' && /vigie_hse_objectifs/.test(a.u));
  check('serveur, RH (tout complet) : calcule, et envoie les relevés', p.erreurs.length === 0 && cell(ligne(/Moins de 10/), 4) === '3' && put && JSON.parse(put.c).every(o => o.releve && o.releve.le === auj), [p.erreurs, appels.map(a => a.m + ' ' + a.u)]);

  // ---- 7. Revue de direction : le périmètre d'un objectif de service ----
  p = await H.page('revue-direction.html', RH, stock);
  p.$('btnNouvelle').click();
  check('revue : l\'objectif de la Voirie nommé avec son service', p.erreurs.length === 0 && /Voirie : au plus 1 accident avec arrêt \(Voirie & Réseaux\)/.test(p.$('revue').textContent), p.erreurs);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
