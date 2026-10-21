// Achats et santé-sécurité (ISO 45001 § 8.1.4, 2026-10-21) : composant, page (demande, critères proposés et ajoutés, avis,
// suite, rappel après l'achat, filtres, export, impression, suppression), demandeur (Manager), lecture seule, droits,
// menu, serveur (ajout seulement pour qui demande), Préparation ISO 45001.
//   RACINE=<dossier> node test-achats.js
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
const CLE = 'vigie_hse_achats';
const EQ = 'Équipement de travail (machine, outil, appareil)', CH = 'Produit chimique';
const J = (o) => JSON.stringify(o);
const ids = (p) => [...p.d.querySelectorAll('#tbDemandes tr[data-id]')].map(r => r.dataset.id).join(' ');

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('achats.html', PREV, {});
  const A = p0.w.VigieAchats, AJD = p0.w.VigieDates.aujourdhui(), AN = AJD.slice(0, 4);
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  check('natures, critères proposés (communs + selon la nature), avis', A.NATURES.length === 7 && A.criteresPour(EQ).length === 7 && A.criteresPour(CH).some(c => /FDS/.test(c)) && A.criteresPour(CH).some(c => /substitution/.test(c)) && A.criteresPour('Autre').length === 3 && A.criteresPour('inconnue').length === 3 && J(A.AVIS) === J(['Favorable', 'Favorable avec réserves', 'Défavorable']));
  const L = [{ id:'a1', date:'2025-03-01', objet:'Perceuse', avis:'Favorable', suite:'achete', dateSuite:'2025-04-01', criteres:[{ c:'x', r:'oui' }, { c:'y', r:'non' }, { c:'z', r:'so' }, { c:'w', r:'' }, { c:' ' }] },
    { id:'a2', date: AN + '-02-10', objet:'Solvant', suite:'achete', dateSuite: AN + '-02-20' }, { id:'a3', date: AN + '-01-05', objet:'Nacelle', avis:'Défavorable', suite:'achete' },
    { id:'a4', date: AN + '-03-01', objet:'Chaises', avis:'Favorable avec réserves' }, { id:'a5', date: AN + '-03-02', objet:'Gants' }, { id:'a6', date: AN + '-03-03', objet:'Logiciel', suite:'abandonne' },
    { id:'a7', date:'pas une date' }, { date:'2025-01-01' }, null];
  const s = A.synthese(L, AN);
  check('synthèse : demandes, de l\'année, à examiner, avis, achetées, abandonnées, sans avis, malgré un avis défavorable, critère « non »', s.total === 6 && s.annee === 5 && s.aExaminer === 1 && s.avisDonnes === 3 && s.favorables === 1 && s.reserves === 1 && s.defavorables === 1 && s.achetees === 3 && s.abandonnees === 1 && s.acheteesSansAvis === 1 && s.acheteesMalgreDefavorable === 1 && s.avecCritereNon === 1, s);
  check('état, bilan des critères, tri, période', A.etat(L[0]) === 'achete' && A.etat(L[3]) === 'avis' && A.etat(L[4]) === 'examiner' && A.etat(L[5]) === 'abandonne' && J(A.bilanCriteres(L[0])) === J({ total:4, oui:1, non:1, so:1, vides:1 })
    && A.triees(L).map(a => a.id).join('') === 'a6a5a4a2a3a1' && A.pourPeriode(L, '2025-03-01', AN + '-01-05').map(a => a.id).join('') === 'a1a3');

  // ---------- 2. Nouvelle demande (Préventeur) ----------
  let p = await H.page('achats.html', PREV, {});
  check('vide : compteurs à 0, invitation', p.$('kpiAnnee').textContent === '0' && p.$('kpiAnneeLabel').textContent === 'Demandes en ' + AN && /Aucune demande d'achat pour le moment/.test(p.$('tbDemandes').textContent));
  p.$('btnNouveau').click();
  check('nouvelle demande : date du jour, demandeur, invitation à choisir la nature, avis visible pour qui gère, pas de suite ni de suppression', p.$('cDate').value === AJD && p.$('cDemandeur').value === 'PREV1' && /Choisissez la nature/.test(p.$('blocCriteres').textContent) && !!p.$('cAvis') && !p.$('cSuite') && !p.$('btnSupprimer'));
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  const lst = () => p.lire(CLE) || [];
  p.$('cDate').value = ''; soumettre();
  check('contrôle : la date', /la date/.test(p.alertes.pop() || '') && !lst().length);
  p.$('cDate').value = '2026-03-12'; soumettre();
  check('contrôle : l\'objet', /l'objet/.test(p.alertes.pop() || ''));
  p.$('cObjet').value = 'Meuleuse <b>sans fil</b>'; soumettre();
  check('contrôle : la nature', /la nature/.test(p.alertes.pop() || '') && !lst().length);
  p.choisir('cNature', EQ);
  const nbCrit = () => p.d.querySelectorAll('#blocCriteres tr[data-crit]').length;
  check('nature choisie : 7 critères proposés (CE, notice…)', nbCrit() === 7 && /Marquage CE/.test(p.$('blocCriteres').textContent) && /utilisateurs ont été consultés/.test(p.$('blocCriteres').textContent));
  const rep = (i, v, note) => { const tr = p.d.querySelectorAll('#blocCriteres tr[data-crit]')[i]; tr.querySelector('[data-crit-reponse]').value = v; if (note) tr.querySelector('[data-crit-note]').value = note; };
  rep(0, 'oui'); rep(3, 'non', 'Déclaration CE attendue du fournisseur');
  p.$('btnAjoutCritere').click();
  check('« Ajouter un critère » : une ligne de plus, libellé à saisir, les réponses gardées', nbCrit() === 8 && !!p.d.querySelector('[data-crit-libelle]') && p.d.querySelectorAll('[data-crit-reponse]')[3].value === 'non');
  p.d.querySelector('[data-crit-libelle]').value = 'Batterie compatible avec le parc'; rep(7, 'oui');
  p.choisir('cNature', CH);
  check('nature changée après des réponses : les critères restent', nbCrit() === 8 && /Marquage CE/.test(p.$('blocCriteres').textContent));
  p.choisir('cNature', EQ);
  p.$('cAvis').value = 'Favorable avec réserves'; soumettre();
  check('contrôle : qui donne l\'avis et sa date', /qui le donne et sa date/.test(p.alertes.pop() || '') && !lst().length);
  p.$('cAvisPar').value = 'PREV1, préventeur'; p.$('cDateAvis').value = '2026-03-13'; soumettre();
  check('contrôle : les réserves', /les réserves/.test(p.alertes.pop() || ''));
  p.$('cReserves').value = 'Former les utilisateurs avant la mise en service'; p.$('cFournisseur').value = 'Outillage Martin, devis 2026-031';
  soumettre();
  let a = lst()[0] || {};
  check('demande enregistrée : objet, nature, critères (8, dont l\'ajouté), avis, réserves, auteur, sans service', lst().length === 1 && a.nature === EQ && a.criteres.length === 8 && a.criteres[3].r === 'non' && /CE attendue/.test(a.criteres[3].note) && a.criteres[7].perso === true && a.criteres[7].c === 'Batterie compatible avec le parc'
    && a.avis === 'Favorable avec réserves' && /Former/.test(a.reserves) && a.auteur === 'PREV1' && !('service' in a) && !('suite' in a) && /^ach-/.test(a.id), a);
  check('… liste : texte échappé, critères « 2 oui · 1 non · 5 à renseigner », pastille réserves ; fiche restée ouverte avec la suite et la suppression', !p.d.querySelector('#tbDemandes b b') && /<b>sans fil<\/b>/.test(p.$('tbDemandes').textContent) && /2 oui · 1 non · 5 à renseigner/.test(p.$('tbDemandes').textContent) && !!p.d.querySelector('#tbDemandes .chip.attention') && !!p.$('cSuite') && !!p.$('btnSupprimer') && /Avis donné/.test(p.$('fiche').textContent));
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(x => x.module === 'Achats' && x.type === 'Création' && /avis : Favorable avec réserves/.test(x.description)));
  // suite
  p.choisir('cSuite', 'achete'); soumettre();
  check('contrôle : la date de la suite', /date de la suite/.test(p.alertes.pop() || ''));
  p.$('cDateSuite').value = '2026-03-20'; soumettre();
  a = lst()[0];
  check('achetée : suite, date ; liste « Achetée le 20/03/2026 » ; rappel après l\'achat (vérifications périodiques)', a.suite === 'achete' && a.dateSuite === '2026-03-20' && /Achetée le 20\/03\/2026/.test(p.$('tbDemandes').textContent) && !!p.d.querySelector('#rappelSuite a[href="verifications-periodiques.html"]') && (p.lire('vigie_hse_audit_log') || []).some(x => /— achetée/.test(x.description)));
  // un achat sans avis : noté après confirmation, compté
  p.$('btnNouveau').click(); p.$('cObjet').value = 'Dégraissant'; p.choisir('cNature', CH); soumettre();
  const b = lst().find(x => x.objet === 'Dégraissant');
  p.choisir('cSuite', 'achete'); p.$('cDateSuite').value = '2026-04-01'; soumettre();
  check('achat sans avis : noté (après confirmation), pastille « sans avis », compteur, rappel produits chimiques', lst().find(x => x.id === b.id).suite === 'achete' && /sans avis/.test(p.$('tbDemandes').textContent) && p.$('kpiSansAvis').textContent === '1' && !!p.d.querySelector('#rappelSuite a[href="produits-chimiques.html"]'));

  // ---------- 3. Filtres, export, impression, suppression ----------
  const TR = [{ id:'d1', date:'2026-01-10', objet:'Nacelle élévatrice', nature:'Véhicule ou engin', service: V, demandeur:'Chef Voirie', avis:'Défavorable', avisPar:'PREV1', dateAvis:'2026-01-12', reserves:'Modèle sans garde-corps', criteres:[{ c:'Équipements de sécurité adaptés à l\'usage', r:'non' }] },
    { id:'d2', date:'2026-02-20', objet:'Solvant de nettoyage', nature: CH, service: P, demandeur:'Chef Bâtiments', suite:'achete', dateSuite:'2026-02-25' },
    { id:'d3', date:'2026-04-02', objet:'Gants anti-coupure', nature:'Équipement de protection individuelle (EPI)', demandeur:'PREV1', avis:'Favorable', avisPar:'PREV1', dateAvis:'2026-04-03', criteres:[{ c:'Marquage CE et notice fournis', r:'oui', note:'EN 388' }] }];
  p = await H.page('achats.html', RH, { [CLE]: J(TR) });
  check('trois demandes, la plus récente d\'abord ; compteurs', ids(p) === 'd3 d2 d1' && p.$('kpiReserves').textContent === '1' && p.$('kpiSansAvis').textContent === '1' && p.$('kpiExaminer').textContent === '0');
  p.choisir('fEtat', 'reserves');
  check('filtre : avis avec réserves ou défavorable', ids(p) === 'd1');
  p.choisir('fEtat', 'sansAvis');
  check('filtre : achetées sans avis', ids(p) === 'd2');
  p.choisir('fEtat', ''); p.choisir('fNature', CH);
  check('filtre : nature', ids(p) === 'd2');
  p.choisir('fNature', ''); p.$('fTexte').value = 'garde-corps'; p.ev(p.$('fTexte'), 'input');
  check('recherche (réserves, sans casse)', ids(p) === 'd1');
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  p.$('btnExport').click();
  const wb = (p.ecrits[0] || {}).wb;
  const de = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Demandes']) : [], cr = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Critères']) : [];
  check('export : feuilles Demandes et Critères', wb && J(wb.SheetNames) === J(['Demandes', 'Critères']) && de.length === 3 && de[2]['Avis'] === 'Défavorable' && de[2]['Critères non'] === 1 && de[1]['Suite'] === 'Achetée' && cr.length === 2 && cr.some(r => r['Réponse'] === 'Oui' && r['Note'] === 'EN 388'), { noms: wb && wb.SheetNames, de2: de[2], cr });
  p.$('btnImprimer').click();
  const imp = p.$('ach-impression');
  check('impression : titre, compte, demandes et critères', imp && /Achats et santé-sécurité/.test(imp.textContent) && /3 demandes : 0 à examiner/.test(imp.textContent) && /1 défavorable/.test(imp.textContent) && /\(1 sans avis\)/.test(imp.textContent) && /Marquage CE et notice fournis : oui \(EN 388\)/.test(imp.textContent));
  p = await H.page('achats.html', RH, { [CLE]: J(TR) }, '?ouvrir=d3');
  check('?ouvrir= ouvre la demande', H.visible(p.$('fiche')) && p.$('cObjet').value === 'Gants anti-coupure');
  p.$('btnSupprimer').click();
  check('suppression : retirée, journal', (p.lire(CLE) || []).length === 2 && (p.lire('vigie_hse_audit_log') || []).some(x => x.type === 'Suppression' && /Gants anti-coupure/.test(x.description)));

  // ---------- 4. Le Manager demande ; lecture seule ----------
  const pm = await H.page('achats.html', MAN, { [CLE]: J(TR) });
  check('manager limité à Voirie : ce qui vaut pour toute l\'organisation et son service ; « Nouvelle demande »', !pm.erreurs.length && ids(pm) === 'd3 d1' && !!pm.$('btnNouveau'), { err: pm.erreurs });
  pm.$('btnNouveau').click();
  check('… nouvelle demande : son service seulement, ni avis ni suite, mention « ne se modifie plus que par le préventeur »', [...pm.$('cService').options].map(o => o.value).join('|') === V && !pm.$('cAvis') && !pm.$('cSuite') && /ne se modifie plus que par le préventeur/.test(pm.$('fiche').textContent));
  pm.$('cObjet').value = 'Débroussailleuse'; pm.choisir('cNature', EQ);
  pm.d.querySelectorAll('[data-crit-reponse]')[0].value = 'oui';
  pm.ev(pm.$('ficheForm'), 'submit');
  const dm = (pm.lire(CLE) || []).find(x => x.objet === 'Débroussailleuse') || {};
  check('… enregistrée : service, demandeur, critères, sans avis', dm.service === V && dm.demandeur === 'manager@verchamps.fr' && dm.criteres.length === 7 && dm.criteres[0].r === 'oui' && !('avis' in dm) && dm.auteur === 'manager@verchamps.fr');
  check('… rouverte : figée (ni enregistrement, ni ajout de critère, ni suppression), « Pas encore d\'avis »', pm.$('cObjet').disabled && !pm.d.querySelector('#fiche [type="submit"]') && !pm.$('btnAjoutCritere') && !pm.$('btnSupprimer') && /Pas encore d'avis/.test(pm.$('fiche').textContent));
  pm.d.querySelector('#tbDemandes [data-ouvrir="d1"]').click();
  check('… une demande avec avis : l\'avis lu, champs figés', pm.$('cAvis').disabled && pm.$('cAvis').value === 'Défavorable' && pm.$('cReserves').disabled);
  const pr = await H.page('achats.html', REP, { [CLE]: J(TR) });
  check('représentant du personnel : la page, en lecture', !pr.erreurs.length && !pr.navigation() && ids(pr) === 'd3 d2 d1' && !pr.$('btnNouveau'));
  const pa = await H.page('achats.html', AG, {});
  check('agent : renvoyé au tableau de bord', pa.navigation());
  const pe = await H.page('achats.html', PREV, { vigie_hse_referentials: J({ organisation: { secteur: 'entreprise' } }) });
  pe.$('btnNouveau').click();
  check('secteur entreprise : salariés dans l\'aide de l\'usage', /salariés/.test(pe.$('cUsage').placeholder) && !/agents/.test(pe.$('cUsage').placeholder));

  // ---------- 5. Droits, menu, serveur, stockage ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const def = W.VigieDroits.MODULES.find(m => m.id === 'achats');
  check('catalogue : « achats » (Sécurité & Risques, consulter / demander / gérer) ; Admin, RH, Préventeur gèrent ; Manager demande ; Représentant consulte ; Agent rien', def && def.section === 'Sécurité & Risques' && def.niveaux.join(',') === 'aucun,consulter,demander,gerer'
    && res(ADMIN).peut('achats', 'gerer') && res(RH).peut('achats', 'gerer') && res(PREV).peut('achats', 'gerer') && res(MAN).peut('achats', 'demander') && !res(MAN).peut('achats', 'gerer')
    && res(REP).peut('achats', 'consulter') && !res(REP).peut('achats', 'demander') && !res(AG).peut('achats', 'consulter'), def && def.niveaux);
  const dmp = await H.page('dashboard.html', MAN, {}), dap = await H.page('dashboard.html', AG, {});
  check('menu : le lien sous Sécurité & Risques pour le manager, pas pour l\'agent', !!dmp.d.querySelector('nav a[href="achats.html"]') && !dap.d.querySelector('nav a[href="achats.html"]'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur, RH complet ; Manager ajout ; Représentant, Agent aucun', Droits.niveau(sess(['p-preventeur']), CLE) === 'complet' && Droits.niveau(sess(['p-rh']), CLE) === 'complet' && Droits.niveau(sess(['p-manager']), CLE) === 'ajout' && Droits.niveau(sess(['p-representant']), CLE) === 'aucun' && Droits.niveau(sess(['p-agent']), CLE) === 'aucun' && Droits.cles.includes(CLE));
  check('serveur, lecture : Manager, Représentant reçoivent ; Agent, rien', Lecture.regle(sess(['p-manager']), CLE) === null && Lecture.regle(sess(['p-representant']), CLE) === null && Lecture.regle(sess(['p-agent']), CLE) === Lecture.RETIRE);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : avis, réserves', /Avis/.test(W.VigieLibelles.libelle(CLE, 'avis')) && /Réserves/.test(W.VigieLibelles.libelle(CLE, 'reserves')));
  check('icône du menu : i-cart', !!W.VigieIcones && !!W.VigieIcones.ICONES['i-cart']);

  // ---------- 6. Préparation ISO 45001 ----------
  const faits = (pp) => { const r = pp.d.querySelector('tr[data-clause="8.1.4"]'); return r ? r.textContent : ''; };
  const etat = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '8.1.4');
  let pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation, rien : 8.1.4 « Aucun enregistrement », couverte, lien', !pp.erreurs.length && etat(pp).etat === 'rien' && /aucune demande d'achat examinée/.test(faits(pp)) && pp.w.VigiePreparation.COUVERTURE['8.1.4'].c === 'couverte' && !!pp.d.querySelector('tr[data-clause="8.1.4"] a[href="achats.html"]'), faits(pp).slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(TR) });
  check('… des demandes : avis, à examiner, achat sans avis', etat(pp).etat === 'pret' && /3 demandes d'achat \(2 avec un avis, 0 à examiner\)/.test(faits(pp)) && /1 achat noté sans avis de santé-sécurité/.test(faits(pp)) && /aucune intervention d'entreprise extérieure/.test(faits(pp)), faits(pp).slice(0, 400));
  pp = await H.page('preparation-iso.html', PREV, { vigie_hse_interventions_ee: J([{ id:'e1' }]) });
  check('… une intervention d\'entreprise extérieure sans achat : « Des enregistrements » (comme avant)', etat(pp).etat === 'pret' && /1 intervention d'entreprise extérieure/.test(faits(pp)));
  check('… couverture : 25 couvertes, 2 en partie', Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'couverte').length === 25 && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'partielle').length === 2);
  const lp = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '8.1.4');
  check('… registre partiel pour ce compte : « Non calculé »', lp.etat === 'partiel');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
