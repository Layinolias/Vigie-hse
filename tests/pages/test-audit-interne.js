// Audit interne (ISO 45001 § 9.2, 2026-10-15) : programme d'audit, clauses, constats, actions au Plan d'actions, couverture,
// rapport, export, revue de direction, droits et règles serveur.   RACINE=<dossier> node test-audit-interne.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_audits_internes';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Accès et menu ----------
  for (const [nom, S, ouvert, gere] of [['RH', RH, true, true], ['administrateur', ADMIN, true, true], ['manager', MAN, true, false], ['préventeur', PREV, true, true], ['agent', AG, false, false]]){
    const p = await H.page('audit-interne.html', S, {});
    check(`accès ${nom} : ${ouvert ? 'page ouverte' : 'renvoyé au tableau de bord'}`, p.navigation() === !ouvert && !p.erreurs.length, { nav: p.navigation(), err: p.erreurs });
    if (ouvert) check(`… ${nom} : bouton « Nouvel audit » ${gere ? 'présent' : 'absent (lecture seule)'}`, !!p.$('btnNouveau') === gere);
    const d = await H.page('dashboard.html', S, {});
    check(`menu ${nom} : lien « Audit interne » ${ouvert ? 'présent' : 'absent'}`, !!d.d.querySelector('a[href="audit-interne.html"]') === ouvert);
  }

  // ---------- 2. Programme vide, création, validations ----------
  let p = await H.page('audit-interne.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui(), an = ajd.slice(0, 4);
  check('programme vide : message, compteurs à 0, 30 clauses jamais auditées', /Aucun audit prévu en/.test(p.$('tbody').textContent) && p.$('kpiAudits').textContent === '0' && p.$('kpiJamais').textContent === '30' && p.$('fAnnee').value === an, [p.$('tbody').textContent, p.$('kpiJamais').textContent, p.$('fAnnee').value]);
  check('couverture : 30 clauses sous 7 chapitres, toutes « jamais auditée »', p.d.querySelectorAll('#tbodyCouverture tr.chap').length === 7 && p.d.querySelectorAll('#tbodyCouverture tr:not(.chap)').length === 30 && p.d.querySelectorAll('#tbodyCouverture .chip.attention').length === 30);
  p.$('btnNouveau').click();
  check('nouvel audit : 30 cases de clauses, aucun constat', p.d.querySelectorAll('#fiche [data-clause]').length === 30 && /Aucun constat/.test(p.$('cConstats').textContent));
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) p.$(k).value = v; };
  const cocher = (...cs) => cs.forEach(c => { p.d.querySelector(`#fiche [data-clause="${c}"]`).checked = true; });
  const soumettre = () => p.ev(p.$('ficheForm'), 'submit');
  soumettre();
  check('validation : ce qui est audité', /Indiquez ce qui est audité/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cTitre: 'Planification des actions et suivi des non-conformités' });
  soumettre();
  check('validation : date prévue', /date prévue/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cPrevue: an + '-12-10' });
  soumettre();
  check('validation : au moins une clause ou un autre critère', /au moins une clause/.test(p.alertes.pop() || '') && !p.lire(CLE));
  cocher('6.1.4', '10.2');
  remplir({ cRealisee: '2099-01-01' });
  soumettre();
  check('validation : réalisation dans le futur', /futur/.test(p.alertes.pop() || '') && !p.lire(CLE));
  remplir({ cRealisee: '' });
  p.$('btnAjoutConstat').click();
  check('constat ajouté : non-conformité par défaut, clause vide (deux cochées)', p.d.querySelector('#cConstats [data-k="type"]').value === 'Non-conformité' && p.d.querySelector('#cConstats [data-k="clause"]').value === '');
  p.d.querySelector('#cConstats [data-k="texte"]').value = 'Actions sans responsable';
  soumettre();
  check('validation : un constat demande la date de réalisation', /date de réalisation/.test(p.alertes.pop() || '') && !p.lire(CLE));
  p.d.querySelector('[data-retirer-constat="0"]').click();
  remplir({ cService: V, cCriteres: 'Procédure interne PA-01' });
  soumettre();
  let l = p.lire(CLE) || [];
  let x = l[0] || {};
  check('création (prévu) : champs enregistrés, pas de date de réalisation, auteur', l.length === 1 && x.titre.startsWith('Planification') && J(x.clauses) === J(['6.1.4', '10.2']) && x.criteres === 'Procédure interne PA-01' && x.service === V && x.datePrevue === an + '-12-10' && !('dateRealisee' in x) && x.auteur === 'PREV1' && J(x.constats) === '[]' && /^au-/.test(x.id), x);
  check('… liste : planifié, clauses rappelées ; compteurs', /Planifié/.test(p.$('tbody').textContent) && /Clauses 6\.1\.4, 10\.2 · Procédure interne PA-01/.test(p.$('tbody').textContent) && p.$('kpiAudits').textContent === '1' && p.$('kpiRealises').textContent === '0', p.$('tbody').textContent);
  check('… couverture : une clause prévue n\'est pas encore auditée, mais son prochain audit est dit', p.$('kpiJamais').textContent === '30' && /10\/12\/\d{4}/.test([...p.d.querySelectorAll('#tbodyCouverture tr')].find(tr => /6\.1\.4/.test(tr.textContent)).textContent));
  check('… journal d\'audit', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Audit interne' && a.type === 'Création' && /prévu le/.test(a.description)));

  // ---------- 3. Réalisation, constats, actions ----------
  p.$('tbody').querySelector('[data-ouvrir]').click();
  remplir({ cRealisee: ajd });
  soumettre();
  check('validation : un audit réalisé nomme son auditeur', /auditeur/.test(p.alertes.pop() || ''));
  remplir({ cAuditeur: 'M. Durand, Finances', cConclusion: 'Système appliqué ; suivi des retards à renforcer.' });
  p.$('btnAjoutConstat').click();
  const k0 = () => p.d.querySelector('#cConstats .constat[data-i="0"]');
  k0().querySelector('[data-k="clause"]').value = '10.2';
  k0().querySelector('[data-k="texte"]').value = 'Trois actions correctives en retard sans relance';
  k0().querySelector('[data-k="preuve"]').value = 'Plan d\'actions consulté le jour de l\'audit';
  p.ev(k0().querySelector('[data-k="texte"]'), 'change');
  check('non-conformité sans action : signalée', H.visible(k0().querySelector('[data-alerte]')) && /sans action/.test(k0().querySelector('[data-alerte]').textContent));
  k0().querySelector('[data-ajout-action]').click();
  k0().querySelector('[data-a="description"]').value = 'Mettre en place une relance mensuelle';
  k0().querySelector('[data-a="responsable"]').value = 'Préventeur';
  k0().querySelector('[data-a="echeance"]').value = an + '-12-31';
  p.ev(k0().querySelector('[data-a="description"]'), 'change');
  check('… plus signalée une fois l\'action ajoutée', !H.visible(k0().querySelector('[data-alerte]')));
  check('… les champs saisis survivent à l\'ajout d\'un constat', (p.$('btnAjoutConstat').click(), k0().querySelector('[data-k="texte"]').value === 'Trois actions correctives en retard sans relance' && k0().querySelector('[data-a="description"]').value === 'Mettre en place une relance mensuelle'));
  const k1 = () => p.d.querySelector('#cConstats .constat[data-i="1"]');
  k1().querySelector('[data-k="type"]').value = 'Point fort';
  k1().querySelector('[data-k="clause"]').value = '6.1.4';
  k1().querySelector('[data-k="texte"]').value = 'Toutes les actions ont un responsable et une échéance';
  p.$('btnAjoutConstat').click();
  p.d.querySelector('#cConstats .constat[data-i="2"] [data-ajout-action]').click();
  p.d.querySelector('#cConstats .constat[data-i="2"] [data-a="description"]').value = 'Action orpheline';
  soumettre();
  check('validation : un constat qui porte une action est décrit', /Décrivez chaque constat/.test(p.alertes.pop() || ''));
  p.d.querySelector('[data-retirer-constat="2"]').click();
  soumettre();
  l = p.lire(CLE) || []; x = l[0] || {};
  const nc = (x.constats || [])[0] || {}, pf = (x.constats || [])[1] || {};
  check('réalisé : date, auditeur, conclusion, deux constats', x.dateRealisee === ajd && x.auditeur === 'M. Durand, Finances' && /renforcer/.test(x.conclusion) && (x.constats || []).length === 2 && x.modifiePar === 'PREV1', x);
  check('… la non-conformité : clause, preuve, action avec identifiant', nc.type === 'Non-conformité' && nc.clause === '10.2' && /consulté/.test(nc.preuve) && (nc.actions || []).length === 1 && nc.actions[0].description === 'Mettre en place une relance mensuelle' && !!nc.actions[0].id && nc.actions[0].echeance === an + '-12-31', nc);
  check('… le point fort, sans action', pf.type === 'Point fort' && pf.clause === '6.1.4' && J(pf.actions) === '[]', pf);
  check('… liste : réalisé, constats résumés, 0 / 1 action soldée ; compteurs', /Réalisé/.test(p.$('tbody').textContent) && /1 NC · 1 point\(s\) fort\(s\)/.test(p.$('tbody').textContent) && /0 \/ 1 soldée/.test(p.$('tbody').textContent) && p.$('kpiRealises').textContent === '1' && p.$('kpiNc').textContent === '1', p.$('tbody').textContent);
  check('… couverture : 2 clauses auditées (28 jamais), dernier audit daté, NC ouverte sur 10.2', p.$('kpiJamais').textContent === '28' && /0\/12|1 \/ 1/.test([...p.d.querySelectorAll('#tbodyCouverture tr')].find(tr => /^10\.2/.test(tr.textContent.trim())).textContent), [...p.d.querySelectorAll('#tbodyCouverture tr')].find(tr => /^10\.2/.test(tr.textContent.trim())).textContent);
  check('… plus de bouton « Annuler l\'audit » une fois réalisé', !p.$('btnAnnuler') && !!p.$('btnRapport'));

  // ---------- 4. Plan d'actions ----------
  const stockA = p.stockage();
  const pa = await H.page('plan-actions.html', RH, stockA);
  const actPA = (pa.lire('vigie_hse_actions') || []).find(a => a.id === 'pa-audit-' + x.id + '-' + nc.actions[0].id) || {};
  check('Plan d\'actions : l\'action reprise (origine « Audit interne », titre, service, entrée, priorité haute)', actPA.origine === 'Audit interne' && actPA.titre === 'Audit interne : ' + x.titre + ' — Non-conformité' && actPA.service === V && actPA.collectivite === 'Ville' && actPA.priorite === 'Haute' && actPA.echeance === an + '-12-31' && actPA.responsable === 'Préventeur' && !pa.erreurs.length, { actPA, err: pa.erreurs });
  check('… avec sa pastille d\'origine', !!pa.d.querySelector('.origine-chip.audit'));
  const paMan = await H.page('plan-actions.html', MAN, stockA);
  check('… visible du manager de ce service', /Audit interne : Planification/.test(paMan.d.querySelector('tbody').textContent) && !paMan.erreurs.length, paMan.erreurs);
  // l'action faite au Plan d'actions : la non-conformité est soldée
  const actions = pa.lire('vigie_hse_actions').map(a => a.id === actPA.id ? Object.assign({}, a, { statut: 'Fait' }) : a);
  const stockB = Object.assign({}, pa.stockage(), { vigie_hse_actions: J(actions) });
  p = await H.page('audit-interne.html', PREV, stockB);
  check('action faite au Plan d\'actions : NC soldée, compteur à 0, 1 / 1', p.$('kpiNc').textContent === '0' && /1 \/ 1 soldée/.test(p.$('tbody').textContent), [p.$('kpiNc').textContent, p.$('tbody').textContent]);
  p.$('tbody').querySelector('[data-ouvrir]').click();
  const fixe = p.d.querySelector('#cConstats .constat[data-i="0"] .dyn-row[data-fixe]');
  check('… l\'action reprise ne se modifie plus dans l\'audit : son état du Plan d\'actions', !!fixe && /Fait/.test(fixe.textContent) && /au Plan d'actions/.test(fixe.textContent) && !p.d.querySelector('#cConstats .constat[data-i="0"] [data-a]'));
  soumettre();
  check('… et un nouvel enregistrement la garde', ((p.lire(CLE)[0].constats[0].actions || [])[0] || {}).description === 'Mettre en place une relance mensuelle');

  // ---------- 5. Annuler, rétablir, date dépassée, années, supprimer ----------
  const base = p.lire(CLE);
  const stockC = Object.assign({}, p.stockage(), { [CLE]: J(base.concat([
    { id:'au-passe', titre:'Compétences et sensibilisation', clauses:['7.2', '7.3'], datePrevue: an + '-01-10', service: P },
    { id:'au-2025', titre:'Préparation aux urgences', clauses:['8.2'], datePrevue: (an - 1) + '-11-05', dateRealisee: (an - 1) + '-11-05', auditeur:'Cabinet externe', constats:[] },
    { id:'au-xss', titre:'<img src=x onerror="window.piege=1">', clauses:['5.2'], datePrevue: an + '-11-20' },
  ])) });
  p = await H.page('audit-interne.html', PREV, stockC);
  const ligne = (t) => [...p.d.querySelectorAll('#tbody tr')].find(tr => tr.textContent.includes(t));
  check('date prévue passée, pas réalisé : « Date dépassée », dit au compteur', /Date dépassée/.test(ligne('Compétences').textContent) && /1 date dépassée/.test(p.$('kpiRealisesLabel').textContent), p.$('kpiRealisesLabel').textContent);
  check('échappement : un titre piégé reste du texte', !p.d.querySelector('#tbody img') && !p.w.piege && /<img/.test(ligne('onerror').textContent));
  check('année en cours : pas l\'audit de l\'an passé ; « Toutes les années » le montre', !ligne('Préparation aux urgences') && (p.choisir('fAnnee', ''), !!ligne('Préparation aux urgences')) && p.$('kpiAuditsLabel').textContent === 'Audits, toutes années');
  check('… l\'an passé compte dans la couverture (8.2 auditée)', p.$('kpiJamais').textContent === '27');
  p.choisir('fEtat', 'realise');
  check('filtre d\'état : réalisés seulement', p.d.querySelectorAll('#tbody tr').length === 2 && !ligne('Compétences'));
  p.choisir('fEtat', '');
  p.$('fTexte').value = 'urgences'; p.ev(p.$('fTexte'), 'input');
  check('recherche', p.d.querySelectorAll('#tbody tr').length === 1 && !!ligne('Préparation aux urgences'));
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  ligne('Compétences').querySelector('[data-ouvrir]').click();
  p.w.prompt = () => '';
  p.$('btnAnnuler').click();
  check('annuler : motif exigé', /motif/.test(p.alertes.pop() || '') && !p.lire(CLE).find(a => a.id === 'au-passe').annule);
  p.w.prompt = () => 'Auditeur indisponible, reporté en 2027';
  p.$('btnAnnuler').click();
  let au = p.lire(CLE).find(a => a.id === 'au-passe');
  check('annuler : marqué annulé, motif, date, auteur ; reste au programme', au.annule === true && au.motifAnnulation === 'Auditeur indisponible, reporté en 2027' && au.annuleLe === ajd && au.annulePar === 'PREV1' && /Annulé/.test(ligne('Compétences').textContent));
  check('… fiche figée, bouton « Rétablir »', p.$('cTitre').disabled && !p.d.querySelector('#fiche [type="submit"]') && !!p.$('btnRetablir') && /Auditeur indisponible/.test(p.$('fiche').textContent));
  check('… hors compteurs (date dépassée disparue)', !/date dépassée/.test(p.$('kpiRealisesLabel').textContent));
  p.$('btnRetablir').click();
  au = p.lire(CLE).find(a => a.id === 'au-passe');
  check('rétablir : plus annulé, motif effacé', !au.annule && !('motifAnnulation' in au) && !!p.d.querySelector('#fiche [type="submit"]'));
  p.$('btnSupprimer').click();
  check('supprimer : l\'audit disparaît', !p.lire(CLE).find(a => a.id === 'au-passe') && !ligne('Compétences') && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Audit interne' && a.type === 'Suppression'));

  // ---------- 6. Rapport et export ----------
  p.choisir('fAnnee', an);
  let imprime = null;
  p.w.print = () => { imprime = p.d.getElementById('ai-impression') ? p.d.getElementById('ai-impression').textContent : ''; };
  ligne('Planification').querySelector('[data-ouvrir]').click();
  p.$('btnRapport').click();
  check('rapport imprimé : titre, critères, auditeur, constats, actions et leur état, conclusion, signatures', /Rapport d'audit interne/.test(imprime || '') && /10\.2 Événements, non-conformités/.test(imprime) && /M\. Durand/.test(imprime) && /Trois actions correctives/.test(imprime) && /relance mensuelle.*Fait/.test(imprime) && /renforcer/.test(imprime) && /responsable du périmètre audité/.test(imprime), (imprime || '').slice(0, 300));
  check('… la marque, jamais le nom du produit en dur', imprime.includes(p.w.VigieMarque.nom()));
  p.ev(p.w, 'afterprint');
  check('… bloc retiré après impression', !p.d.getElementById('ai-impression'));
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const feuille = (n) => wb ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval:'' }) : [];
  check('export : cinq feuilles (grilles comprises)', wb && J(wb.SheetNames) === J(['Audits', 'Constats', 'Actions', 'Couverture', 'Grilles']), wb && wb.SheetNames);
  const fa = feuille('Audits').find(r => r['Audit'].startsWith('Planification')) || {};
  check('… Audits : clauses, périmètre, dates, auditeur, état, comptes', fa['Clauses'] === '6.1.4, 10.2' && fa['Périmètre'] === V && fa['État'] === 'Réalisé' && fa['Non-conformités'] === 1 && fa['Points forts'] === 1 && fa['Auditeur'] === 'M. Durand, Finances', fa);
  check('… Constats (avec l\'état de la NC), Actions (état du Plan d\'actions), Couverture (30 lignes)', feuille('Constats').some(r => r['Type'] === 'Non-conformité' && r['État'] === 'Soldée' && /^10\.2 /.test(r['Clause'])) && feuille('Actions').some(r => r['État au Plan d\'actions'] === 'Fait') && feuille('Couverture').length === 30 && feuille('Couverture').some(r => r['Dernier audit'] === 'Jamais auditée'));
  check('impression du programme : bouton branché à côté de l\'export', !!p.d.querySelector('#listeActions button[id*="mprim"], #listeActions .btn-print, #listeActions [data-impression]') || /Imprimer/.test(p.$('listeActions').textContent));

  // ---------- 7. Lecture seule, périmètre ----------
  const stockD = Object.assign({}, p.stockage(), { [CLE]: J(p.lire(CLE).concat([{ id:'au-pat', titre:'Audit Patrimoine', clauses:['8.1.1'], datePrevue: an + '-11-02', service: P }])) });
  p = await H.page('audit-interne.html', MAN, stockD);
  check('manager (Voirie) : son service et l\'organisation, pas un autre service', !!ligne('Planification') && !ligne('Audit Patrimoine') && !!ligne('onerror') && !p.erreurs.length);
  check('… couverture dite limitée', /vos services/.test(p.$('couvertureNote').textContent));
  ligne('Planification').querySelector('[data-ouvrir]').click();
  check('… lecture seule : fiche figée, constats en texte, ni ajout ni enregistrement ; rapport imprimable', p.$('cTitre').disabled && p.d.querySelector('#fiche [data-clause]').disabled && !p.$('btnAjoutConstat') && !p.d.querySelector('#cConstats [data-k]') && !p.d.querySelector('#fiche [type="submit"]') && !p.$('btnSupprimer') && !!p.$('btnRapport') && /Trois actions correctives/.test(p.$('cConstats').textContent));
  p = await H.page('audit-interne.html', MAN, stockD, '?ouvrir=au-pat');
  check('… ?ouvrir= sur un audit hors de ses services : rien d\'ouvert', !H.visible(p.$('fiche')));
  p = await H.page('audit-interne.html', RH, stockD, '?ouvrir=au-pat');
  check('?ouvrir= ouvre l\'audit', H.visible(p.$('fiche')) && p.$('cTitre').value === 'Audit Patrimoine');

  // ---------- 8. Revue de direction ----------
  const rd = await H.page('revue-direction.html', RH, stockD);
  rd.$('btnNouvelle').click();
  const txt = rd.$('revue') ? rd.$('revue').textContent : '';
  check('revue de direction : audit interne dans la performance', /Audit interne du système/.test(txt) && /audits internes réalisés/.test(txt) && /Trois actions correctives/.test(txt) && /soldée/.test(txt) && !rd.erreurs.length, { err: rd.erreurs, t: txt.slice(0, 200) });
  const revue = (rd.lire('vigie_hse_revues_direction') || [])[0] || {};
  const ai = revue.chiffres && revue.chiffres.auditsInternes;
  check('… photographié avec la revue', ai && ai.realises >= 1 && ai.nonConformites === 1 && ai.ncSoldees === 1 && ai.nc.length === 1 && ai.clausesAuditees.includes('10.2'), ai);
  check('… revue antérieure : rien d\'ajouté ; données partielles : non calculé, et dit', rd.w.auditsInternesDeLaRevue({}) === '' && (rd.w.VigieStore.complet = () => false, rd.w.auditsInternesDuJour('2026-01-01', '2026-12-31') === null) && /Bilan non calculé/.test(rd.w.auditsInternesDeLaRevue({ auditsInternes: null })));

  // ---------- 9. Logique partagée ----------
  const VA = p.w.VigieAuditInterne;
  check('etat : annulé, réalisé, date dépassée, planifié', VA.etat({ annule:true, dateRealisee:'2026-01-01' }, '2026-02-01').code === 'annule' && VA.etat({ dateRealisee:'2026-01-01', datePrevue:'2025-01-01' }, '2026-02-01').code === 'realise' && VA.etat({ datePrevue:'2026-01-31' }, '2026-02-01').code === 'depasse' && VA.etat({ datePrevue:'2026-02-01' }, '2026-02-01').code === 'planifie');
  check('annee : réalisation, sinon date prévue', VA.annee({ datePrevue:'2025-12-20', dateRealisee:'2026-01-05' }) === 2026 && VA.annee({ datePrevue:'2025-12-20' }) === 2025 && VA.annee({}) === null);
  const s = VA.synthese([{ id:'a', dateRealisee:'2026-01-01', clauses:['9.2', 'zz'], constats:[{ type:'Non-conformité', texte:'x', actions:[] }, { type:'Observation', texte:'y' }, null] }, { id:'b', annule:true, constats:[{ type:'Non-conformité', texte:'z' }] }, null, 'x'], [], '2026-02-01');
  check('synthese : annulés et entrées invalides ignorés, clause inconnue écartée, NC sans action', s.audits === 1 && s.annules === 1 && s.realises === 1 && s.nonConformites === 1 && s.ncSansAction === 1 && s.observations === 1 && J(s.clausesAuditees) === J(['9.2']), s);
  const pp = VA.pourPeriode([{ id:'a', datePrevue:'2025-12-01', dateRealisee:'2026-01-10', clauses:['9.2'] }, { id:'b', datePrevue:'2026-03-01' }, { id:'c', datePrevue:'2025-03-01' }], [], '2026-01-01', '2026-06-30', '2026-04-01');
  check('pourPeriode : réalisés à leur date de réalisation, sinon à leur date prévue', pp.audits === 2 && pp.realises === 1 && pp.depasses === 1, pp);
  check('nomClause : clause connue, inconnue, vide', VA.nomClause('9.2') === '9.2 Audit interne' && VA.nomClause('X') === 'X' && VA.nomClause('') === 'Autre critère');

  // ---------- 10. Droits, serveur, registre, libellés ----------
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const W = p.w;
  const defs = W.VigieDroits.MODULES ? W.VigieDroits.MODULES.find(m => m.id === 'audit-interne') : null;
  const res = (S) => W.VigieDroits.pour(S);
  check('catalogue : module « audit-interne » (Pilotage) ; Administrateur, RH et Préventeur gèrent, Manager consulte, Agent sans accès', (!W.VigieDroits.MODULES || (defs && defs.section === 'Pilotage')) && res(ADMIN).peut('audit-interne', 'gerer') && res(RH).peut('audit-interne', 'gerer') && res(PREV).peut('audit-interne', 'gerer') && res(MAN).peut('audit-interne', 'consulter') && !res(MAN).peut('audit-interne', 'gerer') && !res(AG).peut('audit-interne', 'consulter'));
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  const niv = (pr) => Droits.niveau(sess(pr), CLE);
  check('serveur, écriture : RH, Administrateur et Préventeur complet, manager aucun', niv(['p-rh']) === 'complet' && niv(['p-preventeur']) === 'complet' && niv(['p-manager']) === 'aucun' && niv(['p-admin']) === 'complet', [niv(['p-rh']), niv(['p-preventeur']), niv(['p-manager'])]);
  check('serveur : règle explicite pour la clé', Droits.cles.includes(CLE));
  const pageDe = (profils) => Object.assign(sess(profils), { droits: undefined });
  const vueAgent = JSON.parse(Lecture.vue(pageDe(['p-agent']), CLE, stockD[CLE]));
  const cles = vueAgent.map(r => Object.keys(r).sort().join(','));
  check('serveur, lecture : un agent ne reçoit que identifiant, titre, service, constats (pour ses actions)', vueAgent.length && cles.every(c => /^(constats,)?id,(service,)?titre$/.test(c)) && !vueAgent.some(r => 'auditeur' in r || 'conclusion' in r || 'independance' in r) && Lecture.regle(pageDe(['p-rh']), CLE) === null && Lecture.regle(pageDe(['p-manager']), CLE) === null, cles);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : clauses et indépendance', W.VigieLibelles.libelle(CLE, 'clauses') === 'Clauses d\'ISO 45001 auditées' && W.VigieLibelles.libelle(CLE, 'independance') === 'Indépendance de l\'auditeur');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
