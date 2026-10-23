// Communication santé-sécurité (ISO 45001 § 7.4, 2026-10-21) : composant, page (plan, communications émises et reçues,
// contrôles, filtres, export, impression, suppression, lecture seule, périmètre, mots du secteur), droits, menu, serveur,
// Préparation ISO 45001, Revue de direction ; résultats au personnel (§ 10.3, 2026-10-23).
//   RACINE=<dossier> node test-communication.js
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
const CLE = 'vigie_hse_communication';
const J = (o) => JSON.stringify(o);
const ids = (p, tb) => [...p.d.querySelectorAll(`#${tb} tr[data-id]`)].map(r => r.dataset.id).join(' ');

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('communication.html', PREV, {});
  const C = p0.w.VigieCommunication, AJD = p0.w.VigieDates.aujourdhui(), AN = AJD.slice(0, 4);
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  check('sens, propositions (publics, quand, canaux), libellés', C.SENS_TRACE.length === 3 && C.libelleSens('recue') === 'Reçue de l\'extérieur' && C.libelleSens('externe') === 'Émise vers l\'extérieur' && C.PUBLICS.includes('Les entreprises extérieures') && C.QUAND.includes('Chaque année') && C.CANAUX.includes('Affichage'));
  const L = [{ id:'s1', registre:'sujet', sujet:'Consignes incendie', sens:'interne', public:'Tous les agents' }, { id:'s2', registre:'sujet', sujet:'Travaux', sens:'externe', public:'Les riverains' },
    { id:'s3', registre:'sujet', sujet:'Ancien', statut:'arrete' }, { id:'s4', registre:'sujet', sujet:'  ' },
    { id:'t1', registre:'trace', date:'2025-03-01', sens:'interne', sujetId:'s1', objet:'a' }, { id:'t2', registre:'trace', date: AN + '-02-10', sens:'recue', objet:'b', public:'Un riverain' },
    { id:'t3', registre:'trace', date: AN + '-01-05', sens:'recue', objet:'c', suite:'Réponse faite' }, { id:'t4', registre:'trace', date: AN + '-03-01', sens:'externe', objet:'d', sujetId:'s1' },
    { id:'t5', registre:'trace', date:'pas une date' }, { registre:'trace', date:'2025-01-01' }, null];
  const s = C.synthese(L, AN);
  check('synthèse : sujets en cours (internes, externes), arrêtés, communications, de l\'année, reçues, sans suite, sujets sans communication', s.sujets === 2 && s.internes === 1 && s.externes === 1 && s.arretes === 1 && s.traces === 4 && s.annee === 3 && s.recues === 2 && s.recuesSansSuite === 1 && J(s.sujetsSansTrace) === J(['s2']) && s.derniere === AN + '-03-01', s);
  check('triées ; communications d\'un sujet ; dernière ; période', C.triees(L).map(t => t.id).join('') === 't4t2t3t1' && C.tracesDe(L, 's1').map(t => t.id).join('') === 't4t1' && C.derniere(L, 's1') === AN + '-03-01' && C.derniere(L, 's2') === '' && C.pourPeriode(L, '2025-03-01', AN + '-01-05').map(t => t.id).join('') === 't1t3');
  const rv = C.pourRevue(L, '2025-01-01', AN + '-12-31');
  check('pour la revue : les communications avec l\'extérieur seulement, émises et reçues, sans suite', rv.emises === 1 && rv.recues === 2 && rv.sansSuite === 1 && rv.liste.map(m => m.objet).join('') === 'cbd', rv);

  // ---------- 2. Page vide, nouveau sujet ----------
  let p = await H.page('communication.html', PREV, {});
  check('vide : compteurs à 0, invitations', p.$('kpiSujets').textContent === '0' && p.$('kpiAnneeLabel').textContent === 'Communications en ' + AN && /Aucun sujet au plan/.test(p.$('tbPlan').textContent) && /Aucune communication notée pour le moment/.test(p.$('tbTraces').textContent));
  p.$('btnNouveauSujet').click();
  check('nouveau sujet : quoi, sens, à qui, quand, comment, par qui, adaptations, périmètre, statut ; pas de suppression', ['cSujet', 'cSens', 'cPublic', 'cQuand', 'cCanal', 'cResponsable', 'cAdaptations', 'cService', 'cStatut'].every(id => !!p.$(id)) && p.d.querySelectorAll('#cPublicsListe option').length === 12 && p.d.querySelectorAll('#cCanauxListe option').length === 13 && !p.$('btnSupprimer'));
  check('… mots du secteur (agents, F3SCT)', [...p.d.querySelectorAll('#cPublicsListe option')].some(o => o.value === 'Tous les agents') && [...p.d.querySelectorAll('#cCanauxListe option')].some(o => /F3SCT/.test(o.value)));
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  const lst = () => p.lire(CLE) || [];
  soumettre();
  check('contrôle : quoi', /quoi communiquer/.test(p.alertes.pop() || '') && !lst().length);
  p.$('cSujet').value = 'Consignes en cas d\'<b>incendie</b>'; soumettre();
  check('contrôle : à qui', /à qui/.test(p.alertes.pop() || '') && !lst().length);
  p.$('cPublic').value = 'Tous les agents'; p.$('cQuand').value = 'Chaque année'; p.$('cCanal').value = 'Affichage'; p.$('cResponsable').value = 'Préventeur';
  p.$('cAdaptations').value = 'Pictogrammes';
  soumettre();
  let x = lst()[0] || {};
  check('sujet enregistré : registre, quoi, interne, à qui, quand, comment, par qui, auteur, sans service ni statut', lst().length === 1 && x.registre === 'sujet' && x.sens === 'interne' && x.public === 'Tous les agents' && x.quand === 'Chaque année' && x.canal === 'Affichage' && x.responsable === 'Préventeur' && x.adaptations === 'Pictogrammes' && x.auteur === 'PREV1' && !('service' in x) && !('statut' in x) && /^csu-/.test(x.id), x);
  check('… plan : texte échappé, « Aucune » communication ; compteurs 1 sujet, 1 sans communication ; fiche restée ouverte', /<b>incendie<\/b>/.test(p.$('tbPlan').textContent) && !p.d.querySelector('#tbPlan b b') && /Aucune/.test(p.$('tbPlan').textContent) && p.$('kpiSujets').textContent === '1' && p.$('kpiSansTrace').textContent === '1' && /Sujet du plan/.test(p.$('fiche').textContent) && !!p.$('btnSupprimer'));
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Communication' && a.type === 'Création' && /Sujet du plan de communication/.test(a.description)));

  // ---------- 3. Communication notée depuis le sujet, puis une reçue ----------
  p.$('btnNoterSujet').click();
  check('« Noter une communication pour ce sujet » : sujet, sens, public, canal et par qui repris ; suite cachée', p.$('cSujetLie').value === x.id && p.$('cSensT').value === 'interne' && p.$('cPublicT').value === 'Tous les agents' && p.$('cCanalT').value === 'Affichage' && p.$('cQui').value === 'Préventeur' && p.$('blocSuite').style.display === 'none' && p.$('cDate').value === AJD);
  soumettre();
  check('contrôle : ce qui a été communiqué', /Décrivez ce qui a été communiqué/.test(p.alertes.pop() || ''));
  p.$('cObjet').value = 'Affiches des consignes renouvelées dans les ateliers'; p.$('cDate').value = '2026-03-12'; p.$('cPreuve').value = 'https://intranet.exemple/affiche';
  soumettre();
  let t = lst().find(z => z.registre === 'trace') || {};
  check('communication enregistrée : date, sens, sujet, objet, preuve, sans suite', t.date === '2026-03-12' && t.sens === 'interne' && t.sujetId === x.id && /Affiches/.test(t.objet) && /^https/.test(t.preuve) && !('suite' in t) && /^ctr-/.test(t.id), t);
  check('… plan : dernière communication 12/03/2026 ; compteurs ; lien de preuve', /12\/03\/2026/.test(p.$('tbPlan').textContent) && p.$('kpiSansTrace').textContent === '0' && !!p.d.querySelector('#tbTraces a[href^="https://intranet"]'));
  p.$('btnNouvelleRecue').click();
  check('« Noter une communication reçue » : sens reçue, libellés de qui / reçue par, suite visible', p.$('cSensT').value === 'recue' && p.$('lPublic').textContent === 'De qui' && p.$('lQui').textContent === 'Reçue par' && p.$('lObjet').textContent === 'Ce qui a été reçu' && p.$('blocSuite').style.display === '');
  p.$('cObjet').value = 'Courrier d\'un riverain sur le bruit du chantier'; soumettre();
  check('contrôle : de qui', /de qui elle vient/.test(p.alertes.pop() || ''));
  p.$('cPublicT').value = 'Un riverain'; soumettre();
  const recue = lst().find(z => z.sens === 'recue') || {};
  check('reçue sans suite : enregistrée, pastille « Sans suite notée », compteur', recue.public === 'Un riverain' && !('suite' in recue) && /Sans suite notée/.test(p.$('tbTraces').textContent) && p.$('kpiSansSuite').textContent === '1');
  p.$('cSuite').value = 'Réponse écrite, horaires du chantier décalés'; soumettre();
  check('… suite ajoutée : compteur à 0, modifié par', (lst().find(z => z.sens === 'recue') || {}).suite === 'Réponse écrite, horaires du chantier décalés' && p.$('kpiSansSuite').textContent === '0' && (lst().find(z => z.sens === 'recue') || {}).modifiePar === 'PREV1');
  p.choisir('cSensT', 'externe');
  check('… changer le sens : libellés et suite suivent', p.$('lPublic').textContent === 'À qui' && p.$('blocSuite').style.display === 'none');
  p.choisir('cSensT', 'recue');
  // un sujet qui a des communications ne se supprime pas
  p.d.querySelector(`#tbPlan [data-sujet="${x.id}"]`).click();
  p.$('btnSupprimer').click();
  check('sujet avec communications : suppression refusée, « arrêtez-le »', /arrêtez-le/.test(p.alertes.pop() || '') && lst().length === 3);
  p.choisir('cStatut', 'arrete'); soumettre();
  check('sujet arrêté : caché du plan, visible avec « Afficher les sujets arrêtés »', !p.d.querySelector('#tbPlan tr[data-id]') && /Tous les sujets sont arrêtés/.test(p.$('tbPlan').textContent) && (p.$('fArretes').checked = true, p.ev(p.$('fArretes'), 'change'), !!p.d.querySelector('#tbPlan tr.retire')));

  // ---------- 4. Filtres, export, impression ----------
  const TR = [{ id:'s1', registre:'sujet', sujet:'Résultats santé-sécurité de l\'année', sens:'interne', public:'Tous les agents', quand:'Chaque année', canal:'Réunion de service', responsable:'DGS' },
    { id:'s2', registre:'sujet', sujet:'Travaux de voirie', sens:'externe', public:'Les riverains', service: V },
    { id:'c1', registre:'trace', date:'2026-01-10', sens:'interne', sujetId:'s1', objet:'Bilan 2025 présenté', public:'Tous les agents', qui:'DGS' },
    { id:'c2', registre:'trace', date:'2026-02-20', sens:'externe', sujetId:'s2', objet:'Avis de travaux', public:'Les riverains', service: V, preuve:'Courrier 2026-14' },
    { id:'c3', registre:'trace', date:'2026-04-02', sens:'recue', objet:'Remarque de l\'inspection', public:'Inspection', service: P }];
  p = await H.page('communication.html', RH, { [CLE]: J(TR) });
  check('plan : interne puis externe ; communications, la plus récente d\'abord', ids(p, 'tbPlan') === 's1 s2' && ids(p, 'tbTraces') === 'c3 c2 c1' && /02\/04\/2026/.test(p.$('majNote').textContent) && p.$('kpiSansSuite').textContent === '1');
  p.choisir('fSens', 'sansSuite');
  check('filtre : reçues sans suite', ids(p, 'tbTraces') === 'c3');
  p.choisir('fSens', ''); p.choisir('fSujet', 's2');
  check('filtre : sujet du plan', ids(p, 'tbTraces') === 'c2');
  p.choisir('fSujet', ''); p.$('fTexte').value = 'resultats'; p.ev(p.$('fTexte'), 'input');
  check('recherche (sujet du plan, sans accents ni casse)', ids(p, 'tbTraces') === 'c1');
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb;
  const pl = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Plan']) : [], co = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Communications']) : [];
  check('export : feuilles Plan et Communications (toutes, sans filtre)', wb && J(wb.SheetNames) === J(['Plan', 'Communications']) && pl.length === 2 && pl[0]['Dernière communication'] === '10/01/2026' && co.length === 3 && co[0]['Sens'] === 'Reçue de l\'extérieur' && co[1]['Sujet du plan'] === 'Travaux de voirie' && co[1]['Périmètre'] === V, { noms: wb && wb.SheetNames, pl, co0: co[0] });
  p.$('btnImprimer').click();
  const imp = p.$('com-impression');
  check('impression : titre, compte, plan et communications', imp && /Communication santé-sécurité/.test(imp.textContent) && /2 sujets au plan \(1 interne, 1 externe\)/.test(imp.textContent) && /3 communications notées, dont 1 reçue de l'extérieur \(1 sans suite notée\)/.test(imp.textContent) && imp.querySelectorAll('table').length === 2 && /Avis de travaux/.test(imp.textContent));

  // ---------- 5. Suppression, lecture seule, périmètre ----------
  p = await H.page('communication.html', RH, { [CLE]: J(TR) }, '?ouvrir=c1');
  check('?ouvrir= ouvre une communication', H.visible(p.$('fiche')) && p.$('cObjet').value === 'Bilan 2025 présenté');
  p.$('btnSupprimer').click();
  check('suppression d\'une communication : retirée, journal', (p.lire(CLE) || []).length === 4 && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Suppression' && /Communication du 10\/01\/2026/.test(a.description)));
  p = await H.page('communication.html', RH, { [CLE]: J(TR) }, '?ouvrir=s1');
  check('?ouvrir= ouvre un sujet, avec ses communications', H.visible(p.$('fiche')) && p.$('cSujet').value === 'Résultats santé-sécurité de l\'année' && !!p.d.querySelector('[data-trace-liee="c1"]'));
  let pm = await H.page('communication.html', MAN, { [CLE]: J(TR) });
  check('manager limité à Voirie : ce qui vaut pour toute l\'organisation et son service, pas les autres ; lecture seule', !pm.erreurs.length && ids(pm, 'tbTraces') === 'c2 c1' && ids(pm, 'tbPlan') === 's1 s2' && !pm.$('btnNouveauSujet') && !pm.$('btnNouvelle'), { err: pm.erreurs });
  pm.d.querySelector('#tbPlan [data-sujet="s1"]').click();
  check('… fiche en lecture seule : champs figés, ni enregistrement, ni suppression, ni « noter »', pm.$('cSujet').disabled && !pm.d.querySelector('#fiche [type="submit"]') && !pm.$('btnSupprimer') && !pm.$('btnNoterSujet'));
  const pr = await H.page('communication.html', REP, { [CLE]: J(TR) });
  check('représentant du personnel : la page, en lecture', !pr.erreurs.length && !pr.navigation() && pr.d.querySelectorAll('#tbTraces tr[data-id]').length === 3 && !pr.$('btnNouvelle'));
  const pa = await H.page('communication.html', AG, {});
  check('agent : renvoyé au tableau de bord', pa.navigation());
  const LIM = { user:'PREV2', role:'ag', email:'PREV2', services:[V], profils:['p-preventeur'] };
  const plim = await H.page('communication.html', LIM, {});
  plim.$('btnNouvelle').click();
  check('compte limité qui gère : périmètre = ses services', [...plim.$('cService').options].map(o => o.value).join('|') === V);
  const pe = await H.page('communication.html', PREV, { vigie_hse_referentials: J({ organisation: { secteur: 'entreprise' } }) });
  pe.$('btnNouveauSujet').click();
  check('secteur entreprise : salariés, CSSCT', [...pe.d.querySelectorAll('#cPublicsListe option')].some(o => o.value === 'Tous les salariés') && [...pe.d.querySelectorAll('#cCanauxListe option')].some(o => /CSSCT/.test(o.value)));

  // ---------- 6. Droits, menu, serveur, stockage ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const def = W.VigieDroits.MODULES.find(m => m.id === 'communication');
  check('catalogue : « communication » (Pilotage) ; Admin, RH, Préventeur gèrent ; Manager, Représentant consultent ; Agent rien', def && def.section === 'Pilotage' && res(ADMIN).peut('communication', 'gerer') && res(RH).peut('communication', 'gerer') && res(PREV).peut('communication', 'gerer')
    && res(MAN).peut('communication', 'consulter') && !res(MAN).peut('communication', 'gerer') && res(REP).peut('communication', 'consulter') && !res(REP).peut('communication', 'gerer') && !res(AG).peut('communication', 'consulter'));
  const dm = await H.page('dashboard.html', MAN, {}), da = await H.page('dashboard.html', AG, {});
  check('menu : le lien sous Pilotage pour le manager, pas pour l\'agent', !!dm.d.querySelector('nav a[href="communication.html"]') && !da.d.querySelector('nav a[href="communication.html"]'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur, RH complet ; Manager, Représentant, Agent aucun ; règle explicite', Droits.niveau(sess(['p-preventeur']), CLE) === 'complet' && Droits.niveau(sess(['p-rh']), CLE) === 'complet' && Droits.niveau(sess(['p-manager']), CLE) === 'aucun' && Droits.niveau(sess(['p-representant']), CLE) === 'aucun' && Droits.niveau(sess(['p-agent']), CLE) === 'aucun' && Droits.cles.includes(CLE));
  check('serveur, lecture : Manager, Représentant reçoivent ; Agent, rien', Lecture.regle(sess(['p-manager']), CLE) === null && Lecture.regle(sess(['p-representant']), CLE) === null && Lecture.regle(sess(['p-agent']), CLE) === Lecture.RETIRE);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : suite, public', /Suite/.test(W.VigieLibelles.libelle(CLE, 'suite')) && /de qui/.test(W.VigieLibelles.libelle(CLE, 'public')));
  check('icône du menu : i-megaphone', !!W.VigieIcones && !!W.VigieIcones.ICONES['i-megaphone']);

  // ---------- 7. Préparation ISO 45001 ----------
  const faits = (pp, c) => { const r = pp.d.querySelector(`tr[data-clause="${c}"]`); return r ? r.textContent : ''; };
  const etat74 = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '7.4');
  let pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation, rien : 7.4 « Aucun enregistrement », couverte, lien', !pp.erreurs.length && etat74(pp).etat === 'rien' && /aucun sujet au plan de communication/.test(faits(pp, '7.4')) && pp.w.VigiePreparation.COUVERTURE['7.4'].c === 'couverte' && !!pp.d.querySelector('tr[data-clause="7.4"] a[href="communication.html"]'), faits(pp, '7.4').slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(TR) });
  check('… un plan : « Des enregistrements », sujets, communications, reçues sans suite', etat74(pp).etat === 'pret' && /2 sujets au plan de communication \(1 interne, 1 externe\)/.test(faits(pp, '7.4')) && /3 communications notées, la plus récente le 02\/04\/2026/.test(faits(pp, '7.4')) && /1 communication reçue de l'extérieur, 1 sans suite notée/.test(faits(pp, '7.4')), faits(pp, '7.4').slice(0, 400));
  pp = await H.page('preparation-iso.html', PREV, { vigie_hse_news: J([{ id:'n1', titre:'x' }]) });
  check('… un Flash Info sans plan : « Des enregistrements » (comme avant)', etat74(pp).etat === 'pret' && /aucun sujet au plan/.test(faits(pp, '7.4')) && /1 Flash Info/.test(faits(pp, '7.4')));
  check('… couverture : 26 couvertes, 1 en partie (documents, achats et résultats au personnel compris)', Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'couverte').length === 26 && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'partielle').length === 1);
  const lp = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '7.4');
  check('… registre partiel pour ce compte : « Non calculé »', lp.etat === 'partiel');

  // ---------- 8. Revue de direction ----------
  const RV = [{ id:'e1', registre:'trace', date: AJD, sens:'externe', objet:'Avis aux riverains', public:'Les riverains' },
    { id:'e2', registre:'trace', date: AJD, sens:'recue', objet:'Courrier de l\'assureur', public:'L\'assureur' },
    { id:'e3', registre:'trace', date: AJD, sens:'interne', objet:'Note interne', public:'Tous les agents' }];
  const rd = await H.page('revue-direction.html', RH, { [CLE]: J(RV) });
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : les communications avec l\'extérieur dans « Communications avec les parties intéressées »', !rd.erreurs.length && /Communications avec l'extérieur notées dans la période/.test(txt) && /Avis aux riverains/.test(txt) && /reçue de L'assureur : Courrier de l'assureur · sans suite notée/.test(txt) && !/Note interne/.test(txt), { err: rd.erreurs, t: txt.slice(txt.indexOf('Communications avec'), txt.indexOf('Communications avec') + 400) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const ce = revue.chiffres && revue.chiffres.communicationsExternes;
  check('… photographiées avec la revue', ce && ce.emises === 1 && ce.recues === 1 && ce.sansSuite === 1 && ce.liste.length === 2, ce);
  check('… revue antérieure : rien ; registre partiel : non repris, et dit', rd.w.communicationsDeLaRevue({}) === '' && (rd.w.VigieStore.complet = () => false, rd.w.communicationsDuJour('2026-01-01', '2026-12-31') === null) && /Non repris/.test(rd.w.communicationsDeLaRevue({ communicationsExternes: null })));

  // ---------- 9. Résultats au personnel (ISO 45001 § 10.3) ----------
  const LR = [{ id:'r1', registre:'sujet', sujet:'Bilan de l\'année', sens:'interne', public:'Tous les agents', resultats:true },
    { id:'r2', registre:'sujet', sujet:'Ancien bilan', sens:'interne', public:'Tous les agents', resultats:true, statut:'arrete' },
    { id:'r3', registre:'sujet', sujet:'Consignes', sens:'interne', public:'Tous les agents' },
    { id:'u1', registre:'trace', date: AN + '-01-15', sens:'interne', sujetId:'r1', objet:'Bilan présenté' },
    { id:'u2', registre:'trace', date:'2024-02-01', sens:'interne', sujetId:'r2', objet:'Bilan 2023' },
    { id:'u3', registre:'trace', date: AN + '-02-01', sens:'externe', sujetId:'r1', objet:'Bilan à l\'assureur' },
    { id:'u4', registre:'trace', date: AN + '-03-01', sens:'interne', sujetId:'r3', objet:'Consignes' },
    { id:'u5', registre:'trace', date: AN + '-03-02', sens:'recue', sujetId:'r1', objet:'Question' }];
  const rr = C.resultatsAuPersonnel(LR, AN);
  check('résultats au personnel : sujets « résultats » en cours, communications internes (sujet arrêté compris), de l\'année, la plus récente', rr.sujets === 1 && rr.traces === 2 && rr.annee === 1 && rr.derniere === AN + '-01-15' && C.surResultats(LR[0]) && !C.surResultats(LR[2]) && !C.surResultats({ resultats:'oui' }), rr);
  check('… rien : zéros', J(C.resultatsAuPersonnel([], AN)) === J({ sujets:0, traces:0, annee:0, derniere:'' }) && J(C.resultatsAuPersonnel(null, AN)) === J({ sujets:0, traces:0, annee:0, derniere:'' }));
  p = await H.page('communication.html', PREV, {});
  p.$('btnNouveauSujet').click();
  check('page : case « résultats » au nouveau sujet, décochée', !!p.$('cResultats') && !p.$('cResultats').checked && !p.$('cResultats').disabled);
  p.$('cSujet').value = 'Résultats de l\'année'; p.$('cPublic').value = 'Tous les agents'; p.$('cResultats').checked = true;
  p.ev(p.$('ficheForm'), 'submit');
  const xr = (p.lire(CLE) || [])[0] || {};
  check('… cochée : enregistrée (resultats: true), pastille « Résultats » au plan', xr.resultats === true && /Résultats/.test((p.d.querySelector('#tbPlan tr[data-id] td:nth-child(2)') || {}).textContent || ''));
  p = await H.page('communication.html', PREV, { [CLE]: J(LR) }, '?ouvrir=r1');
  check('… rouvert : cochée ; pastille pour r1, pas pour r3', p.$('cResultats').checked && /Résultats/.test(p.d.querySelector('#tbPlan tr[data-id="r1"] td:nth-child(2)').textContent) && !/Résultats/.test(p.d.querySelector('#tbPlan tr[data-id="r3"] td:nth-child(2)').textContent));
  p.$('btnExport').click();
  const plr = (p.ecrits[0] || {}).wb ? H.XLSX.utils.sheet_to_json(p.ecrits[0].wb.Sheets['Plan']) : [];
  check('… export : colonne « Résultats (§ 10.3) »', plr.find(r => r['Identifiant'] === 'r1')['Résultats (§ 10.3)'] === 'Oui' && !plr.find(r => r['Identifiant'] === 'r3')['Résultats (§ 10.3)']);
  p.$('btnImprimer').click();
  check('… impression : « (résultats, § 10.3) » après le sujet', /Bilan de l'année \(résultats, § 10\.3\)/.test(p.$('com-impression').textContent) && !/Consignes \(résultats/.test(p.$('com-impression').textContent));
  p = await H.page('communication.html', PREV, { [CLE]: J(LR) }, '?ouvrir=r1');
  p.$('cResultats').checked = false; p.ev(p.$('ficheForm'), 'submit');
  check('… décochée : le champ disparaît', !('resultats' in (p.lire(CLE) || []).find(z => z.id === 'r1')) && !p.erreurs.length, p.erreurs);
  const pmr = await H.page('communication.html', MAN, { [CLE]: J(LR) }, '?ouvrir=r1');
  check('… lecture seule (Manager) : case figée', pmr.$('cResultats').checked && pmr.$('cResultats').disabled);
  const etat103 = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '10.3');
  pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation 10.3, rien : couverte, lien Communication, plus de « Manque », « aucun sujet « résultats » »', etat103(pp).etat === 'rien' && pp.w.VigiePreparation.COUVERTURE['10.3'].c === 'couverte' && !!pp.d.querySelector('tr[data-clause="10.3"] a[href="communication.html"]') && !/Manque/.test(faits(pp, '10.3')) && /aucun sujet « résultats » au plan de communication/.test(faits(pp, '10.3')));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(LR) });
  check('… des communications des résultats, sans action faite : « Des enregistrements », compte, la plus récente', etat103(pp).etat === 'pret' && new RegExp('2 communications des résultats au personnel, la plus récente le 15/01/' + AN).test(faits(pp, '10.3')) && /aucune action faite/.test(faits(pp, '10.3')));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(LR.filter(x => x.registre === 'sujet')), vigie_hse_actions: J([{ id:'a1', titre:'x', statut:'Fait', dateRealisation: AJD }]) });
  check('… une action faite, un sujet « résultats » sans communication : dit, sans jugement', etat103(pp).etat === 'pret' && /1 action faite/.test(faits(pp, '10.3')) && /aucune communication notée pour les sujets « résultats »/.test(faits(pp, '10.3')), faits(pp, '10.3'));
  const lp3 = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '10.3');
  check('… registre de communication partiel pour ce compte : « Non calculé »', lp3.etat === 'partiel');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
