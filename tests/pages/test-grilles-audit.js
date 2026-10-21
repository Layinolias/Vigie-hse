// Grilles de questions de l'audit interne (question 27, « Trames : oui », 2026-10-16) : grille proposée, choix dans un
// audit, réponses, constats des non-conformités, éditeur de grilles, lecture seule, rapport, export, serveur.
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const J = (o) => JSON.stringify(o);
const CLE = 'vigie_hse_audits_internes', CLE_G = 'vigie_hse_grilles_audit';

(async () => {
  // ---------- 1. La grille proposée ----------
  let p = await H.page('audit-interne.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui();
  const VA = p.w.VigieAuditInterne;
  const lignesG = () => [...p.d.querySelectorAll('#tbodyGrilles tr')];
  check('grilles : panneau pour qui gère, la grille proposée (30 questions, 30 clauses, « Proposée »)', H.visible(p.$('panelGrilles')) && lignesG().length === 1 && /Une question par clause/.test(lignesG()[0].textContent) && /Proposée/.test(lignesG()[0].textContent) && lignesG()[0].querySelectorAll('td.num')[0].textContent === '30' && lignesG()[0].querySelectorAll('td.num')[1].textContent === '30' && !p.erreurs.length, p.erreurs);
  check('… une question par clause, toutes les clauses connues', VA.GRILLE_DEFAUT.questions.length === 30 && J(VA.GRILLE_DEFAUT.questions.map(q => q.clause)) === J(VA.CLAUSES.map(c => c[0])));

  // ---------- 2. Un audit mené avec la grille ----------
  p.$('btnNouveau').click();
  check('nouvel audit : « Sans grille » par défaut, la grille proposée au choix', p.$('cGrille').value === '' && p.$('cGrille').options.length === 2 && /Sans grille/.test(p.$('cQuestions').textContent));
  p.$('cGrille').value = 'grille-iso45001'; p.ev(p.$('cGrille'), 'change');
  const qs = () => [...p.d.querySelectorAll('#cQuestions .question')];
  check('… grille choisie : 30 questions, leurs clauses cochées, 0 / 30 répondues', qs().length === 30 && [...p.d.querySelectorAll('#fiche [data-clause]')].every(c => c.checked) && /0 \/ 30 répondues/.test(p.$('cBilanQ').textContent));
  const repondre = (i, r, com) => { const el = qs()[i]; el.querySelector(`input[value="${r}"]`).checked = true; if (com !== undefined) el.querySelector('[data-q-commentaire]').value = com; p.ev(el.querySelector(`input[value="${r}"]`), 'change'); };
  repondre(0, 'Conforme'); repondre(1, 'Non conforme', 'Liste des parties intéressées absente'); repondre(2, 'Non concerné');
  check('… le bilan suit les réponses, et prévient que la non-conformité deviendra un constat', /3 \/ 30 répondues · 1 conforme, 1 non conforme, 1 non concernée/.test(p.$('cBilanQ').textContent) && /deviendra un constat/.test(p.$('cBilanQ').textContent), p.$('cBilanQ').textContent);
  p.$('cTitre').value = 'Audit du système 2026'; p.$('cPrevue').value = ajd; p.$('cAuditeur').value = 'Préventeur';
  p.ev(p.$('ficheForm'), 'submit');
  check('validation : des réponses demandent la date de réalisation', /la grille a des réponses/.test(p.alertes.pop() || '') && !p.lire(CLE));
  p.$('cRealisee').value = ajd;
  p.ev(p.$('ficheForm'), 'submit');
  let au = (p.lire(CLE) || [])[0] || {};
  const nc = (au.constats || []).find(k => k.questionId === 'gq-2') || {};
  check('enregistré : grille, 30 questions et leurs réponses, 30 clauses', au.grille && au.grille.id === 'grille-iso45001' && au.questions.length === 30 && au.questions[1].reponse === 'Non conforme' && au.questions[1].commentaire === 'Liste des parties intéressées absente' && au.questions[2].reponse === 'Non concerné' && au.questions[5].reponse === '' && au.clauses.length === 30, au.grille);
  check('… la réponse « Non conforme » est devenue un constat de non-conformité (clause, texte, lien à la question)', au.constats.length === 1 && nc.type === 'Non-conformité' && nc.clause === '4.2' && /parties intéressées et leurs attentes/.test(nc.texte) && /absente/.test(nc.texte));
  check('… dans la fiche : le constat signalé sans action ; la liste dit la grille', /Non-conformité sans action/.test(p.$('cConstats').textContent) && /Grille « Une question par clause d'ISO 45001 » : 3 \/ 30 répondues/.test(p.$('tbody').textContent));
  check('… journal d\'audit : la grille et ses réponses', (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Audit interne' && /grille « Une question par clause d'ISO 45001 » 3\/30/.test(a.description)));
  // une action sur le constat, puis la réponse changée : le constat reste (il a une action)
  p.d.querySelector('[data-ajout-action="0"]').click();
  p.d.querySelector('#cConstats .dyn-row[data-j] [data-a="description"]').value = 'Établir la liste des parties intéressées';
  p.ev(p.$('ficheForm'), 'submit');
  repondre(1, 'Conforme');
  p.ev(p.$('ficheForm'), 'submit');
  au = p.lire(CLE)[0];
  check('réponse changée : le constat qui a une action reste', au.questions[1].reponse === 'Conforme' && au.constats.length === 1 && au.constats[0].actions.length === 1);
  // sans action, il part
  repondre(3, 'Non conforme');
  p.ev(p.$('ficheForm'), 'submit');
  check('… une nouvelle non-conformité ajoute un constat', p.lire(CLE)[0].constats.length === 2);
  repondre(3, 'Conforme');
  p.ev(p.$('ficheForm'), 'submit');
  check('… changée à son tour, son constat sans action est retiré', p.lire(CLE)[0].constats.length === 1 && !p.lire(CLE)[0].constats.some(k => k.questionId === 'gq-4'));
  qs()[2].querySelector('[data-q-effacer]').click();
  check('« Effacer la réponse » : la question n\'est plus répondue', !qs()[2].querySelector('input:checked'));
  p.ev(p.$('ficheForm'), 'submit');
  check('… enregistré sans réponse', p.lire(CLE)[0].questions[2].reponse === '');

  // ---------- 3. Changer de grille ----------
  let confirmes = [];
  p.w.confirm = (m) => { confirmes.push(m); return false; };
  p.$('cGrille').value = ''; p.ev(p.$('cGrille'), 'change');
  check('changer de grille avec des réponses : confirmation ; refusée, la grille reste', /Les réponses déjà saisies seront perdues/.test(confirmes[0] || '') && p.$('cGrille').value === 'grille-iso45001' && qs().length === 30);

  // ---------- 4. Éditeur de grilles ----------
  p.w.confirm = (m) => { confirmes.push(m); return true; };
  p.$('btnNouvelleGrille').click();
  check('nouvelle grille : nom, description, une question à remplir', !!p.$('gNom') && p.d.querySelectorAll('#grilleEdit .grille-q').length === 1 && p.d.querySelectorAll('#grilleEdit [data-g-clause] option').length === 31);
  p.ev(p.$('grilleForm'), 'submit');
  check('validation : le nom', /nom de la grille/.test(p.alertes.pop() || ''));
  p.$('gNom').value = 'Audit des entreprises extérieures';
  p.ev(p.$('grilleForm'), 'submit');
  check('validation : au moins une question', /au moins une question/.test(p.alertes.pop() || ''));
  let rows = p.d.querySelectorAll('#grilleEdit .grille-q');
  rows[0].querySelector('[data-g-clause]').value = '8.1.4'; rows[0].querySelector('[data-g-texte]').value = 'Un plan de prévention est-il établi avant toute intervention ?';
  p.$('gAjout').click();
  rows = p.d.querySelectorAll('#grilleEdit .grille-q');
  rows[1].querySelector('[data-g-texte]').value = 'Le permis de feu est-il délivré ?';
  p.$('gAjout').click();
  p.d.querySelector('[data-g-retirer="2"]').click();
  p.ev(p.$('grilleForm'), 'submit');
  let gs = p.lire(CLE_G) || [];
  const ee = gs.find(g => g.nom === 'Audit des entreprises extérieures') || {};
  check('grille enregistrée : deux questions (une clause, un autre critère), avec la grille proposée', gs.length === 2 && gs[0].id === 'grille-iso45001' && ee.questions && ee.questions.length === 2 && ee.questions[0].clause === '8.1.4' && ee.questions[1].clause === '' && lignesG().length === 2, gs.map(g => g.nom));
  // la grille proposée modifiée : les audits déjà menés gardent leurs questions
  p.d.querySelector('[data-grille="grille-iso45001"]').click();
  check('modifier la grille proposée : pas de suppression possible', !p.$('gSupprimer') && p.$('gNom').value === 'Une question par clause d\'ISO 45001');
  p.d.querySelector('#grilleEdit .grille-q [data-g-texte]').value = 'Question 4.1 reformulée ?';
  p.ev(p.$('grilleForm'), 'submit');
  gs = p.lire(CLE_G);
  check('… enregistrée sous son identifiant ; l\'audit déjà mené garde la question d\'origine', gs[0].id === 'grille-iso45001' && gs[0].questions[0].texte === 'Question 4.1 reformulée ?' && /enjeux internes et externes/.test(p.lire(CLE)[0].questions[0].texte));
  check('… le tableau compte l\'audit qui l\'utilise', lignesG()[0].querySelectorAll('td.num')[2].textContent === '1');
  // un deuxième audit avec la grille EE, puis la grille supprimée
  p.$('btnNouveau').click();
  check('nouvel audit : les deux grilles au choix', p.$('cGrille').options.length === 3);
  p.$('cGrille').value = ee.id; p.ev(p.$('cGrille'), 'change');
  check('… grille EE : 2 questions, la clause 8.1.4 cochée seulement', qs().length === 2 && p.d.querySelector('#fiche [data-clause="8.1.4"]').checked && p.d.querySelectorAll('#fiche [data-clause]:checked').length === 1);
  p.$('cTitre').value = 'Audit EE'; p.$('cPrevue').value = ajd;
  p.ev(p.$('ficheForm'), 'submit');
  const auEE = (p.lire(CLE) || []).find(a => a.titre === 'Audit EE') || {};
  check('… prévu, sans réponse : enregistré sans date de réalisation, sans constat', auEE.grille && auEE.grille.id === ee.id && auEE.questions.length === 2 && !auEE.dateRealisee && !(auEE.constats || []).length);
  p.d.querySelector(`[data-grille="${ee.id}"]`).click();
  p.$('gSupprimer').click();
  check('supprimer une grille : confirmation, l\'audit garde ses questions', /gardent leurs questions/.test(confirmes.pop() || '') && !(p.lire(CLE_G) || []).some(g => g.id === ee.id) && (p.lire(CLE) || []).find(a => a.titre === 'Audit EE').questions.length === 2);
  p.$('tbody').querySelector('[data-ouvrir]');
  [...p.d.querySelectorAll('#tbody tr')].find(tr => /Audit EE/.test(tr.textContent)).querySelector('[data-ouvrir]').click();
  check('… dans l\'audit, la grille dite « supprimée depuis »', /supprimée depuis/.test(p.$('cGrille').selectedOptions[0].textContent) && qs().length === 2);
  p.$('cGrille').value = ''; p.ev(p.$('cGrille'), 'change');
  check('… « Sans grille » (sans réponse, pas de confirmation) : questions retirées', qs().length === 0);
  p.ev(p.$('ficheForm'), 'submit');
  const auEE2 = (p.lire(CLE) || []).find(a => a.titre === 'Audit EE');
  check('… enregistré sans grille ni questions', !('grille' in auEE2) && !('questions' in auEE2));

  // ---------- 5. Rapport, export ----------
  let imprime = null;
  p.w.print = () => { imprime = p.d.getElementById('ai-impression') ? p.d.getElementById('ai-impression').textContent : ''; };
  [...p.d.querySelectorAll('#tbody tr')].find(tr => /Audit du système 2026/.test(tr.textContent)).querySelector('[data-ouvrir]').click();
  p.$('btnRapport').click();
  check('rapport : la grille, ses réponses et commentaires', /Grille de questions — Une question par clause/.test(imprime || '') && /Non concerné|Conforme/.test(imprime) && /enjeux internes et externes/.test(imprime));
  p.ev(p.w, 'afterprint');
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  const fg = wb ? H.XLSX.utils.sheet_to_json(wb.Sheets['Grilles'], { defval:'' }) : [];
  check('export : feuille « Grilles » (30 questions, réponse, commentaire)', fg.length === 30 && fg.some(r => r['Clause'] === '4.2' && r['Réponse'] === 'Conforme' && /absente/.test(r['Commentaire'])), fg.slice(0, 2));

  // ---------- 6. Lecture seule ----------
  const stock = p.stockage();
  const pm = await H.page('audit-interne.html', MAN, stock, '?ouvrir=' + au.id);
  check('manager : pas de panneau des grilles ; la grille de l\'audit en lecture (réponses figées, commentaires en texte)', !H.visible(pm.$('panelGrilles')) && pm.$('cGrille').disabled && pm.d.querySelectorAll('#cQuestions input[type="radio"]:not([disabled])').length === 0 && !pm.d.querySelector('[data-q-effacer]') && !pm.d.querySelector('[data-q-commentaire]') && /absente/.test(pm.$('cQuestions').textContent) && !pm.erreurs.length, pm.erreurs);

  // ---------- 7. Logique partagée, serveur, registre ----------
  check('bilanQuestions', J(VA.bilanQuestions({ questions:[{ id:'a', reponse:'Conforme' }, { id:'b', reponse:'Non conforme' }, { id:'c', reponse:'Non concerné' }, { id:'d', reponse:'' }, { id:'e', reponse:'Peut-être' }, null] })) === J({ total:5, repondues:3, conformes:1, nonConformes:1, nonConcernes:1 }));
  let n = 0;
  const cr = VA.constatsDesReponses([{ id:'q1', clause:'9.2', texte:'Q1 ?', reponse:'Non conforme', commentaire:'' }, { id:'q2', texte:'Q2 ?', reponse:'Conforme' }, { id:'q3', texte:'Q3 ?', reponse:'Conforme' }],
    [{ id:'k2', questionId:'q2', texte:'Q2 ?', actions:[] }, { id:'k3', questionId:'q3', texte:'Q3 ?', actions:[{ id:'a', description:'faire' }] }, { id:'k9', texte:'libre', actions:[] }], () => 'n' + (++n));
  check('constatsDesReponses : ajoute (NC), retire (sans action), garde (avec action, ou libre)', cr.ajoutes === 1 && cr.retires === 1 && cr.gardes === 1 && J(cr.constats.map(k => k.id)) === J(['k3', 'k9', 'n1']) && cr.constats[2].clause === '9.2' && cr.constats[2].texte === 'Q1 ?', cr);
  const gl = VA.grilles([{ id:'grille-iso45001', nom:'Maison', questions:[] }, { id:'x', nom:'X', questions:[] }, { id:'y' }, null]);
  check('grilles : la grille proposée telle qu\'enregistrée en tête, les autres ensuite, les invalides écartées', gl.length === 2 && gl[0].nom === 'Maison' && gl[1].id === 'x' && VA.grilles([])[0].questions.length === 30);
  const Droits = require(H.ROOT + 'serveur/droits.js'), Lecture = require(H.ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : qui gère l\'audit interne écrit les grilles', Droits.niveau(sess(['p-preventeur']), CLE_G) === 'complet' && Droits.niveau(sess(['p-manager']), CLE_G) === 'aucun' && Droits.cles.includes(CLE_G));
  check('serveur, lecture : grilles retirées d\'un compte sans accès à l\'audit interne', Lecture.regle(sess(['p-agent']), CLE_G) === Lecture.RETIRE && Lecture.regle(sess(['p-preventeur']), CLE_G) === null);
  check('registre : paramètres, non sensible', p.w.VigieStore.CLES[CLE_G] && p.w.VigieStore.CLES[CLE_G].nature === 'parametres' && p.w.VigieStore.CLES[CLE_G].sensible === false);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
