// Contexte et enjeux (ISO 45001 § 4.1, 4.2, 6.1.1, 2026-10-15) : enjeux, parties intéressées, risques et opportunités
// avec leurs actions au Plan d'actions, retrait, registre imprimé, export, revue de direction, droits et règles serveur.
//   RACINE=<dossier> node test-contexte.js
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
const CLE = 'vigie_hse_contexte';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès et menu ----------
  for (const [nom, S, ouvert, gere] of [['RH', RH, true, true], ['administrateur', ADMIN, true, true], ['manager', MAN, true, false], ['préventeur', PREV, true, true], ['agent', AG, false, false], ['représentant', REP, true, false]]){
    const p = await H.page('contexte.html', S, {});
    check(`accès ${nom} : ${ouvert ? 'page ouverte' : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length, { nav: p.navigation(), err: p.erreurs });
    if (ouvert) check(`… ${nom} : boutons d'ajout ${gere ? 'présents' : 'absents (lecture seule)'}`, p.d.querySelectorAll('[data-nouveau]').length === (gere ? 3 : 0));
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Contexte et enjeux » ${ouvert ? 'présent' : 'absent'}`, !!d.d.querySelector('a[href="contexte.html"]') === ouvert);
  }

  // ---------- 2. Registre vide, enjeu ----------
  let p = await H.page('contexte.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui();
  check('registre vide : trois messages, compteurs à 0, invitation à commencer', /Aucun enjeu pour le moment/.test(p.$('tbEnjeux').textContent) && /Aucune partie intéressée pour le moment/.test(p.$('tbParties').textContent) && /Aucun risque ni opportunité pour le moment/.test(p.$('tbRo').textContent) && ['kpiEnjeux', 'kpiParties', 'kpiRo', 'kpiActions'].every(k => p.$(k).textContent === '0') && /Registre vide/.test(p.$('majNote').textContent));
  const nouveau = (r) => p.d.querySelector(`[data-nouveau="${r}"]`).click();
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) { if (typeof v === 'boolean') p.$(k).checked = v; else p.$(k).value = v; } };
  const lst = () => p.lire(CLE) || [];
  nouveau('enjeu');
  check('nouvel enjeu : origine, thème, enjeu, effet ; ni retrait ni suppression', !!p.$('cOrigine') && p.$('cTheme').options.length === 7 && !!p.$('cTexte') && !!p.$('cEffet') && !p.$('btnRetirer') && !p.$('btnSupprimer') && /Nouvel enjeu/.test(p.$('fiche').textContent));
  soumettre();
  check('validation : l\'enjeu', /Décrivez l'enjeu/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cOrigine: 'Externe', cTheme: 'Réglementaire', cTexte: 'Nouvelle obligation de formation des encadrants', cEffet: 'Charge de formation accrue' });
  soumettre();
  let en = lst()[0] || {};
  check('enjeu enregistré : registre, origine, thème, texte, effet, auteur', lst().length === 1 && en.registre === 'enjeu' && en.origine === 'Externe' && en.theme === 'Réglementaire' && en.texte.startsWith('Nouvelle obligation') && en.effet === 'Charge de formation accrue' && en.auteur === 'PREV1' && /^ctx-/.test(en.id), en);
  check('… liste et compteurs : enjeu, origine, mis à jour aujourd\'hui ; 1 enjeu (0 interne, 1 externe)', /Nouvelle obligation/.test(p.$('tbEnjeux').textContent) && /Externe/.test(p.$('tbEnjeux').textContent) && p.$('tbEnjeux').textContent.includes(ajd.split('-').reverse().join('/')) && p.$('kpiEnjeux').textContent === '1' && /0 interne, 1 externe/.test(p.$('kpiEnjeuxLabel').textContent));
  check('… journal d\'audit ; fiche restée ouverte, avec retrait, suppression et « risque ou opportunité lié »', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Contexte et enjeux' && a.type === 'Création' && /Enjeu « Nouvelle obligation/.test(a.description)) && !!p.$('btnRetirer') && !!p.$('btnSupprimer') && !!p.$('btnNouveauLie') && /Aucun risque ni opportunité rattaché/.test(p.$('fiche').textContent));

  // ---------- 3. Partie intéressée ----------
  nouveau('partie');
  const sugg = [...p.d.querySelectorAll('#cPartiesListe option')].map(o => o.value);
  check('nouvelle partie : suggestions (agents, F3SCT, médecine de prévention…)', sugg.length === 11 && sugg.includes('Agents') && sugg.some(s => /F3SCT/.test(s)) && sugg.includes('Médecine de prévention'), sugg);
  soumettre();
  check('validation : nommer la partie', /Nommez la partie/.test(p.alertes.pop() || ''));
  remplir({ cPartie: 'Médecine de prévention' });
  soumettre();
  check('validation : ses besoins et attentes', /besoins et attentes/.test(p.alertes.pop() || '') && lst().length === 1);
  remplir({ cBesoins: 'Être informée des postes à risque', cExigence: true, cReponse: 'Fiche de poste transmise' });
  soumettre();
  let pa = lst().find(x => x.registre === 'partie') || {};
  check('partie enregistrée, obligation marquée, chip dans la liste', pa.partie === 'Médecine de prévention' && pa.exigence === true && pa.reponse === 'Fiche de poste transmise' && /Obligation à suivre en conformité/.test(p.$('tbParties').textContent) && p.$('kpiParties').textContent === '1');
  remplir({ cExigence: false });
  soumettre();
  pa = lst().find(x => x.registre === 'partie');
  check('… obligation décochée : champ retiré', !('exigence' in pa) && !/Obligation à suivre/.test(p.$('tbParties').textContent));

  // ---------- 4. Risque lié à l'enjeu, actions ----------
  p.$('tbEnjeux').querySelector('[data-ouvrir]').click();
  p.$('btnNouveauLie').click();
  check('« risque ou opportunité lié » : nouvelle fiche, l\'enjeu en origine', /Nouveau risque ou opportunité/.test(p.$('fiche').textContent) && p.$('cSource').value === en.id && p.$('cType').value === 'Risque');
  soumettre();
  check('validation : décrire le risque ou l\'opportunité', /Décrivez le risque ou l'opportunité/.test(p.alertes.pop() || ''));
  remplir({ cNiveau: 'Élevée', cTexte: 'Formation des encadrants non financée', cEvaluation: 'Probable ; retard du plan de formation' });
  p.$('btnAjoutAction').click(); p.$('btnAjoutAction').click(); p.$('btnAjoutAction').click();
  const rows = p.d.querySelectorAll('#cActions .dyn-row[data-j]');
  rows[0].querySelector('[data-a="description"]').value = 'Inscrire la formation au budget';
  rows[0].querySelector('[data-a="responsable"]').value = 'DRH';
  rows[0].querySelector('[data-a="echeance"]').value = ajd.slice(0, 4) + '-12-31';
  rows[1].querySelector('[data-a="description"]').value = 'Demander une subvention';
  p.d.querySelector('[data-retirer-action="2"]').click();
  soumettre();
  let ro = lst().find(x => x.registre === 'ro') || {};
  check('risque enregistré : type, origine, évaluation, deux actions (la vide écartée)', ro.type === 'Risque' && ro.sourceId === en.id && /Probable/.test(ro.evaluation) && ro.actions.length === 2 && ro.actions.every(a => /^act-/.test(a.id)), ro);
  check('… liste : vient de l\'enjeu, 0 / 2 ; compteurs 1 risque, 2 actions pas faites ; l\'enjeu compte 1 lié', /Nouvelle obligation de formation/.test(p.$('tbRo').textContent) && /0 \/ 2/.test(p.$('tbRo').textContent) && p.$('kpiRo').textContent === '1' && /1 risque · 0 opportunité/.test(p.$('kpiRoLabel').textContent) && p.$('kpiActions').textContent === '2' && p.$('tbEnjeux').querySelectorAll('td')[3].textContent === '1');
  nouveau('ro');
  remplir({ cType: 'Opportunité', cNiveau: 'Moyenne', cTexte: 'Subvention du fonds national de prévention', cSource: '' });
  soumettre();
  const op = lst().find(x => x.type === 'Opportunité') || {};
  check('opportunité sans origine ni action : enregistrée, « Sans action » dans la liste', !!op.id && !('sourceId' in op) && /Sans action/.test(p.$('tbRo').textContent) && /1 risque · 1 opportunité/.test(p.$('kpiRoLabel').textContent));
  p.$('tbEnjeux').querySelector('[data-ouvrir]').click();
  check('fiche de l\'enjeu : le risque lié, cliquable', /Formation des encadrants non financée/.test(p.$('fiche').textContent) && !!p.d.querySelector('[data-ouvrir-lie]'));
  p.d.querySelector('[data-ouvrir-lie]').click();
  check('… qui ouvre le risque', p.$('cTexte') && p.$('cTexte').value === 'Formation des encadrants non financée');

  // ---------- 5. Plan d'actions ----------
  const stockA = p.stockage();
  const pl = await H.page('plan-actions.html', RH, stockA);
  const a0 = (pl.lire('vigie_hse_actions') || []).find(a => a.id === 'pa-ro-' + ro.id + '-' + ro.actions[0].id) || {};
  check('Plan d\'actions : action reprise (origine, titre, toute l\'organisation, responsable, échéance)', a0.origine === 'Risques et opportunités' && a0.titre === 'Risque pour la démarche : Formation des encadrants non financée' && a0.service === '' && a0.responsable === 'DRH' && a0.echeance === ajd.slice(0, 4) + '-12-31' && a0.priorite === 'Haute' && !pl.erreurs.length, [a0, pl.erreurs]);
  check('… les deux actions, avec leur pastille d\'origine', (pl.lire('vigie_hse_actions') || []).filter(a => a.origine === 'Risques et opportunités').length === 2 && !!pl.d.querySelector('.origine-chip.ro'));
  const plMan = await H.page('plan-actions.html', MAN, stockA);
  check('… toute l\'organisation : hors du Plan d\'un manager limité à un service (règle existante du Plan d\'actions), sans erreur', !/Risque pour la démarche/.test(plMan.d.querySelector('tbody').textContent) && !plMan.erreurs.length, plMan.erreurs);
  const actions = pl.lire('vigie_hse_actions').map(a => a.id === a0.id ? Object.assign({}, a, { statut: 'Fait' }) : a);
  const stockB = Object.assign({}, pl.stockage(), { vigie_hse_actions: J(actions) });
  p = await H.page('contexte.html', PREV, stockB);
  check('action faite au Plan d\'actions : 1 / 2, une action pas faite', /1 \/ 2/.test(p.$('tbRo').textContent) && p.$('kpiActions').textContent === '1');
  const ligneRo = (t) => [...p.d.querySelectorAll('#tbRo tr')].find(tr => tr.textContent.includes(t));
  ligneRo('Formation des encadrants').querySelector('[data-ouvrir]').click();
  const fixes = p.d.querySelectorAll('#cActions .dyn-row[data-fixe]');
  check('… dans la fiche, les actions reprises se suivent au Plan d\'actions', fixes.length === 2 && /Fait/.test(fixes[0].textContent) && !!p.d.querySelector('#cActions a[href="plan-actions.html"]'));

  // ---------- 6. Retirer, rétablir, supprimer ----------
  p.$('tbParties').querySelector('[data-ouvrir]').click();
  p.w.prompt = () => '  ';
  p.$('btnRetirer').click();
  check('retirer : motif obligatoire', /pourquoi il est retiré/.test(p.alertes.pop() || '') && !lst().find(x => x.registre === 'partie').archive);
  p.w.prompt = () => 'Convention terminée';
  p.$('btnRetirer').click();
  pa = lst().find(x => x.registre === 'partie');
  check('retirer : marqué retiré (motif, date, par qui), fiche figée, « Rétablir »', pa.archive && pa.motifArchive === 'Convention terminée' && pa.archiveLe === ajd && pa.archivePar === 'PREV1' && p.$('cPartie').disabled && !!p.$('btnRetablir') && !p.d.querySelector('#fiche [type="submit"]'));
  check('… masqué de la liste et des compteurs, retrait signalé', /Aucune partie intéressée pour le moment/.test(p.$('tbParties').textContent) && p.$('kpiParties').textContent === '0' && /1 élément retiré/.test(p.$('majNote').textContent));
  p.$('fRetires').checked = true; p.ev(p.$('fRetires'), 'change');
  check('« Afficher les éléments retirés » : la partie revient, marquée', /Médecine de prévention/.test(p.$('tbParties').textContent) && /Retiré/.test(p.$('tbParties').textContent) && !!p.d.querySelector('#tbParties tr.retire'));
  p.$('btnRetablir').click();
  pa = lst().find(x => x.registre === 'partie');
  check('rétablir : plus retiré, motif effacé', !pa.archive && !('motifArchive' in pa) && p.$('kpiParties').textContent === '1');
  p.$('fRetires').checked = false; p.ev(p.$('fRetires'), 'change');
  p.$('tbEnjeux').querySelector('[data-ouvrir]').click();
  let confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  p.$('btnSupprimer').click();
  ro = lst().find(x => x.registre === 'ro' && x.type === 'Risque');
  check('supprimer l\'enjeu : confirmation (le risque lié reste, sans origine) ; le risque perd son origine', /restent, sans origine/.test(confirmes[0] || '') && !lst().find(x => x.registre === 'enjeu') && ro && !('sourceId' in ro) && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Contexte et enjeux' && a.type === 'Suppression'), confirmes);

  // ---------- 7. Recherche, échappement ----------
  p.$('fTexte').value = 'subvention'; p.ev(p.$('fTexte'), 'input');
  check('recherche : jusque dans les actions', p.d.querySelectorAll('#tbRo tr:not(.empty-row)').length === 2 && /Aucune partie intéressée avec ces filtres/.test(p.$('tbParties').textContent));
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  p = await H.page('contexte.html', PREV, Object.assign({}, p.stockage(), { [CLE]: J(lst().concat([{ id:'ctx-xss', registre:'enjeu', origine:'Interne', theme:'Autre', texte:'<img src=x onerror=alert(1)>', effet:'<b>gras</b>' }])) }));
  check('échappement : texte affiché tel quel, aucun élément créé', !p.d.querySelector('#tbEnjeux img') && !p.d.querySelector('#tbEnjeux td.long b + b') && /<img src=x/.test(p.$('tbEnjeux').textContent) && /<b>gras<\/b>/.test(p.$('tbEnjeux').textContent));

  // ---------- 8. Registre imprimé, export ----------
  let imprime = null;
  p.w.print = () => { imprime = p.d.getElementById('ctx-impression') ? p.d.getElementById('ctx-impression').textContent : ''; };
  p.$('btnImprimer').click();
  check('registre imprimé : trois parties, actions et leur état, marque', /Contexte et enjeux de la démarche/.test(imprime || '') && /Enjeux internes et externes/.test(imprime) && /Médecine de prévention/.test(imprime) && /Inscrire la formation au budget — DRH/.test(imprime) && /Fait/.test(imprime) && imprime.includes(p.w.VigieMarque.nom()), (imprime || '').slice(0, 300));
  p.ev(p.w, 'afterprint');
  check('… bloc retiré après impression', !p.d.getElementById('ctx-impression'));
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const feuille = (n) => wb ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval:'' }) : [];
  check('export : six feuilles (revues annuelles et domaine d\'application comprises)', wb && J(wb.SheetNames) === J(['Enjeux', 'Parties intéressées', 'Risques et opportunités', 'Actions', 'Revues annuelles', "Domaine d'application"]), wb && wb.SheetNames);
  check('… contenu : partie (obligation, état), risque (actions pas faites), actions (état au Plan d\'actions)', feuille('Parties intéressées').some(r => r['Partie intéressée'] === 'Médecine de prévention' && r['Obligation à suivre en conformité'] === 'Non' && r['État'] === 'Actif') && feuille('Risques et opportunités').some(r => r['Type'] === 'Risque' && r['Actions'] === 2 && r['Actions pas faites'] === 1) && feuille('Actions').some(r => r['État au Plan d\'actions'] === 'Fait') && feuille('Enjeux').length === 1);

  // ---------- 9. Secteur entreprise, lecture seule, ?ouvrir= ----------
  const stockD = p.stockage();
  const pe = await H.page('contexte.html', RH, Object.assign({}, stockD, { vigie_hse_referentials: J({ organisation: { secteur:'entreprise' } }) }));
  pe.d.querySelector('[data-nouveau="partie"]').click();
  const sugE = [...pe.d.querySelectorAll('#cPartiesListe option')].map(o => o.value);
  check('secteur entreprise : suggestions dites avec ses mots (CSSCT, salariés)', sugE.some(s => /CSSCT/.test(s)) && !sugE.some(s => /F3SCT/.test(s)) && sugE.some(s => /alarié/.test(s)), sugE);
  p = await H.page('contexte.html', MAN, stockD);
  check('manager : lit les trois registres, sans bouton d\'ajout', /Médecine de prévention/.test(p.$('tbParties').textContent) && !p.d.querySelector('[data-nouveau]') && !p.erreurs.length);
  ligneRo('Formation des encadrants').querySelector('[data-ouvrir]').click();
  check('… fiche figée : ni enregistrement, ni ajout d\'action, ni retrait', p.$('cTexte').disabled && !p.$('btnAjoutAction') && !p.d.querySelector('#fiche [type="submit"]') && !p.$('btnRetirer') && !p.$('btnSupprimer'));
  p = await H.page('contexte.html', RH, stockD, '?ouvrir=' + op.id);
  check('?ouvrir= ouvre l\'élément', H.visible(p.$('fiche')) && p.$('cTexte').value === 'Subvention du fonds national de prévention');

  // ---------- 10. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, stockD);
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : le registre dans « Changements du contexte », avec ce qui a changé', /Contexte et enjeux \(registre au jour du calcul\)/.test(txt) && /parties intéressées/.test(txt) && /Ajouté le/.test(txt) && /Subvention du fonds/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 300) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const co = revue.chiffres && revue.chiffres.contexteOrganisation;
  check('… photographié avec la revue', co && co.enjeux === 1 && co.parties === 1 && co.risques === 1 && co.opportunites === 1 && co.actionsPasFaites === 1 && co.mouvements.length >= 3, co);
  check('… revue antérieure : rien ; données partielles : non repris, et dit', rd.w.contexteDeLaRevue({}) === '' && (rd.w.VigieStore.complet = () => false, rd.w.contexteDuJour('2026-01-01', '2026-12-31') === null) && /Non repris/.test(rd.w.contexteDeLaRevue({ contexteOrganisation: null })));

  // ---------- 11. Logique partagée ----------
  const VX = p.w.VigieContexte;
  const L = [{ id:'e1', registre:'enjeu', origine:'Interne', texte:'a', dateCreation:'2026-01-05T10:00:00' }, { id:'e2', registre:'enjeu', origine:'Externe', texte:'b', dateCreation:'2025-05-01T10:00:00', dateMaj:'2026-02-01T10:00:00' },
    { id:'p1', registre:'partie', partie:'Élus', exigence:true, dateCreation:'2025-01-01T10:00:00', archive:true, archiveLe:'2026-03-01' }, { id:'p2', registre:'partie', partie:'Usagers', dateCreation:'2024-01-01T10:00:00', archive:true, archiveLe:'2025-03-01' },
    { id:'r1', registre:'ro', type:'Risque', texte:'x', sourceId:'e1', actions:[{ id:'1', description:'m' }, { id:'2', description:' ' }] }, { id:'r2', registre:'ro', type:'Opportunité', texte:'y', sourceId:'r1' },
    { id:'z', registre:'autre' }, null, 'x', { registre:'enjeu' }];
  const s = VX.synthese(L, [{ id:'pa-ro-r1-1', statut:'Fait' }]);
  check('synthese : retirés et entrées invalides écartés, actions vides ignorées, actions faites', s.enjeux === 2 && s.internes === 1 && s.externes === 1 && s.parties === 0 && s.exigences === 0 && s.risques === 1 && s.opportunites === 1 && s.sansAction === 1 && s.actions === 1 && s.actionsPasFaites === 0 && s.retires === 2 && s.derniereMaj === '2026-03-01', s);
  const pp = VX.pourPeriode(L, [], '2026-01-01', '2026-06-30');
  const q = (id) => (pp.mouvements.find(m => m.libelle === id) || {}).quoi;
  check('pourPeriode : ajouté, modifié, retiré dans la période ; retiré avant : rien', q('a') === 'Ajouté' && q('b') === 'Modifié' && q('Élus') === 'Retiré' && !q('Usagers') && pp.mouvements.length === 3, pp.mouvements);
  check('source : un enjeu ou une partie, jamais un risque ; lies : risques et opportunités actifs', VX.source(L[4], L).id === 'e1' && VX.source(L[5], L) === null && VX.lies(L, 'e1').length === 1 && VX.idAction({ id:'c' }, { id:'a' }) === 'pa-ro-c-a');
  check('jourDe : date, horodatage local, vide', VX.jourDe('2026-05-01') === '2026-05-01' && VX.jourDe('2026-05-01T10:00:00') === '2026-05-01' && VX.jourDe('') === '' && VX.jourDe('nimporte') === '');

  // ---------- 12. Droits, serveur, registre, libellés ----------
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const W = p.w;
  const defs = W.VigieDroits.MODULES ? W.VigieDroits.MODULES.find(m => m.id === 'contexte') : null;
  const res = (S) => W.VigieDroits.pour(S);
  check('catalogue : module « contexte » (Pilotage) ; Administrateur, RH et Préventeur gèrent, Manager consulte, Représentant consulte, Agent sans accès', (!W.VigieDroits.MODULES || (defs && defs.section === 'Pilotage')) && res(ADMIN).peut('contexte', 'gerer') && res(RH).peut('contexte', 'gerer') && res(PREV).peut('contexte', 'gerer') && res(MAN).peut('contexte', 'consulter') && !res(MAN).peut('contexte', 'gerer') && !res(AG).peut('contexte', 'consulter') && res(REP).peut('contexte', 'consulter') && !res(REP).peut('contexte', 'gerer'));
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  const niv = (pr) => Droits.niveau(sess(pr), CLE);
  check('serveur, écriture : RH, Administrateur et Préventeur complet, manager aucun', niv(['p-rh']) === 'complet' && niv(['p-preventeur']) === 'complet' && niv(['p-manager']) === 'aucun' && niv(['p-admin']) === 'complet', [niv(['p-rh']), niv(['p-preventeur']), niv(['p-manager'])]);
  check('serveur : règle explicite pour la clé', Droits.cles.includes(CLE));
  const pageDe = (profils) => Object.assign(sess(profils), { droits: undefined });
  const vueAgent = JSON.parse(Lecture.vue(pageDe(['p-agent']), CLE, stockD[CLE]));
  const autorises = ['id', 'registre', 'type', 'texte', 'actions'];
  check('serveur, lecture : un agent ne reçoit que identifiant, registre, type, texte, actions ; RH et manager tout', vueAgent.length && vueAgent.every(r => Object.keys(r).every(k => autorises.includes(k))) && !vueAgent.some(r => 'besoins' in r || 'evaluation' in r || 'effet' in r || 'partie' in r) && Lecture.regle(pageDe(['p-rh']), CLE) === null && Lecture.regle(pageDe(['p-manager']), CLE) === null, vueAgent.map(r => Object.keys(r)));
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : besoins et évaluation', W.VigieLibelles.libelle(CLE, 'besoins') === 'Besoins et attentes' && W.VigieLibelles.libelle(CLE, 'evaluation') === 'Évaluation');
  check('icône du menu : i-compass', !!W.VigieIcones && !!W.VigieIcones.ICONES['i-compass']);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
