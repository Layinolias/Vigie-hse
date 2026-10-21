// Gestion des changements (ISO 45001 § 8.1.3, 2026-10-15) : changement, risques et mesures au Plan d'actions, validation,
// mise en œuvre, revue et effets imprévus, points d'attention, fiche, export, revue de direction, droits et règles serveur.
//   RACINE=<dossier> node test-changements.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const REP = { user:'REP1', role:'ag', email:'REP1', services:['*'], profils:['p-representant'] };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_changements';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès et menu ----------
  for (const [nom, S, ouvert, gere] of [['RH', RH, true, true], ['administrateur', ADMIN, true, true], ['manager', MAN, true, false], ['préventeur', PREV, true, true], ['agent', AG, false, false], ['représentant', REP, true, false]]){
    const p = await H.page('changements.html', S, {});
    check(`accès ${nom} : ${ouvert ? 'page ouverte' : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length, { nav: p.navigation(), err: p.erreurs });
    if (ouvert) check(`… ${nom} : bouton « Nouveau changement » ${gere ? 'présent' : 'absent (lecture seule)'}`, !!p.$('btnNouveau') === gere);
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Gestion des changements » ${ouvert ? 'présent' : 'absent'}`, !!d.d.querySelector('a[href="changements.html"]') === ouvert);
  }

  // ---------- 2. Liste vide, création, validations ----------
  let p = await H.page('changements.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui(), an = Number(ajd.slice(0, 4));
  const futur = (an + 1) + '-03-01';
  check('liste vide : message, compteurs à 0, filtres remplis', /Aucun changement pour le moment/.test(p.$('tbody').textContent) && ['kpiEnCours', 'kpiMesures', 'kpiRevues', 'kpiDuerp'].every(k => p.$(k).textContent === '0') && p.$('fNature').options.length === 8 && p.$('fEtat').options.length === 7);
  check('pied de page : rien d\'imposé, question 29, F3SCT (collectivité)', /question 29/.test(p.d.querySelector('.footnote').textContent) && /F3SCT/.test(p.d.querySelector('.footnote').textContent));
  p.$('btnNouveau').click();
  check('nouveau changement : aucun risque, aucun effet imprévu, consultation de la F3SCT', /Aucun risque décrit/.test(p.$('cRisques').textContent) && /Aucun effet imprévu/.test(p.$('cImprevus').textContent) && /Consultation de la F3SCT/.test(p.$('fiche').textContent) && !p.$('btnAbandonner') && !p.$('btnSupprimer'));
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) { if (typeof v === 'boolean') p.$(k).checked = v; else p.$(k).value = v; } };
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  const ajoutRisque = (imp) => p.d.querySelector(`[data-ajout-risque="${imp ? 1 : 0}"]`).click();
  const blocs = () => [...p.d.querySelectorAll('#fiche .constat[data-i]')];
  soumettre();
  check('validation : le changement', /Indiquez le changement/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cTitre: 'Nouvelle balayeuse de voirie' });
  soumettre();
  check('validation : date de mise en œuvre prévue', /mise en œuvre prévue/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cPrevue: futur, cNature: 'Équipement, machine, véhicule', cService: V, cResponsable: 'Chef du service Voirie', cConcernes: 'Les 6 conducteurs', cDescription: 'Remplacement de la balayeuse.\nCabine fermée.', cDuerp: true });
  ajoutRisque(false);
  p.d.querySelector('[data-ajout-action="0"]').click();
  let r0 = blocs()[0];
  r0.querySelector('[data-a="description"]').value = 'Formation à la conduite';
  soumettre();
  check('validation : un risque qui porte une mesure se décrit', /Décrivez chaque risque/.test(p.alertes.pop() || '') && !p.lire(CLE));
  r0 = blocs()[0];
  r0.querySelector('[data-k="texte"]').value = 'Bruit et vibrations de la nouvelle machine';
  p.d.querySelector('[data-ajout-action="0"]').click();
  r0 = blocs()[0];
  const lignes = r0.querySelectorAll('.dyn-row[data-j]');
  lignes[0].querySelector('[data-a="responsable"]').value = 'Préventeur';
  lignes[0].querySelector('[data-a="echeance"]').value = an + '-12-31';
  lignes[1].querySelector('[data-a="description"]').value = 'Mesure de bruit à la réception';
  remplir({ cConsulte: '2099-01-01' });
  soumettre();
  check('validation : consultation dans le futur', /consultation ne peut pas être dans le futur/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cConsulte: ajd, cAvis: 'Avis favorable, sous réserve de la formation.' });
  soumettre();
  let l = p.lire(CLE) || [], x = l[0] || {};
  check('création : champs enregistrés, deux mesures, Document unique à mettre à jour, consultation, auteur', l.length === 1 && x.titre === 'Nouvelle balayeuse de voirie' && x.nature === 'Équipement, machine, véhicule' && x.service === V && x.datePrevue === futur && x.risques.length === 1 && x.risques[0].actions.length === 2 && !x.risques[0].imprevu && x.duerp === true && !('duerpLe' in x) && x.consulteLe === ajd && /favorable/.test(x.avis) && x.auteur === 'PREV1' && !('valideLe' in x) && !('dateMiseEnOeuvre' in x) && /^chg-/.test(x.id), x);
  check('… liste : à l\'étude, mise en œuvre prévue, 0 / 2 mesures, points d\'attention', /À l'étude/.test(p.$('tbody').textContent) && /prévue/.test(p.$('tbody').textContent) && /0 \/ 2/.test(p.$('tbody').textContent) && /2 mesures pas faites/.test(p.$('tbody').textContent) && /Document unique à mettre à jour/.test(p.$('tbody').textContent), p.$('tbody').textContent);
  check('… compteurs : 1 en cours, 2 mesures, 0 revue, 1 Document unique', p.$('kpiEnCours').textContent === '1' && p.$('kpiMesures').textContent === '2' && p.$('kpiRevues').textContent === '0' && p.$('kpiDuerp').textContent === '1');
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Gestion des changements' && a.type === 'Création' && /2 mesure/.test(a.description)));
  check('… la fiche reste ouverte, abandon et suppression proposés', H.visible(p.$('fiche')) && !!p.$('btnAbandonner') && !!p.$('btnSupprimer'));

  // ---------- 3. Plan d'actions ----------
  const stockA = p.stockage();
  const pa = await H.page('plan-actions.html', RH, stockA);
  const m0 = x.risques[0].actions[0], m1 = x.risques[0].actions[1];
  const actPA = (pa.lire('vigie_hse_actions') || []).find(a => a.id === 'pa-chg-' + x.id + '-' + m0.id) || {};
  check('Plan d\'actions : mesure reprise (origine « Changement », titre, service, entrée, risque lié, priorité, échéance)', actPA.origine === 'Changement' && actPA.titre === 'Changement : Nouvelle balayeuse de voirie' && actPA.service === V && actPA.collectivite === 'Ville' && actPA.risqueLie === 'Bruit et vibrations de la nouvelle machine' && actPA.priorite === 'Moyenne' && actPA.echeance === an + '-12-31' && actPA.responsable === 'Préventeur' && !pa.erreurs.length, [actPA, pa.erreurs]);
  check('… les deux mesures, avec leur pastille d\'origine', (pa.lire('vigie_hse_actions') || []).filter(a => a.origine === 'Changement').length === 2 && !!pa.d.querySelector('.origine-chip.changement'));
  const paMan = await H.page('plan-actions.html', MAN, stockA);
  check('… visible du manager de ce service', /Changement : Nouvelle balayeuse/.test(paMan.d.querySelector('tbody').textContent) && !paMan.erreurs.length, paMan.erreurs);
  const actions = pa.lire('vigie_hse_actions').map(a => a.id === actPA.id ? Object.assign({}, a, { statut: 'Fait' }) : a);
  const stockB = Object.assign({}, pa.stockage(), { vigie_hse_actions: J(actions) });
  p = await H.page('changements.html', PREV, stockB);
  check('mesure faite au Plan d\'actions : 1 / 2, 1 mesure pas faite', /1 \/ 2/.test(p.$('tbody').textContent) && p.$('kpiMesures').textContent === '1' && /1 mesure pas faite/.test(p.$('tbody').textContent));
  p.$('tbody').querySelector('[data-ouvrir]').click();
  const fixes = p.d.querySelectorAll('#cRisques .dyn-row[data-fixe]');
  check('… dans la fiche, les mesures reprises se suivent au Plan d\'actions (état, lien)', fixes.length === 2 && /Fait/.test(fixes[0].textContent + fixes[1].textContent) && !!p.d.querySelector('#cRisques a[href="plan-actions.html"]'));

  // ---------- 4. Validation et mise en œuvre ----------
  remplir({ cValide: ajd });
  soumettre();
  check('validation : qui a validé', /qui a validé/.test(p.alertes.pop() || ''));
  remplir({ cValidePar: 'Directeur des services techniques', cMiseEnOeuvre: '2020-01-01' });
  soumettre();
  check('validation : la mise en œuvre ne précède pas la validation', /ne peut pas précéder la validation/.test(p.alertes.pop() || ''));
  remplir({ cMiseEnOeuvre: '' });
  let confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return false; };
  soumettre();
  check('valider avec une mesure pas faite : confirmation demandée ; refusée, rien d\'enregistré', /1 mesure prévue avant la mise en œuvre n'est pas faite/.test(confirmes[0] || '') && !(p.lire(CLE)[0] || {}).valideLe, confirmes);
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  soumettre();
  x = p.lire(CLE)[0];
  check('… acceptée : validé (date, par qui), état « Validé, à mettre en œuvre »', x.valideLe === ajd && x.validePar === 'Directeur des services techniques' && /Validé, à mettre en œuvre/.test(p.$('tbody').textContent));
  confirmes = [];
  soumettre();
  check('… une nouvelle modification ne redemande pas', !confirmes.length);
  ajoutRisque(true);
  blocs().find(b => b.closest('#cImprevus')).querySelector('[data-k="texte"]').value = 'Poussière à la vidange';
  soumettre();
  check('validation : un effet imprévu suit la mise en œuvre', /se relève après la mise en œuvre/.test(p.alertes.pop() || ''));
  remplir({ cRevue: ajd });
  soumettre();
  check('validation : la revue suit la mise en œuvre', /La revue suit la mise en œuvre/.test(p.alertes.pop() || ''));
  remplir({ cRevue: '', cMiseEnOeuvre: ajd });
  soumettre();
  x = p.lire(CLE)[0];
  const imp = x.risques.find(r => r.imprevu) || {};
  check('mise en œuvre : enregistrée, effet imprévu gardé, état « revue à faire »', x.dateMiseEnOeuvre === ajd && imp.texte === 'Poussière à la vidange' && /Mis en œuvre, revue à faire/.test(p.$('tbody').textContent) && p.$('kpiRevues').textContent === '1' && p.$('kpiEnCours').textContent === '0');
  check('… points d\'attention : mesure pas faite (mis en œuvre), effet imprévu sans action', /1 mesure pas faite \(changement mis en œuvre\)/.test(p.$('tbody').textContent) && /1 effet imprévu sans action/.test(p.$('tbody').textContent));
  check('… dans la fiche : alerte sur l\'effet imprévu ; abandon plus proposé', /Effet imprévu sans action/.test(p.$('cImprevus').textContent) && !p.$('btnAbandonner'));

  // ---------- 5. Revue après mise en œuvre ----------
  remplir({ cRevue: ajd });
  soumettre();
  check('validation : constat de la revue', /constat de la revue/.test(p.alertes.pop() || ''));
  const bImp = blocs().find(b => b.closest('#cImprevus'));
  bImp.querySelector('[data-ajout-action]').click();
  blocs().find(b => b.closest('#cImprevus')).querySelector('[data-a="description"]').value = 'Aspiration à la vidange';
  remplir({ cRevue: ajd, cRevuePar: 'Préventeur', cRevueConstat: 'Bruit maîtrisé ; poussière non prévue.', cDuerpLe: ajd });
  soumettre();
  x = p.lire(CLE)[0];
  check('revue : enregistrée, état « Revu », plus de revue à faire', x.revueLe === ajd && x.revuePar === 'Préventeur' && /Revu/.test(p.$('tbody').textContent) && p.$('kpiRevues').textContent === '0', x);
  check('… Document unique mis à jour : plus de point d\'attention, compteur à 0', x.duerpLe === ajd && p.$('kpiDuerp').textContent === '0' && !/Document unique à mettre à jour/.test(p.$('tbody').textContent));
  check('… revu : ses mesures ne comptent plus parmi celles pas faites', p.$('kpiMesures').textContent === '0');
  const stockC = p.stockage();
  const pa2 = await H.page('plan-actions.html', RH, stockC);
  const actImp = (pa2.lire('vigie_hse_actions') || []).find(a => a.titre === 'Changement : Nouvelle balayeuse de voirie — effet imprévu') || {};
  check('Plan d\'actions : l\'action de l\'effet imprévu, priorité haute', actImp.description === 'Aspiration à la vidange' && actImp.priorite === 'Haute' && actImp.risqueLie === 'Poussière à la vidange');

  // ---------- 6. Mise en œuvre sans validation, abandon, rétablir, supprimer ----------
  p = await H.page('changements.html', PREV, Object.assign({}, pa2.stockage(), { [CLE]: J(pa2.lire(CLE).concat([
    { id:'chg-reorg', titre:'Regroupement des ateliers', nature:'Organisation du travail', service: P, datePrevue: an - 1 + '-06-01', risques:[] },
    { id:'chg-xss', titre:'<img src=x onerror=alert(1)>', nature:'Autre', datePrevue: futur, risques:[{ id:'r1', texte:'<b>gras</b>', actions:[] }] }])) }));
  const ligne = (t) => [...p.d.querySelectorAll('#tbody tr')].find(tr => tr.textContent.includes(t));
  check('date prévue passée sans mise en œuvre : « Mise en œuvre prévue dépassée »', /Mise en œuvre prévue dépassée/.test(ligne('Regroupement').textContent));
  check('échappement : titre et risque affichés en texte', !p.d.querySelector('#tbody img') && /<img src=x/.test(p.$('tbody').textContent));
  ligne('<img').querySelector('[data-ouvrir]').click();
  check('… dans la fiche aussi', !p.d.querySelector('#fiche img') && !p.d.querySelector('#fiche .constat b') && p.d.querySelector('#cRisques [data-k="texte"]').value === '<b>gras</b>');
  ligne('Regroupement').querySelector('[data-ouvrir]').click();
  confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  remplir({ cMiseEnOeuvre: ajd });
  soumettre();
  let ro = p.lire(CLE).find(c => c.id === 'chg-reorg');
  check('mise en œuvre sans validation : confirmation, puis point d\'attention', /n'a pas été validé/.test(confirmes[0] || '') && ro.dateMiseEnOeuvre === ajd && /Mis en œuvre sans validation/.test(ligne('Regroupement').textContent), confirmes);
  remplir({ cMiseEnOeuvre: '' });
  soumettre();
  ro = p.lire(CLE).find(c => c.id === 'chg-reorg');
  check('… date effacée : champ retiré de l\'enregistrement', !('dateMiseEnOeuvre' in ro));
  p.w.prompt = () => '   ';
  p.$('btnAbandonner').click();
  check('abandon : motif obligatoire', /motif de l'abandon/.test(p.alertes.pop() || '') && !p.lire(CLE).find(c => c.id === 'chg-reorg').annule);
  p.w.prompt = () => 'Projet reporté sine die';
  p.$('btnAbandonner').click();
  ro = p.lire(CLE).find(c => c.id === 'chg-reorg');
  check('abandon : marqué abandonné (motif, date, par qui), fiche figée, « Rétablir »', ro.annule && ro.motifAnnulation === 'Projet reporté sine die' && ro.annuleLe === ajd && ro.annulePar === 'PREV1' && p.$('cTitre').disabled && !!p.$('btnRetablir') && /Abandonné/.test(ligne('Regroupement').textContent));
  check('… hors compteurs', p.$('kpiEnCours').textContent === '1');
  p.$('btnRetablir').click();
  ro = p.lire(CLE).find(c => c.id === 'chg-reorg');
  check('rétablir : plus abandonné, motif effacé', !ro.annule && !('motifAnnulation' in ro) && !!p.d.querySelector('#fiche [type="submit"]'));
  p.$('btnSupprimer').click();
  check('supprimer : le changement disparaît', !p.lire(CLE).find(c => c.id === 'chg-reorg') && !ligne('Regroupement') && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Gestion des changements' && a.type === 'Suppression'));

  // ---------- 7. Filtres ----------
  p.choisir('fEtat', 'clos');
  check('filtre état : revus seulement', !!ligne('balayeuse') && !ligne('<img'));
  p.choisir('fEtat', '');
  p.choisir('fNature', 'Autre');
  check('filtre nature', !ligne('balayeuse') && !!ligne('<img'));
  p.choisir('fNature', '');
  p.$('fTexte').value = 'aspiration';
  p.ev(p.$('fTexte'), 'input');
  check('recherche : jusque dans les actions', !!ligne('balayeuse') && !ligne('<img'));
  p.$('fTexte').value = '';
  p.ev(p.$('fTexte'), 'input');

  // ---------- 8. Fiche imprimée, export ----------
  let imprime = null;
  p.w.print = () => { imprime = p.d.getElementById('chg-impression') ? p.d.getElementById('chg-impression').textContent : ''; };
  ligne('balayeuse').querySelector('[data-ouvrir]').click();
  p.$('btnFicheImpr').click();
  check('fiche imprimée : changement, risques et mesures avec leur état, Document unique, consultation, validation, revue, effet imprévu, signatures', /Fiche de changement/.test(imprime || '') && /Bruit et vibrations/.test(imprime) && /Formation à la conduite/.test(imprime) && /Fait/.test(imprime) && /mis à jour le/.test(imprime) && /Consultation de la F3SCT/.test(imprime) && /Directeur des services techniques/.test(imprime) && /Poussière à la vidange/.test(imprime) && /Le responsable du changement/.test(imprime), (imprime || '').slice(0, 300));
  check('… la marque, jamais le nom du produit en dur', imprime.includes(p.w.VigieMarque.nom()));
  p.ev(p.w, 'afterprint');
  check('… bloc retiré après impression', !p.d.getElementById('chg-impression'));
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const feuille = (n) => wb ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval:'' }) : [];
  check('export : trois feuilles', wb && J(wb.SheetNames) === J(['Changements', 'Risques et effets', 'Actions']), wb && wb.SheetNames);
  const fc = feuille('Changements').find(r => /balayeuse/.test(r['Changement'])) || {};
  check('… Changements : nature, périmètre, dates, état, Document unique', fc['Nature'] === 'Équipement, machine, véhicule' && fc['Périmètre'] === V && fc['État'] === 'Revu' && fc['Document unique à mettre à jour'] === 'Oui' && fc['Validé par'] === 'Directeur des services techniques' && /favorable/.test(fc['Avis']), fc);
  check('… Risques et effets (type), Actions (état du Plan d\'actions)', feuille('Risques et effets').some(r => r['Type'] === 'Effet imprévu' && r['Actions'] === 1) && feuille('Actions').some(r => r['Type'] === 'Risque' && r['État au Plan d\'actions'] === 'Fait') && feuille('Actions').length === 3);
  check('impression de la liste : bouton branché à côté de l\'export', /Imprimer/.test(p.$('listeActions').textContent));

  // ---------- 9. Secteur entreprise ----------
  const stockD = Object.assign({}, p.stockage(), { [CLE]: J(p.lire(CLE).concat([{ id:'chg-pat', titre:'Travaux de la mairie annexe', nature:'Locaux, aménagement', datePrevue: futur, service: P, risques:[] }])) });
  const pe = await H.page('changements.html', RH, Object.assign({}, stockD, { vigie_hse_referentials: J({ organisation: { secteur:'entreprise' } }) }), '?ouvrir=' + x.id);
  check('secteur entreprise : CSSCT dans la fiche et le pied de page', /Consultation de la CSSCT/.test(pe.$('fiche').textContent) && /CSSCT/.test(pe.d.querySelector('.footnote').textContent) && !/F3SCT/.test(pe.$('fiche').textContent));

  // ---------- 10. Lecture seule, périmètre ----------
  p = await H.page('changements.html', MAN, stockD);
  check('manager (Voirie) : son service et l\'organisation, pas un autre service', !!ligne('balayeuse') && !ligne('mairie annexe') && !!ligne('<img') && !p.erreurs.length);
  ligne('balayeuse').querySelector('[data-ouvrir]').click();
  check('… lecture seule : fiche figée, risques en texte, ni ajout ni enregistrement ; fiche imprimable', p.$('cTitre').disabled && !p.d.querySelector('[data-ajout-risque]') && !p.d.querySelector('#fiche [data-k]') && !p.d.querySelector('#fiche [type="submit"]') && !p.$('btnSupprimer') && !!p.$('btnFicheImpr'));
  p = await H.page('changements.html', MAN, stockD, '?ouvrir=chg-pat');
  check('… ?ouvrir= sur un changement hors de ses services : rien d\'ouvert', !H.visible(p.$('fiche')));
  p = await H.page('changements.html', RH, stockD, '?ouvrir=chg-pat');
  check('?ouvrir= ouvre le changement', H.visible(p.$('fiche')) && p.$('cTitre').value === 'Travaux de la mairie annexe');

  // ---------- 11. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, stockD);
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : changements de la période dans « Changements du contexte »', /Changements de la période/.test(txt) && /Nouvelle balayeuse de voirie/.test(txt) && /mis en œuvre/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 200) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const gc = revue.chiffres && revue.chiffres.gestionChangements;
  check('… photographié avec la revue', gc && gc.misEnOeuvre === 1 && gc.clos === 1 && gc.imprevus === 1 && gc.liste.some(z => z.titre === 'Nouvelle balayeuse de voirie' && z.misEnOeuvre), gc);
  check('… revue antérieure : rien ; données partielles : non repris, et dit', rd.w.changementsDeLaRevue({}) === '' && (rd.w.VigieStore.complet = () => false, rd.w.changementsDuJour('2026-01-01', '2026-12-31') === null) && /Non repris/.test(rd.w.changementsDeLaRevue({ gestionChangements: null })));

  // ---------- 12. Logique partagée ----------
  const VC = p.w.VigieChangements;
  const e = (c, j) => VC.etat(c, j || '2026-06-01').code;
  check('etat : abandonné, revu, revue à faire, date dépassée, validé, à l\'étude', e({ annule:true, revueLe:'2026-01-01' }) === 'abandonne' && e({ revueLe:'2026-05-01', dateMiseEnOeuvre:'2026-04-01' }) === 'clos' && e({ dateMiseEnOeuvre:'2026-04-01' }) === 'arevoir' && e({ datePrevue:'2026-05-01', valideLe:'2026-04-01' }) === 'depasse' && e({ datePrevue:'2026-07-01', valideLe:'2026-04-01' }) === 'valide' && e({ datePrevue:'2026-07-01' }) === 'etude' && e({}) === 'etude');
  const al = VC.alertes({ id:'c', dateMiseEnOeuvre:'2026-04-01', duerp:true, risques:[{ id:'r', texte:'x', actions:[{ id:'a', description:'m' }] }, { id:'i', imprevu:true, texte:'y', actions:[] }, { id:'v', imprevu:true, texte:'', actions:[] }] }, []).map(a => a.code);
  check('alertes : mesure pas faite, sans validation, Document unique, effet imprévu sans action (vide ignoré) ; rien si abandonné', J(al) === J(['mesures', 'sansValidation', 'duerp', 'imprevu']) && VC.alertes({ annule:true, duerp:true }, []).length === 0, al);
  const s = VC.synthese([{ id:'a', datePrevue:'2026-07-01', risques:[{ texte:'x', actions:[{ id:'1', description:'m' }] }] }, { id:'b', annule:true }, null, 'x', { id:'c', dateMiseEnOeuvre:'2026-04-01', revueLe:'2026-05-01', risques:[{ texte:'x', actions:[{ id:'2', description:'m' }] }] }], [], '2026-06-01');
  check('synthese : abandonnés et entrées invalides ignorés, mesures des changements revus non comptées', s.changements === 2 && s.abandonnes === 1 && s.etude === 1 && s.clos === 1 && s.enCours === 1 && s.mesuresEnAttente === 1, s);
  const pp = VC.pourPeriode([{ id:'a', datePrevue:'2025-12-01', dateMiseEnOeuvre:'2026-01-10' }, { id:'b', datePrevue:'2026-03-01' }, { id:'c', datePrevue:'2026-02-01', annule:true }, { id:'d', datePrevue:'2025-06-01' }], [], '2026-01-01', '2026-06-30', '2026-04-01');
  check('pourPeriode : à la date de mise en œuvre réelle, sinon prévue ; abandonnés exclus', pp.changements === 2 && pp.misEnOeuvre === 1 && pp.liste.length === 2 && pp.liste[0].misEnOeuvre === true, pp);
  check('idAction, mesures d\'un changement (hors effets imprévus)', VC.idAction({ id:'c' }, { id:'a' }) === 'pa-chg-c-a' && VC.mesures({ risques:[{ actions:[{ description:'m' }, { description:' ' }] }, { imprevu:true, actions:[{ description:'n' }] }] }).length === 1);

  // ---------- 13. Droits, serveur, registre, libellés ----------
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const W = p.w;
  const defs = W.VigieDroits.MODULES ? W.VigieDroits.MODULES.find(m => m.id === 'changements') : null;
  const res = (S) => W.VigieDroits.pour(S);
  check('catalogue : module « changements » (Sécurité & Risques) ; Administrateur, RH et Préventeur gèrent, Manager consulte, Représentant consulte, Agent sans accès', (!W.VigieDroits.MODULES || (defs && defs.section === 'Sécurité & Risques')) && res(ADMIN).peut('changements', 'gerer') && res(RH).peut('changements', 'gerer') && res(PREV).peut('changements', 'gerer') && res(MAN).peut('changements', 'consulter') && !res(MAN).peut('changements', 'gerer') && !res(AG).peut('changements', 'consulter') && res(REP).peut('changements', 'consulter') && !res(REP).peut('changements', 'gerer'));
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  const niv = (pr) => Droits.niveau(sess(pr), CLE);
  check('serveur, écriture : RH, Administrateur et Préventeur complet, manager aucun', niv(['p-rh']) === 'complet' && niv(['p-preventeur']) === 'complet' && niv(['p-manager']) === 'aucun' && niv(['p-admin']) === 'complet', [niv(['p-rh']), niv(['p-preventeur']), niv(['p-manager'])]);
  check('serveur : règle explicite pour la clé', Droits.cles.includes(CLE));
  const pageDe = (profils) => Object.assign(sess(profils), { droits: undefined });
  const vueAgent = JSON.parse(Lecture.vue(pageDe(['p-agent']), CLE, stockD[CLE]));
  const cles = vueAgent.map(r => Object.keys(r).sort().join(','));
  check('serveur, lecture : un agent ne reçoit que identifiant, titre, service, risques (pour ses actions) ; RH et manager tout', vueAgent.length && cles.every(c => /^id,(risques,)?(service,)?titre$/.test(c)) && !vueAgent.some(r => 'avis' in r || 'description' in r || 'validePar' in r) && Lecture.regle(pageDe(['p-rh']), CLE) === null && Lecture.regle(pageDe(['p-manager']), CLE) === null, cles);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : mise en œuvre et Document unique', W.VigieLibelles.libelle(CLE, 'dateMiseEnOeuvre') === 'Mis en œuvre le' && W.VigieLibelles.libelle(CLE, 'duerp') === 'Document unique à mettre à jour');
  check('icône du menu : i-repeat', !!W.VigieIcones && !!W.VigieIcones.ICONES['i-repeat']);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
