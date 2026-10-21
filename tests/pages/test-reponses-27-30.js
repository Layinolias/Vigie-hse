// Réponses du préventeur aux questions 27 à 30 (2026-10-16) : audit interne (auditeurs proposés, sans indépendance,
// « Non concerné »), politique (un an par défaut, risques psychosociaux, remise tracée à l'Accueil au poste), gestion des
// changements (Document unique par défaut et rappelé, revue prévue, représentants), contexte (importance, revue annuelle).
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const REP = { user:'REP1', role:'ag', email:'REP1', services:['*'], profils:['p-representant'] };
const J = (o) => JSON.stringify(o);
const ENT = { vigie_hse_referentials: J({ organisation: { secteur:'entreprise' } }) };

(async () => {
  // ---------- Q27 — audit interne ----------
  let p = await H.page('audit-interne.html', PREV, {});
  const ajd = p.w.VigieDates.aujourdhui(), an = Number(ajd.slice(0, 4));
  const unAn = (d) => (Number(d.slice(0, 4)) + 1) + d.slice(4);
  p.$('btnNouveau').click();
  check('audit : auditeurs proposés (préventeur, ACFI), plus de champ « indépendance »', J([...p.d.querySelectorAll('#cAuditeurs option')].map(o => o.value)) === J(['Préventeur', 'ACFI (centre de gestion)']) && p.$('cAuditeur').getAttribute('list') === 'cAuditeurs' && !p.$('cIndependance') && !/Indépendance de l'auditeur/.test(p.$('fiche').textContent));
  check('… « Non concerné » parmi les types de constat', p.w.VigieAuditInterne.TYPES.includes('Non concerné'));
  const au = { id:'au-1', titre:'Audit des EPI', clauses:['8.1.2'], datePrevue: ajd, dateRealisee: ajd, auditeur:'ACFI', independance:'Agent extérieur', constats:[{ id:'k1', clause:'8.1.2', type:'Non concerné', texte:'Pas de coactivité sur ce site' }, { id:'k2', clause:'8.1.2', type:'Point fort', texte:'Dotation suivie' }] };
  p = await H.page('audit-interne.html', PREV, { vigie_hse_audits_internes: J([au]) }, '?ouvrir=au-1');
  check('… un audit déjà saisi garde son indépendance, lisible ; ses constats « Non concerné » sont comptés', /Indépendance de l'auditeur \(saisie avant le 16 octobre 2026\)/.test(p.$('fiche').textContent) && /Agent extérieur/.test(p.$('fiche').textContent) && /1 non concerné/.test(p.$('tbody').textContent) && p.w.VigieAuditInterne.synthese([au], [], ajd).nonConcernes === 1);
  p.ev(p.$('ficheForm'), 'submit');
  check('… enregistré de nouveau : l\'indépendance déjà saisie est gardée', (p.lire('vigie_hse_audits_internes') || [])[0].independance === 'Agent extérieur' && !p.alertes.length, p.alertes);
  p.$('btnExport').click();
  const wb = (p.ecrits.pop() || {}).wb;
  check('… export : colonne « Non concernés »', wb && H.XLSX.utils.sheet_to_json(wb.Sheets['Audits'])[0]['Non concernés'] === 1);
  p = await H.page('audit-interne.html', RH, ENT);
  p.$('btnNouveau').click();
  check('… secteur entreprise : seul le préventeur est proposé', J([...p.d.querySelectorAll('#cAuditeurs option')].map(o => o.value)) === J(['Préventeur']));

  // ---------- Q28 — politique ----------
  p = await H.page('politique-sante-securite.html', PREV, {});
  check('politique : sept engagements, dont les risques psychosociaux', p.w.VigiePolitique.ENGAGEMENTS.length === 7 && p.w.VigiePolitique.ENGAGEMENTS.some(e => e[0] === 'rps' && /risques psychosociaux/.test(e[1])));
  check('… un an après : date locale, 29 février compris', p.w.VigiePolitique.unAnApres('2026-10-16') === '2027-10-16' && p.w.VigiePolitique.unAnApres('2028-02-29') === '2029-03-01' && p.w.VigiePolitique.unAnApres('') === '');
  const bRediger = p.d.querySelector('#btnRediger, [data-action="rediger"]') || [...p.d.querySelectorAll('button')].find(b => /Rédiger/.test(b.textContent));
  bRediger.click();
  check('… brouillon : sept cases, la prochaine revue dite « un an par défaut »', p.d.querySelectorAll('#brouillon [data-engagement], #brouillon input[type="checkbox"][value]').length >= 7 && /un an par défaut/.test(p.$('brouillon').textContent) && /risques psychosociaux/.test(p.$('brouillon').textContent));
  p.$('dSignature').value = ajd; p.ev(p.$('dSignature'), 'change');
  check('… signature saisie : prochaine revue un an après', p.$('dRevue').value === unAn(ajd), p.$('dRevue').value);
  p.$('dSignature').value = (an - 1) + '-03-10'; p.ev(p.$('dSignature'), 'change');
  check('… signature changée : la date proposée suit', p.$('dRevue').value === an + '-03-10');
  p.$('dRevue').value = (an + 2) + '-01-01'; p.ev(p.$('dRevue'), 'change');
  p.$('dSignature').value = ajd; p.ev(p.$('dSignature'), 'change');
  check('… une date choisie à la main reste', p.$('dRevue').value === (an + 2) + '-01-01');
  const v1 = { id:'pol-1', version:1, statut:'En vigueur', texte:'Notre politique', engagements:['conditions'], signataire:'Mme Dupont', dateSignature: ajd, publieLe: ajd, demanderLecture:true };
  p = await H.page('politique-sante-securite.html', PREV, { vigie_hse_politiques: J([v1]) });
  check('… revue : prochaine revue proposée un an après la date du jour', p.$('rProchaine') && p.$('rProchaine').value === unAn(ajd), p.$('rProchaine') && p.$('rProchaine').value);
  p.$('rDate').value = (an - 1) + '-06-01'; p.ev(p.$('rDate'), 'change');
  check('… date de revue changée : la proposition suit', p.$('rProchaine').value === an + '-06-01');
  check('… la remise aux agents se trace à l\'Accueil au poste (dit dans le suivi)', /Accueil au poste/.test(p.$('suivi').textContent) && /Remise et explication de la politique/.test(p.$('suivi').textContent));

  // ---------- Q28 — Accueil au poste ----------
  p = await H.page('accueil-poste.html', RH, {});
  let tpl = (p.lire('vigie_hse_modeles_accueil') || []).find(t => t.id === 'tpl-accueil-defaut') || {};
  check('accueil : le modèle par défaut a neuf points, le dernier « Remise et explication de la politique »', tpl.points && tpl.points.length === 9 && tpl.points[8].id === 'pt-d9' && /politique de santé et de sécurité/.test(tpl.points[8].libelle) && J(tpl.ajoutsVus) === J(['pt-d9']), tpl);
  const ancien = { id:'tpl-accueil-defaut', nom:'Parcours maison', description:'', points: [{ id:'pt-d1', libelle:'Présentation' }, { id:'x', libelle:'Point ajouté par le service' }] };
  const accueil = { id:'ap-1', agent:'Durand', service:'Voirie & Réseaux', points:[{ id:'pt-d1', libelle:'Présentation', fait:true }] };
  p = await H.page('accueil-poste.html', RH, { vigie_hse_modeles_accueil: J([ancien]), vigie_hse_accueils: J([accueil]) });
  tpl = (p.lire('vigie_hse_modeles_accueil') || []).find(t => t.id === 'tpl-accueil-defaut') || {};
  check('… un modèle par défaut déjà enregistré reçoit le point une fois, ses propres points gardés', tpl.nom === 'Parcours maison' && tpl.points.length === 3 && tpl.points[1].id === 'x' && tpl.points[2].id === 'pt-d9' && J(tpl.ajoutsVus) === J(['pt-d9']), tpl);
  check('… les accueils existants gardent leurs points', J((p.lire('vigie_hse_accueils') || [])[0].points) === J(accueil.points));
  const retire = Object.assign({}, ancien, { ajoutsVus: ['pt-d9'] });
  p = await H.page('accueil-poste.html', RH, { vigie_hse_modeles_accueil: J([retire]) });
  tpl = (p.lire('vigie_hse_modeles_accueil') || []).find(t => t.id === 'tpl-accueil-defaut') || {};
  check('… retiré ensuite du modèle, il ne revient pas', tpl.points.length === 2 && !tpl.points.some(x => x.id === 'pt-d9'));

  // ---------- Q29 — gestion des changements ----------
  p = await H.page('changements.html', PREV, {});
  p.$('btnNouveau').click();
  check('changements : « Document unique à mettre à jour » coché par défaut, validé par « le préventeur, en général »', p.$('cDuerp').checked && /préventeur/.test(p.$('cValidePar').placeholder) && !!p.$('cRevuePrevue'));
  const remplir = (o) => { for (const [k, v] of Object.entries(o)) p.$(k).value = v; };
  remplir({ cTitre:'Nouvelle tondeuse', cPrevue: ajd, cMiseEnOeuvre: ajd, cValide: ajd, cValidePar: 'Préventeur', cRevuePrevue: (an - 1) + '-01-01' });
  p.ev(p.$('ficheForm'), 'submit');
  check('… une revue prévue avant la mise en œuvre est refusée', /ne peut pas précéder la mise en œuvre/.test(p.alertes.pop() || ''));
  remplir({ cRevuePrevue: unAn(ajd) });
  p.ev(p.$('ficheForm'), 'submit');
  let c = (p.lire('vigie_hse_changements') || [])[0] || {};
  check('… revue prévue enregistrée, Document unique à mettre à jour', c.revuePrevue === unAn(ajd) && c.duerp === true, c);
  const VC = p.w.VigieChangements;
  check('… revue en retard une fois la date passée (et seulement si mis en œuvre, pas revu)', VC.alertes({ id:'a', dateMiseEnOeuvre:'2026-01-01', revuePrevue:'2026-02-01' }, [], '2026-03-01').some(a => a.code === 'revueRetard' && /01\/02\/2026/.test(a.texte)) && !VC.alertes({ id:'a', dateMiseEnOeuvre:'2026-01-01', revuePrevue:'2026-02-01', revueLe:'2026-02-02' }, [], '2026-03-01').some(a => a.code === 'revueRetard') && !VC.alertes({ id:'a', revuePrevue:'2026-02-01' }, [], '2026-03-01').some(a => a.code === 'revueRetard') && VC.synthese([{ id:'a', dateMiseEnOeuvre:'2026-01-01', revuePrevue:'2026-02-01' }], [], '2026-03-01').revuesEnRetard === 1);
  const chg = [c, { id:'chg-2', titre:'Travaux atelier', datePrevue: unAn(ajd), risques:[] }];
  p = await H.page('changements.html', PREV, { vigie_hse_changements: J(chg) }, '?attention=duerp');
  check('… lien du rappel : filtre « Document unique à mettre à jour »', p.$('fAttention').value === 'duerp' && /Nouvelle tondeuse/.test(p.$('tbody').textContent) && !/Travaux atelier/.test(p.$('tbody').textContent));
  let d = await H.page('dashboard.html', PREV, { vigie_hse_changements: J(chg) });
  check('tableau de bord du préventeur : rappel « Document unique à mettre à jour », lien vers les changements', H.visible(d.$('duerpRappel')) && /1 changement le demande/.test(d.$('duerpRappel').textContent) && /Nouvelle tondeuse/.test(d.$('duerpRappel').textContent) && !!d.$('duerpRappel').querySelector('a[href="changements.html?attention=duerp"]') && !d.erreurs.length, d.erreurs);
  d = await H.page('dashboard.html', MAN, { vigie_hse_changements: J(chg) });
  check('… pas de rappel pour qui ne tient pas les changements', !H.visible(d.$('duerpRappel')));
  d = await H.page('dashboard.html', PREV, { vigie_hse_changements: J([Object.assign({}, c, { duerpLe: ajd })]) });
  check('… plus de rappel une fois la mise à jour datée', !H.visible(d.$('duerpRappel')));
  let du = await H.page('document-unique.html', PREV, { vigie_hse_changements: J(chg) });
  check('Document unique : bandeau des changements qui demandent sa mise à jour', H.visible(du.$('duRappel')) && /1 changement demande la mise à jour du Document unique/.test(du.$('duRappel').textContent) && !du.erreurs.length, du.erreurs);
  du = await H.page('document-unique.html', PREV, {});
  check('… aucun bandeau sans changement en attente', !H.visible(du.$('duRappel')) && !du.erreurs.length);
  p = await H.page('changements.html', REP, { vigie_hse_changements: J(chg) });
  check('représentant du personnel : lit les changements, sans rien modifier', !p.navigation() && !p.$('btnNouveau') && /Nouvelle tondeuse/.test(p.$('tbody').textContent) && !p.erreurs.length);

  // ---------- Q30 — contexte ----------
  p = await H.page('contexte.html', PREV, {});
  check('contexte : importance élevée, moyenne, faible ; registre vide, pas de revue à faire', J(p.w.VigieContexte.NIVEAUX) === J(['Élevée', 'Moyenne', 'Faible']) && !/Revue annuelle à faire/.test(p.$('revueNote').textContent) && !p.$('btnRevueRegistre'));
  p.d.querySelector('[data-nouveau="ro"]').click();
  p.$('cTexte').value = 'Départ du seul assistant de prévention';
  p.ev(p.$('ficheForm'), 'submit');
  check('… l\'importance est demandée', /Indiquez son importance/.test(p.alertes.pop() || '') && !p.lire('vigie_hse_contexte'));
  p.$('cNiveau').value = 'Faible';
  p.ev(p.$('ficheForm'), 'submit');
  const ro = (p.lire('vigie_hse_contexte') || [])[0] || {};
  check('… enregistrée, affichée ; registre jamais revu : « Revue annuelle à faire »', ro.niveau === 'Faible' && /Faible/.test(p.$('tbRo').textContent) && /n'a pas encore eu de revue annuelle/.test(p.$('revueNote').textContent) && /Revue annuelle à faire/.test(p.$('revueNote').textContent) && !!p.$('btnRevueRegistre'));
  p.w.prompt = () => 'Registre relu avec la direction';
  p.$('btnRevueRegistre').click();
  const rv = (p.lire('vigie_hse_contexte') || []).find(x => x.registre === 'revue') || {};
  check('… revue annuelle enregistrée (date, par qui, constat) : plus « à faire », prochaine dans un an', rv.date === ajd && rv.par === 'PREV1' && /direction/.test(rv.constat) && /Dernière revue annuelle le/.test(p.$('revueNote').textContent) && !/Revue annuelle à faire/.test(p.$('revueNote').textContent) && p.$('revueNote').textContent.includes(unAn(ajd).split('-').reverse().join('/')));
  check('… la revue n\'est pas un élément des registres (compteurs inchangés)', p.$('kpiRo').textContent === '1' && p.$('kpiEnjeux').textContent === '0');
  const VX = p.w.VigieContexte;
  const L = [{ id:'r', registre:'ro', texte:'x' }, { id:'v', registre:'revue', date:'2025-01-10', constat:'ok' }];
  check('… revueAFaire : un an après la dernière ; pourPeriode : la revue dans les mouvements', VX.revueAFaire(L, '2026-01-10') && !VX.revueAFaire(L, '2026-01-09') && VX.pourPeriode(L, [], '2025-01-01', '2025-12-31').mouvements.some(m => m.quoi === 'Revu') && VX.synthese(L, []).derniereRevue === '2025-01-10');
  const pl = await H.page('plan-actions.html', RH, { vigie_hse_contexte: J([{ id:'r1', registre:'ro', type:'Risque', niveau:'Faible', texte:'a', actions:[{ id:'1', description:'m' }] }, { id:'r2', registre:'ro', type:'Risque', texte:'b', actions:[{ id:'2', description:'n' }] }]) });
  const pr = (id) => ((pl.lire('vigie_hse_actions') || []).find(a => a.id === id) || {}).priorite;
  check('Plan d\'actions : priorité selon l\'importance (faible → basse ; non évaluée → moyenne)', pr('pa-ro-r1-1') === 'Basse' && pr('pa-ro-r2-2') === 'Moyenne');
  const rd = await H.page('revue-direction.html', RH, p.stockage());
  rd.$('btnNouvelle').click();
  check('revue de direction : la dernière revue annuelle du registre', /Dernière revue annuelle du registre le/.test(rd.$('revue').textContent) && /d'importance élevée/.test(rd.$('revue').textContent) && !rd.erreurs.length, rd.erreurs);
  p = await H.page('contexte.html', REP, p.stockage());
  check('représentant du personnel : lit le contexte, sans rien modifier', !p.navigation() && !p.d.querySelector('[data-nouveau]') && !p.$('btnRevueRegistre') && /Départ du seul assistant/.test(p.$('tbRo').textContent) && !p.erreurs.length);

  // ---------- Droits ----------
  const W = p.w, rep = W.VigieDroits.pour(REP), man = W.VigieDroits.pour(MAN);
  check('droits : le représentant consulte changements et contexte, sans les gérer ; le manager inchangé', rep.peut('changements', 'consulter') && rep.peut('contexte', 'consulter') && !rep.peut('changements', 'gerer') && !rep.peut('contexte', 'gerer') && man.peut('contexte', 'consulter') && !man.peut('contexte', 'gerer'));
  const Lecture = require(H.ROOT + 'serveur/lecture.js');
  const page = { user:'x', profils:['p-representant'], services:['*'] };
  check('serveur : le représentant reçoit changements et contexte en entier', Lecture.regle(page, 'vigie_hse_changements') === null && Lecture.regle(page, 'vigie_hse_contexte') === null);

  fin();
})().catch(e => { console.error(e); process.exit(2); });
