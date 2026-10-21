// Politique de santé et de sécurité (ISO 45001 § 5.2, 2026-10-15) : rédaction, mise en vigueur, versions, revues,
// communication, prises de connaissance, rappel au tableau de bord, impression, export, revue de direction, droits et serveur.
//   RACINE=<dossier> node test-politique.js
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
const SANS = { user:'X1', services:['*'], droits:{ atmp:'consulter' } };
const CLE = 'vigie_hse_politiques', CLE_L = 'vigie_hse_politique_lectures';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès et menu ----------
  for (const [nom, S, gere] of [['RH', RH, true], ['administrateur', ADMIN, true], ['préventeur', PREV, true], ['manager', MAN, false], ['agent', AG, false], ['représentant', REP, false]]){
    const p = await H.page('politique-sante-securite.html', S, {});
    check(`accès ${nom} : page ouverte, ${gere ? 'rédaction proposée' : 'lecture seule'}`, !p.navigation() && !p.erreurs.length && !!p.$('btnNouvelle') === gere && H.visible(p.$('brouillon')) === gere && !!p.$('btnExport') === gere, { nav: p.navigation(), err: p.erreurs });
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Politique santé-sécurité » présent`, !!d.d.querySelector('a[href="politique-sante-securite.html"]') && !d.erreurs.length, d.erreurs);
  }
  let p = await H.page('politique-sante-securite.html', SANS, {});
  check('compte sans le droit : renvoyé au tableau de bord, pas de lien', p.navigation());
  const dSans = await H.page('dashboard.html', SANS, {});
  check('… ni lien au menu', !dSans.d.querySelector('a[href="politique-sante-securite.html"]'));

  // ---------- 2. Première version : brouillon, validations, mise en vigueur ----------
  p = await H.page('politique-sante-securite.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui();
  check('aucune politique : dit, compteurs à « — »', /Aucune politique de santé et de sécurité n'est en vigueur/.test(p.$('vigueur').textContent) && p.$('kpiVersion').textContent === '—' && /Rédiger la politique/.test(p.$('brouillon').textContent));
  p.$('btnNouvelle').click();
  let l = p.lire(CLE) || [];
  check('« Rédiger la politique » : un brouillon vide, rappel demandé par défaut', l.length === 1 && l[0].statut === 'Brouillon' && l[0].texte === '' && l[0].auteur === 'PREV1' && !!p.$('dTexte') && p.$('dDemander').checked && /Brouillon de la version 1/.test(p.$('brouillon').textContent), l);
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) p.$(k).value = v; };
  p.$('btnPublier').click();
  check('validation : texte', /texte/.test(p.alertes.pop() || '') && p.lire(CLE)[0].statut === 'Brouillon');
  remplir({ dTexte: "La Ville s'engage à offrir à chacun des conditions de travail sûres.\nElle associe les représentants du personnel." });
  p.$('btnPublier').click();
  check('validation : signataire', /qui signe/.test(p.alertes.pop() || ''));
  remplir({ dSignataire: 'Mme Dupont', dFonction: 'Maire' });
  p.$('btnPublier').click();
  check('validation : date de signature', /date de signature/.test(p.alertes.pop() || ''));
  remplir({ dSignature: '2099-01-01' });
  p.$('btnPublier').click();
  check('validation : signature dans le futur', /futur/.test(p.alertes.pop() || ''));
  remplir({ dSignature: ajd, dRevue: ajd });
  p.$('btnPublier').click();
  check('validation : prochaine revue après la signature', /après la date de signature/.test(p.alertes.pop() || ''));
  remplir({ dRevue: (Number(ajd.slice(0, 4)) + 1) + ajd.slice(4) });
  ['conditions', 'participation'].forEach(k => { p.d.querySelector(`[data-engagement="${k}"]`).checked = true; });
  let confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return false; };
  p.$('btnPublier').click();
  check('engagements manquants : la liste est montrée, et on peut renoncer', /ne couvre pas 5 des 7/.test(confirmes[0] || '') && /Respecter les exigences légales/.test(confirmes[0]) && p.lire(CLE)[0].statut === 'Brouillon', confirmes);
  confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  p.$('btnPublier').click();
  l = p.lire(CLE); let v1 = l[0];
  check('mise en vigueur : version 1, date, auteur, champs repris du formulaire', v1.statut === 'En vigueur' && v1.version === 1 && v1.publieLe === ajd && v1.publiePar === 'PREV1' && v1.signataire === 'Mme Dupont' && v1.fonction === 'Maire' && v1.dateSignature === ajd && J(v1.engagements) === J(['conditions', 'participation']) && v1.demanderLecture === true && /Elle sera visible de tous/.test(confirmes[1] || ''), { v1, confirmes });
  check('… affichée en vigueur : texte, signature, compteurs, engagements (5 non couverts)', /Politique en vigueur — version 1/.test(p.$('vigueur').textContent) && /conditions de travail sûres/.test(p.$('vigueur').querySelector('.texte-politique').textContent) && /Fait le .* — Mme Dupont, Maire/.test(p.$('vigueur').textContent) && p.$('kpiVersion').textContent === '1' && /5 non couvert/.test(p.$('vigueur').textContent) && p.d.querySelectorAll('#vigueur .engagements li.oui').length === 2);
  check('… plus de brouillon : « Préparer une nouvelle version » ; suivi ouvert ; historique', /Préparer une nouvelle version/.test(p.$('brouillon').textContent) && H.visible(p.$('suivi')) && p.d.querySelectorAll('#tbodyVersions tr').length === 1 && /Version 1/.test(p.$('tbodyVersions').textContent));
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Politique santé-sécurité' && /version 1 mise en vigueur/.test(a.description)));

  // ---------- 3. Prise de connaissance ----------
  p.$('btnLu').click();
  let lus = p.lire(CLE_L) || [];
  check('« J\'en ai pris connaissance » : enregistrée à son nom, pour cette version', lus.length === 1 && lus[0].auteur === 'PREV1' && lus[0].versionId === v1.id && lus[0].id === 'lu-' + v1.id + '-PREV1' && !!lus[0].le && /Vous en avez pris connaissance le/.test(p.$('maLecture').textContent) && !p.$('btnLu'));
  check('… comptée au suivi et au compteur', p.$('kpiLectures').textContent === '1' && /1<\/b> compte\(s\) en ont pris connaissance/.test(p.$('suivi').innerHTML));
  const stockA = p.stockage();
  let d = await H.page('dashboard.html', AG, stockA);
  check('tableau de bord de l\'agent : rappel à lire, lien vers la page', H.visible(d.$('politiqueRappel')) && /version 1/.test(d.$('politiqueRappel').textContent) && !!d.$('politiqueRappel').querySelector('a[href="politique-sante-securite.html"]') && !d.erreurs.length, d.erreurs);
  d = await H.page('dashboard.html', PREV, stockA);
  check('… plus de rappel pour qui l\'a lue', !H.visible(d.$('politiqueRappel')));
  p = await H.page('politique-sante-securite.html', AG, stockA);
  check('agent : le texte, sans brouillon, suivi, engagements ni export ; « À lire »', /conditions de travail sûres/.test(p.$('vigueur').textContent) && !H.visible(p.$('brouillon')) && !H.visible(p.$('suivi')) && !p.d.querySelector('#vigueur .engagements') && !p.$('btnExport') && p.$('kpiLectures').textContent === 'À lire' && p.d.querySelectorAll('#theadVersions th').length === 7);
  p.$('btnLu').click();
  check('… il confirme sa lecture', (p.lire(CLE_L) || []).some(x => x.auteur === 'AG1' && x.versionId === v1.id) && p.$('kpiLectures').textContent === 'Lue');
  d = await H.page('dashboard.html', AG, p.stockage());
  check('… et le rappel disparaît', !H.visible(d.$('politiqueRappel')));
  const sansRappel = JSON.parse(stockA[CLE]).map(x => Object.assign({}, x, { demanderLecture: false }));
  d = await H.page('dashboard.html', AG, Object.assign({}, stockA, { [CLE]: J(sansRappel) }));
  check('rappel non demandé pour la version : rien au tableau de bord', !H.visible(d.$('politiqueRappel')));

  // ---------- 4. Revues, communication, comptes ----------
  const users = [{ username:'RH1', email:'RH1', profils:['p-rh'], active:true }, { username:'AG1', email:'AG1', profils:['p-agent'], active:true }, { username:'AG2', email:'AG2', profils:['p-agent'], active:true },
    { username:'OLD', email:'OLD', profils:['p-agent'], active:false }, { username:'X2', email:'X2', profils:[], active:true }, { username:'PREV1', email:'PREV1', profils:['p-agent', 'p-preventeur'], active:true }];
  p = await H.page('politique-sante-securite.html', PREV, Object.assign(p.stockage(), { vigie_hse_users: J(users) }));
  check('comptes : « sur 4 » (actifs, que leurs profils ouvrent à la politique) ; pas encore : AG2 et RH1', /sur 4 comptes/.test(p.$('kpiLecturesLabel').textContent) && /2<\/b> compte\(s\) pas encore/.test(p.$('suivi').innerHTML) && /AG2/.test(p.$('suivi').textContent) && !/OLD|X2/.test(p.$('suivi').textContent), p.$('kpiLecturesLabel').textContent);
  p.$('btnComm').click();
  check('validation communication : moyen exigé', /moyen/.test(p.alertes.pop() || ''));
  p.$('cMoyen').value = 'Affichage'; p.$('cDestinataires').value = 'Tous les services'; p.$('cDate').value = '2099-01-01';
  p.$('btnComm').click();
  check('validation communication : pas dans le futur', /futur/.test(p.alertes.pop() || ''));
  p.$('cMoyen').value = 'Affichage'; p.$('cDestinataires').value = 'Tous les services'; p.$('cDate').value = ajd;
  p.$('btnComm').click();
  v1 = p.lire(CLE)[0];
  check('communication ajoutée : date, moyen, destinataires, par ; compteur', (v1.communications || []).length === 1 && v1.communications[0].moyen === 'Affichage' && v1.communications[0].destinataires === 'Tous les services' && v1.communications[0].par === 'PREV1' && p.$('kpiComm').textContent === '1' && /Affichage/.test(p.$('suivi').textContent));
  p.d.querySelector('[data-retirer-comm]').click();
  check('… et retirée', J(p.lire(CLE)[0].communications) === '[]' && p.$('kpiComm').textContent === '0');
  p.$('cMoyen').value = 'Réunion'; p.$('cDate').value = ajd; p.$('btnComm').click();
  p.$('rDate').value = '2099-01-01'; p.$('btnRevue').click();
  check('validation revue : pas dans le futur', /futur/.test(p.alertes.pop() || ''));
  p.$('rDate').value = ajd; p.$('rProchaine').value = ajd; p.$('btnRevue').click();
  check('validation revue : prochaine revue après celle-ci', /après celle-ci/.test(p.alertes.pop() || ''));
  const dans2ans = (Number(ajd.slice(0, 4)) + 2) + ajd.slice(4);
  p.$('rProchaine').value = dans2ans; p.$('rCommentaire').value = 'Revue avec la F3SCT';
  p.$('btnRevue').click();
  v1 = p.lire(CLE)[0];
  check('revue « Maintenue » : enregistrée, prochaine revue reportée', (v1.revues || []).length === 1 && v1.revues[0].conclusion === 'Maintenue' && v1.revues[0].par === 'PREV1' && v1.prochaineRevue === dans2ans && /dernière revue le .* : Maintenue/.test(p.$('vigueur').textContent) && !p.lire(CLE).some(x => x.statut === 'Brouillon'));
  // une date de revue passée : « À revoir »
  const passee = p.lire(CLE).map(x => Object.assign({}, x, { prochaineRevue: '2020-01-01' }));
  let p2 = await H.page('politique-sante-securite.html', AG, Object.assign(p.stockage(), { [CLE]: J(passee) }));
  check('prochaine revue passée : « À revoir », dit au compteur, même pour l\'agent', /À revoir/.test(p2.$('vigueur').textContent) && /date passée/.test(p2.$('kpiRevueLabel').textContent));
  p.$('rConclusion').value = 'À modifier'; p.$('rProchaine').value = '';
  p.$('btnRevue').click();
  l = p.lire(CLE);
  check('revue « À modifier » : propose une nouvelle version, qui part du texte en vigueur ; sans prochaine revue, la date est retirée', l.length === 2 && l[1].statut === 'Brouillon' && l[1].texte === l[0].texte && l[1].signataire === 'Mme Dupont' && !l[1].dateSignature && !('prochaineRevue' in l[0]) && l[0].revues.length === 2 && !!p.$('dTexte'));

  // ---------- 5. Deuxième version : remplacement ----------
  remplir({ dTexte: 'Version 2 : <img src=x onerror="window.piege=1"> engagements complets.', dSignature: ajd, dFonction: 'Maire de Verchamps' });
  p.d.querySelectorAll('[data-engagement]').forEach(c => { c.checked = true; });
  p.ev(p.$('brouillonForm'), 'submit');
  check('« Enregistrer le brouillon » : gardé, toujours brouillon', p.lire(CLE)[1].statut === 'Brouillon' && /Version 2/.test(p.lire(CLE)[1].texte) && p.lire(CLE)[1].engagements.length === 7);
  confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  p.$('btnPublier').click();
  l = p.lire(CLE); v1 = l[0]; const v2 = l[1];
  check('version 2 en vigueur ; la 1 remplacée ce jour ; confirmation qui le dit', v2.statut === 'En vigueur' && v2.version === 2 && v1.statut === 'Remplacée' && v1.remplaceeLe === ajd && confirmes.length === 1 && /remplacera la version 1/.test(confirmes[0]) && /repartiront de zéro/.test(confirmes[0]), confirmes);
  check('… prises de connaissance à zéro ; historique 2 versions ; échappement', p.$('kpiLectures').textContent === '0' && p.d.querySelectorAll('#tbodyVersions tr').length === 2 && !p.d.querySelector('#vigueur img') && !p.w.piege && /<img/.test(p.$('vigueur').querySelector('.texte-politique').textContent) && /Tous sont couverts/.test(p.$('vigueur').textContent));
  d = await H.page('dashboard.html', AG, p.stockage());
  check('… le rappel revient pour l\'agent qui avait lu la version 1', H.visible(d.$('politiqueRappel')) && /version 2/.test(d.$('politiqueRappel').textContent));
  p.d.querySelector('[data-voir]').click();
  check('« Voir » la version 1 : son texte, remplacée, sa revue', H.visible(p.$('fiche')) && /Version 1 — remplacée/.test(p.$('fiche').textContent) && /conditions de travail sûres/.test(p.$('fiche').textContent) && /À modifier/.test(p.$('fiche').textContent));
  p.$('btnFermer').click();
  check('… et la refermer', !H.visible(p.$('fiche')));
  p.$('btnNouvelle').click();
  p.$('btnSupprimerBrouillon').click();
  check('brouillon supprimé : la version en vigueur reste', p.lire(CLE).length === 2 && !p.lire(CLE).some(x => x.statut === 'Brouillon') && !!p.$('btnNouvelle'));

  // ---------- 6. Impression et export ----------
  let imprime = '';
  p.w.print = () => { imprime = (p.d.getElementById('po-impression') || {}).textContent || ''; };
  p.$('vigueur').querySelector('[data-imprimer]').click();
  check('impression : titre, version, texte, signature, organisation et marque', /Politique de santé et de sécurité au travail/.test(imprime) && /Version 2/.test(imprime) && /engagements complets/.test(imprime) && /Maire de Verchamps/.test(imprime) && imprime.includes(p.w.VigieMarque.nom()) && imprime.includes(p.w.VigieOrga.noms()[0]), imprime.slice(0, 300));
  p.ev(p.w, 'afterprint');
  check('… bloc retiré après impression', !p.d.getElementById('po-impression'));
  p.$('btnNouvelle').click();
  p.$('brouillon').querySelector('[data-imprimer]').click();
  check('… un brouillon s\'imprime « Projet — non en vigueur »', /Projet — non en vigueur/.test(imprime));
  p.$('btnSupprimerBrouillon').click();
  p.$('btnLu').click();
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const feuille = (n) => wb ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval:'' }) : [];
  check('export : quatre feuilles', wb && J(wb.SheetNames) === J(['Versions', 'Revues', 'Communication', 'Prises de connaissance']), wb && wb.SheetNames);
  check('… versions (2, engagements, état), revues (2), communication (1), prises de connaissance (3)', feuille('Versions').length === 2 && feuille('Versions')[0]['Engagements couverts'] === '7 / 7' && feuille('Versions')[1]['État'] === 'Remplacée' && feuille('Revues').length === 2 && feuille('Communication').length === 1 && feuille('Prises de connaissance').length === 3, [feuille('Versions').length, feuille('Revues').length, feuille('Communication').length, feuille('Prises de connaissance')]);

  // ---------- 7. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, p.stockage());
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : la politique dans « Politique et objectifs »', /Politique de santé et de sécurité \(à la date du calcul\)/.test(txt) && /Version 2, signée le/.test(txt) && /engagements attendus couverts/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 200) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const pol = revue.chiffres && revue.chiffres.politique;
  check('… photographiée avec la revue', pol && pol.version === 2 && pol.engagements === 7 && pol.lectures === 1 && pol.communications === 0 && pol.demandee === true, pol);
  check('… revue antérieure : rien ; données partielles : dit ; aucune politique : dit', rd.w.politiqueDeLaRevue({}) === '' && /Non reprise/.test(rd.w.politiqueDeLaRevue({ politique: null })) && /Aucune politique/.test(rd.w.politiqueDeLaRevue({ politique: { aucune: true } })));

  // ---------- 8. Logique partagée ----------
  const VP = p.w.VigiePolitique;
  check('etat : aucune, à jour, à revoir le lendemain de la date', VP.etat(null, '2026-01-01').code === 'aucune' && VP.etat({ prochaineRevue:'2026-01-01' }, '2026-01-01').code === 'a-jour' && VP.etat({ prochaineRevue:'2026-01-01' }, '2026-01-02').code === 'a-revoir' && VP.etat({}, '2030-01-01').code === 'a-jour');
  const ls = [{ versionId:'a', auteur:'X', le:'2026-01-02T10:00:00Z' }, { versionId:'a', auteur:'X', le:'2026-01-01T10:00:00Z' }, { versionId:'a', auteur:'Y', le:'2026-01-03T10:00:00Z' }, { versionId:'b', auteur:'Z' }, null, { versionId:'a' }];
  check('lectures : une par compte (la première), plus récente d\'abord, autres versions et entrées invalides ignorées', J(VP.lectures(ls, 'a').map(x => x.auteur + x.le.slice(8, 10))) === J(['Y03', 'X01']));
  check('aLire : seulement la version en vigueur, si demandée et pas lue', VP.aLire([{ id:'a', statut:'En vigueur', demanderLecture:true }], ls, 'W').id === 'a' && VP.aLire([{ id:'a', statut:'En vigueur', demanderLecture:true }], ls, 'X') === null && VP.aLire([{ id:'a', statut:'En vigueur' }], ls, 'W') === null && VP.aLire([{ id:'a', statut:'Brouillon', demanderLecture:true }], ls, 'W') === null);
  check('prochainNumero et enVigueur', VP.prochainNumero([{ id:'a', version:3 }, { id:'b' }, null]) === 4 && VP.enVigueur([{ id:'a', version:1, statut:'En vigueur' }, { id:'b', version:2, statut:'En vigueur' }]).id === 'b' && VP.pourRevue([], [], '2026-01-01', true).aucune === true);

  // ---------- 9. Droits, serveur, registre, libellés ----------
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const W = p.w;
  const defs = W.VigieDroits.MODULES ? W.VigieDroits.MODULES.find(m => m.id === 'politique') : null;
  const res = (S) => W.VigieDroits.pour(S);
  check('catalogue : module « politique » (Ressources) ; tous les profils préréglés la lisent, Administrateur, RH et Préventeur la tiennent', (!W.VigieDroits.MODULES || (defs && defs.section === 'Ressources')) && [ADMIN, RH, PREV].every(S => res(S).peut('politique', 'gerer')) && [MAN, AG, REP].every(S => res(S).peut('politique', 'consulter') && !res(S).peut('politique', 'gerer')));
  const sess = (profils) => ({ user:'AG1', profils, services:['*'] });
  const niv = (pr, cle) => Droits.niveau(sess(pr), cle);
  check('serveur, écriture : politique tenue par RH et Préventeur ; prise de connaissance ajoutée par chacun', niv(['p-rh'], CLE) === 'complet' && niv(['p-preventeur'], CLE) === 'complet' && niv(['p-agent'], CLE) === 'aucun' && niv(['p-manager'], CLE) === 'aucun' && niv(['p-agent'], CLE_L) === 'ajout' && niv(['p-representant'], CLE_L) === 'ajout' && niv(['p-preventeur'], CLE_L) === 'complet' && niv([], CLE_L) === 'aucun', [niv(['p-agent'], CLE_L), niv(['p-agent'], CLE)]);
  check('serveur : règles explicites pour les deux clés', Droits.cles.includes(CLE) && Droits.cles.includes(CLE_L));
  const st = p.stockage();
  const vueAg = JSON.parse(Lecture.vue(sess(['p-agent']), CLE_L, st[CLE_L]));
  check('serveur, lecture : un agent reçoit la politique, et ses seules prises de connaissance', Lecture.regle(sess(['p-agent']), CLE) === null && vueAg.length === 1 && vueAg[0].auteur === 'AG1' && Lecture.regle(sess(['p-preventeur']), CLE_L) === null && Lecture.vue(sess([]), CLE, st[CLE]) === null, vueAg);
  check('VigieStore.CLES : deux registres de données, non sensibles', [CLE, CLE_L].every(k => W.VigieStore.CLES[k] && W.VigieStore.CLES[k].nature === 'donnees' && W.VigieStore.CLES[k].sensible === false));
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : texte, prise de connaissance', W.VigieLibelles.libelle(CLE, 'texte') === 'Texte de la politique' && W.VigieLibelles.libelle(CLE_L, 'le') === 'Pris connaissance le');
  check('icône du menu définie', !!p.d.querySelector('#i-file-text, symbol#i-file-text') || /i-file-text/.test(require('fs').readFileSync(ROOT + 'assets/icones.js', 'utf8')));

  fin();
})().catch(e => { console.error(e); process.exit(2); });
