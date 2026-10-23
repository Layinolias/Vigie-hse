// Engagement de la direction (ISO 45001 § 5.1, 2026-10-21) : composant, page (création, contrôles, points, filtres,
// export, impression, suppression, lecture seule, périmètre, mots du secteur), droits, menu, serveur, Préparation ISO 45001.
//   RACINE=<dossier> node test-engagement-direction.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const REP = { user:'REP1', role:'ag', email:'REP1', services:['*'], profils:['p-representant'] };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_engagement_direction';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('engagement-direction.html', PREV, {});
  const E = p0.w.VigieEngagement, AJD = p0.w.VigieDates.aujourdhui(), AN = AJD.slice(0, 4);
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  check('13 points (a à m), libellés ; formes proposées', E.POINTS.length === 13 && E.LETTRES.join('') === 'abcdefghijklm' && /moyens/.test(E.libellePoint('d')) && /représailles/.test(E.libellePoint('k')) && /F3SCT/.test(E.libellePoint('m')) && E.FORMES.includes('Visite de terrain') && E.libellePoint('z') === 'z');
  const L = [{ id:'t1', date:'2025-03-01', qui:'Mme Durand, DGS', objet:'x', points:['a', 'd'] }, { id:'t2', date: AN + '-02-10', qui:'mme  durand, dgs', objet:'y', points:['d', 'zz'] },
    { id:'t3', date: AN + '-01-05', qui:'M. Bernard', objet:'z', points:[] }, { id:'t4', date:'pas une date', qui:'X', points:['a'] }, { qui:'sans id', date:'2025-01-01' }, null];
  const s = E.synthese(L, AN);
  check('synthèse : traces valides, de l\'année, personnes (sans casse ni espaces), points et plus récente, points inconnus ignorés', s.total === 3 && s.annee === 2 && s.personnes === 2 && s.parPoint.d.n === 2 && s.parPoint.d.derniere === AN + '-02-10' && s.parPoint.a.n === 1 && s.pointsAvecTrace === 2 && s.pointsSansTrace.length === 11 && s.derniere === AN + '-02-10', s);
  check('triées, la plus récente d\'abord ; pourPeriode, bornes comprises', E.triees(L).map(t => t.id).join('') === 't2t3t1' && E.pourPeriode(L, '2025-03-01', AN + '-01-05').map(t => t.id).join('') === 't1t3');

  // ---------- 2. Page vide, nouvelle trace ----------
  let p = await H.page('engagement-direction.html', PREV, {});
  check('vide : 13 points « Aucune trace », compteurs à 0, invitation', p.d.querySelectorAll('#tbPoints tr').length === 13 && (p.$('tbPoints').textContent.match(/Aucune trace/g) || []).length === 13 && p.$('kpiTraces').textContent === '0' && p.$('kpiPoints').textContent === '0 / 13' && p.$('kpiAnneeLabel').textContent === 'En ' + AN && /Aucune trace pour le moment/.test(p.$('tbTraces').textContent));
  p.$('btnNouveau').click();
  check('nouvelle trace : date du jour, qui, forme (propositions), objet, périmètre, preuve, 13 cases ; pas de suppression', p.$('cDate').value === AJD && !!p.$('cQui') && p.d.querySelectorAll('#cFormesListe option').length === 8 && !!p.$('cObjet') && !!p.$('cService') && !!p.$('cPreuve') && p.d.querySelectorAll('[data-point-coche]').length === 13 && !p.$('btnSupprimer'));
  check('… mots du secteur (agents, F3SCT)', /agents/.test(p.$('cObjet').placeholder) && /F3SCT/.test(p.$('fiche').textContent));
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  const lst = () => p.lire(CLE) || [];
  p.$('cDate').value = ''; soumettre();
  check('contrôle : la date', /la date/.test(p.alertes.pop() || '') && !lst().length);
  p.$('cDate').value = '2026-03-12'; soumettre();
  check('contrôle : qui', /qui, dans la direction/.test(p.alertes.pop() || ''));
  p.$('cQui').value = 'Mme Durand, DGS'; soumettre();
  check('contrôle : ce qui a été fait', /Décrivez ce qui a été fait/.test(p.alertes.pop() || ''));
  p.$('cObjet').value = 'Visite de l\'atelier <b>mécanique</b>, échange sur les protections auditives';
  soumettre();
  check('contrôle : au moins un point', /au moins un point/.test(p.alertes.pop() || '') && !lst().length);
  p.d.querySelector('[data-point-coche="e"]').checked = true; p.d.querySelector('[data-point-coche="j"]').checked = true;
  p.$('cForme').value = 'Visite de terrain'; p.$('cPreuve').value = 'https://intranet.exemple/compte-rendu-visite';
  soumettre();
  let t = lst()[0] || {};
  check('trace enregistrée : date, qui, forme, objet, points, preuve, auteur, sans service (toute l\'organisation)', lst().length === 1 && t.date === '2026-03-12' && t.qui === 'Mme Durand, DGS' && t.forme === 'Visite de terrain' && J(t.points) === J(['e', 'j']) && /^https/.test(t.preuve) && t.auteur === 'PREV1' && !('service' in t) && /^eng-/.test(t.id), t);
  check('… liste : date, pastilles e et j, lien de preuve, texte échappé', /12\/03\/2026/.test(p.$('tbTraces').textContent) && [...p.d.querySelectorAll('#tbTraces .chip.lettre')].map(c => c.textContent).join('') === 'ej' && !!p.d.querySelector('#tbTraces a[href^="https://intranet"]') && !p.d.querySelector('#tbTraces b b') && /<b>mécanique<\/b>/.test(p.$('tbTraces').textContent));
  check('… points : e et j à 1, le 12/03/2026 ; compteurs 1 trace, 2 / 13, 1 membre', /12\/03\/2026/.test(p.d.querySelectorAll('#tbPoints tr')[4].textContent) && p.d.querySelectorAll('#tbPoints tr')[4].querySelector('.num').textContent === '1' && p.$('kpiTraces').textContent === '1' && p.$('kpiPoints').textContent === '2 / 13' && p.$('kpiPersonnes').textContent === '1');
  check('… journal d\'audit ; fiche restée ouverte, avec suppression', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Engagement de la direction' && a.type === 'Création' && /points e, j/.test(a.description)) && !!p.$('btnSupprimer') && /Trace du 12\/03\/2026/.test(p.$('fiche').textContent));
  // modification : un point de plus, preuve retirée
  p.d.querySelector('[data-point-coche="d"]').checked = true; p.$('cPreuve').value = '';
  soumettre();
  t = lst()[0] || {};
  check('modification : points d, e, j ; preuve retirée ; modifié par', J(t.points) === J(['d', 'e', 'j']) && !('preuve' in t) && t.modifiePar === 'PREV1' && lst().length === 1);

  // ---------- 3. Filtres, export, impression ----------
  const TR = [{ id:'a1', date:'2026-01-10', qui:'M. Bernard, maire', forme:'Message au personnel', objet:'Vœux : la prévention, priorité de l\'année', points:['e', 'b'] },
    { id:'a2', date:'2026-02-20', qui:'Mme Durand, DGS', forme:'Décision sur les moyens (budget, effectifs, matériel)', objet:'Budget de 20 000 € pour les EPI', points:['d'], service: V, preuve:'Délibération 2026-14' },
    { id:'a3', date:'2026-04-02', qui:'Mme Durand, DGS', forme:'Visite de terrain', objet:'Visite du centre technique', points:['j', 'g'], service: P }];
  p = await H.page('engagement-direction.html', RH, { [CLE]: J(TR) });
  check('trois traces, la plus récente d\'abord', [...p.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('') === 'a3a2a1' && p.$('kpiPersonnes').textContent === '2' && /02\/04\/2026/.test(p.$('majNote').textContent));
  p.choisir('fPoint', 'd');
  check('filtre par point : d → la décision sur le budget', [...p.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('') === 'a2');
  p.choisir('fPoint', ''); p.choisir('fForme', 'Visite de terrain');
  check('filtre par forme (formes présentes seulement)', p.d.querySelectorAll('#fForme option').length === 4 && [...p.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('') === 'a3');
  p.choisir('fForme', ''); p.$('fTexte').value = 'délibération'; p.ev(p.$('fTexte'), 'input');
  check('recherche (preuve, sans accents ni casse)', [...p.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('') === 'a2');
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  p.d.querySelector('#tbPoints [data-point="g"]').click();
  check('« Voir les traces » d\'un point : filtre posé', p.$('fPoint').value === 'g' && [...p.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('') === 'a3');
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb;
  const tr = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Traces']) : [], pts = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Points']) : [];
  check('export : feuilles Traces (toutes, sans filtre) et Points (13)', wb && J(wb.SheetNames) === J(['Traces', 'Points']) && tr.length === 3 && tr[0]['Date'] === '02/04/2026' && tr[1]['Périmètre'] === V && tr[2]['Points'] === 'e, b' && pts.length === 13 && pts[3]['Traces'] === 1, { noms: wb && wb.SheetNames, tr, p4: pts[3] });
  p.$('btnImprimer').click();
  const imp = p.$('eng-impression');
  check('impression : titre, compte, points et traces', imp && /Engagement de la direction en santé et sécurité/.test(imp.textContent) && /3 traces, la plus récente le 02\/04\/2026/.test(imp.textContent) && /5 \/ 13 points/.test(imp.textContent) && imp.querySelectorAll('table').length === 2 && /Budget de 20 000/.test(imp.textContent));

  // ---------- 4. Suppression, lecture seule, périmètre ----------
  p = await H.page('engagement-direction.html', RH, { [CLE]: J(TR) }, '?ouvrir=a1');
  check('?ouvrir= ouvre la trace', H.visible(p.$('fiche')) && p.$('cQui').value === 'M. Bernard, maire');
  p.$('btnSupprimer').click();
  check('suppression : retirée, journal', (p.lire(CLE) || []).length === 2 && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Suppression' && /Trace du 10\/01\/2026/.test(a.description)));
  let pm = await H.page('engagement-direction.html', MAN, { [CLE]: J(TR) });
  const idsM = [...pm.d.querySelectorAll('#tbTraces tr[data-id]')].map(r => r.dataset.id).join('');
  check('manager limité à Voirie : traces de toute l\'organisation et de son service, pas des autres ; lecture seule', !pm.erreurs.length && idsM === 'a2a1' && !pm.$('btnNouveau'), { idsM, err: pm.erreurs });
  pm.d.querySelector('#tbTraces [data-ouvrir="a2"]').click();
  check('… fiche en lecture seule : champs et cases figés, ni enregistrement ni suppression', pm.$('cQui').disabled && pm.d.querySelector('[data-point-coche="d"]').disabled && !pm.d.querySelector('#fiche [type="submit"]') && !pm.$('btnSupprimer'));
  const pr = await H.page('engagement-direction.html', REP, { [CLE]: J(TR) });
  check('représentant du personnel : la page, en lecture', !pr.erreurs.length && !pr.navigation() && pr.d.querySelectorAll('#tbTraces tr[data-id]').length === 3 && !pr.$('btnNouveau'));
  const pa = await H.page('engagement-direction.html', AG, {});
  check('agent : renvoyé au tableau de bord', pa.navigation());
  // un compte limité qui gère : ses seuls services
  const LIM = { user:'PREV2', role:'ag', email:'PREV2', services:[V], profils:['p-preventeur'] };
  const pl = await H.page('engagement-direction.html', LIM, {});
  pl.$('btnNouveau').click();
  check('compte limité qui gère : périmètre = ses services, pas « toute l\'organisation »', [...pl.$('cService').options].map(o => o.value).join('|') === V);
  // secteur entreprise : CSSCT
  const pe = await H.page('engagement-direction.html', PREV, { vigie_hse_referentials: J({ organisation: { secteur: 'entreprise' } }) });
  check('secteur entreprise : le point m nomme la CSSCT', /CSSCT/.test(pe.$('tbPoints').textContent) && !/F3SCT/.test(pe.$('tbPoints').textContent), pe.$('tbPoints').textContent.slice(-120));

  // ---------- 5. Droits, menu, serveur, stockage ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const def = W.VigieDroits.MODULES.find(m => m.id === 'engagement-direction');
  check('catalogue : « engagement-direction » (Pilotage) ; Admin, RH, Préventeur gèrent ; Manager, Représentant consultent ; Agent rien', def && def.section === 'Pilotage' && res(ADMIN).peut('engagement-direction', 'gerer') && res(RH).peut('engagement-direction', 'gerer') && res(PREV).peut('engagement-direction', 'gerer')
    && res(MAN).peut('engagement-direction', 'consulter') && !res(MAN).peut('engagement-direction', 'gerer') && res(REP).peut('engagement-direction', 'consulter') && !res(REP).peut('engagement-direction', 'gerer') && !res(AG).peut('engagement-direction', 'consulter'));
  const dm = await H.page('dashboard.html', MAN, {}), da = await H.page('dashboard.html', AG, {});
  check('menu : le lien sous Pilotage pour le manager, pas pour l\'agent', !!dm.d.querySelector('nav a[href="engagement-direction.html"]') && !da.d.querySelector('nav a[href="engagement-direction.html"]'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur, RH complet ; Manager, Représentant, Agent aucun ; règle explicite', Droits.niveau(sess(['p-preventeur']), CLE) === 'complet' && Droits.niveau(sess(['p-rh']), CLE) === 'complet' && Droits.niveau(sess(['p-manager']), CLE) === 'aucun' && Droits.niveau(sess(['p-representant']), CLE) === 'aucun' && Droits.niveau(sess(['p-agent']), CLE) === 'aucun' && Droits.cles.includes(CLE));
  check('serveur, lecture : Manager, Représentant reçoivent ; Agent, rien', Lecture.regle(sess(['p-manager']), CLE) === null && Lecture.regle(sess(['p-representant']), CLE) === null && Lecture.regle(sess(['p-agent']), CLE) === Lecture.RETIRE);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : qui, points', /direction/.test(W.VigieLibelles.libelle(CLE, 'qui')) && /5\.1/.test(W.VigieLibelles.libelle(CLE, 'points')));
  check('icône du menu : i-flag', !!W.VigieIcones && !!W.VigieIcones.ICONES['i-flag']);

  // ---------- 6. Préparation ISO 45001 ----------
  const faits = (pp, c) => { const r = pp.d.querySelector(`tr[data-clause="${c}"]`); return r ? r.textContent : ''; };
  const etat51 = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '5.1');
  let pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation, rien : 5.1 « Aucun enregistrement », couverte, lien', !pp.erreurs.length && etat51(pp).etat === 'rien' && /aucune trace de l'engagement de la direction/.test(faits(pp, '5.1')) && pp.w.VigiePreparation.COUVERTURE['5.1'].c === 'couverte' && !!pp.d.querySelector('tr[data-clause="5.1"] a[href="engagement-direction.html"]'), faits(pp, '5.1').slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(TR) });
  check('… trois traces : « Des enregistrements », la plus récente, 5 / 13 points', etat51(pp).etat === 'pret' && /3 traces de l'engagement de la direction, la plus récente le 02\/04\/2026/.test(faits(pp, '5.1')) && /5 \/ 13 points du § 5\.1/.test(faits(pp, '5.1')), faits(pp, '5.1').slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { vigie_hse_revues_direction: J([{ id:'r1', statut:'Validée', dateRevue:'2026-01-20' }]) });
  check('… une revue validée sans trace : « Des enregistrements » (comme avant)', etat51(pp).etat === 'pret' && /aucune trace/.test(faits(pp, '5.1')) && /1 revue de direction validée/.test(faits(pp, '5.1')));
  check('… couverture : 26 couvertes, 1 en partie (communication, documents, achats et résultats au personnel compris)', Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'couverte').length === 26 && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'partielle').length === 1);
  const lp = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '5.1');
  check('… registre partiel pour ce compte : « Non calculé »', lp.etat === 'partiel');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
