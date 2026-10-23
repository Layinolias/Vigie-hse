// Rôles de prévention (ISO 45001 § 5.3, 2026-10-18) : composant, page (création, contrôles, Gestion RH, fin de fonction,
// filtres, export, impression, suppression, lecture seule, périmètre), droits, serveur, Préparation ISO 45001.   node test-roles-prevention.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT, XLSX = H.XLSX;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const REP = { user:'REP1', role:'ag', email:'REP1', services:['*'], profils:['p-representant'] };
const V = 'Voirie & Réseaux', P = 'Patrimoine Bâti';
const CLE = 'vigie_hse_roles_prevention';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('roles-prevention.html', PREV, {});
  const R = p0.w.VigieRoles, AJD = p0.w.VigieDates.aujourdhui();
  const hier = p0.w.VigieDates.iso(new Date(Date.now() - 86400000 * 2)), demain = p0.w.VigieDates.iso(new Date(Date.now() + 86400000 * 2));
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  check('suggestions : collectivité (assistant de prévention, ACFI, F3SCT), entreprise (salarié désigné, CSSCT)', R.suggestions('collectivite').includes('Assistant de prévention') && R.suggestions('collectivite').some(s => /ACFI/.test(s)) && R.suggestions('collectivite').includes('Membre de la F3SCT')
    && R.suggestions('entreprise').some(s => /Salarié désigné/.test(s)) && R.suggestions('entreprise').includes('Membre de la CSSCT') && R.suggestions('inconnu').length === R.suggestions('collectivite').length);
  const r1 = { id:'r1', role:'Assistant de prévention', personne:'Jean Martin', mission:'Conseiller', designeLe:'2025-01-10' };
  check('état : en fonction, à compléter (mission, date), terminé (fin passée ou du jour), fin future = en fonction',
    R.etat(r1, AJD).code === 'enfonction' && R.etat({ role:'x' }, AJD).code === 'acompleter' && J(R.manques({ role:'x' })) === J(['mission', 'date de désignation'])
    && R.etat(Object.assign({}, r1, { finLe: hier }), AJD).code === 'termine' && R.etat(Object.assign({}, r1, { finLe: AJD }), AJD).code === 'termine' && R.etat(Object.assign({}, r1, { finLe: demain }), AJD).code === 'enfonction');
  const s0 = R.synthese([r1, { id:'r2', role:'Assistant de prévention', personne:'jean  martin' }, { id:'r3', role:'SST', personne:'Paul', agentId:'ag1' }, { id:'r4', role:'SST', personne:'Paul (autre)', agentId:'ag1' }, { id:'r5', role:'ACFI', personne:'X', finLe: hier }, { role:'sans id' }, null], AJD);
  check('synthèse : en fonction 4, terminés 1, personnes 2 (nom sans casse ni espaces, fiche RH), rôles 2, à compléter 3', s0.enFonction === 4 && s0.termines === 1 && s0.personnes === 2 && s0.roles === 2 && s0.aCompleter === 3, s0);

  // ---------- 2. Page : création ----------
  const AGENTS = [{ id:'ag1', nom:'MARTIN', prenom:'Jean', service:V, actif:true }, { id:'ag2', nom:'DURAND', prenom:'Lucie', service:P, actif:true }];
  let p = await H.page('roles-prevention.html', PREV, { vigie_hse_agents: J(AGENTS) });
  check('vide : compteurs à 0, invitation à ajouter', p.$('kpiEnFonction').textContent === '0' && /Ajouter un rôle/.test(p.$('tbRoles').textContent) && /Registre vide/.test(p.$('majNote').textContent));
  p.$('btnNouveau').click();
  check('« Ajouter un rôle » : fiche ouverte, suggestions, périmètre « Toute l\'organisation » puis les services', H.visible(p.$('fiche')) && p.d.querySelectorAll('#cRolesListe option').length === R.suggestions('collectivite').length
    && p.$('cService').options[0].value === '' && /Toute l'organisation/.test(p.$('cService').options[0].text) && [...p.$('cService').options].some(o => o.value === V));
  p.ev(p.$('ficheForm'), 'submit');
  check('sans rôle : refusé', /Indiquez le rôle/.test(p.alertes.pop() || '') && !(p.lire(CLE) || []).length);
  p.$('cRole').value = 'Assistant de prévention'; p.ev(p.$('ficheForm'), 'submit');
  check('sans personne : refusé', /la personne/.test(p.alertes.pop() || '') && !(p.lire(CLE) || []).length);
  // choisir dans Gestion RH
  check('Gestion RH : les agents proposés', p.$('cAgent').options.length === 3 && /DURAND Lucie/.test(p.$('cAgent').options[1].text) && /MARTIN Jean/.test(p.$('cAgent').options[2].text));
  p.$('cAgent').value = 'ag1'; p.ev(p.$('cAgent'), 'change');
  check('… choisi : le nom rempli', p.$('cPersonne').value === 'Jean MARTIN');
  p.$('cDesigneLe').value = '2025-03-01'; p.$('cFinLe').value = '2025-01-01'; p.ev(p.$('ficheForm'), 'submit');
  check('fin avant la désignation : refusée', /précéder la désignation/.test(p.alertes.pop() || '') && !(p.lire(CLE) || []).length);
  p.$('cFinLe').value = '';
  p.$('cMission').value = 'Conseille et assiste l\'autorité, 20 % du temps'; p.$('cDesignePar').value = 'Le Maire'; p.$('cLettre').value = 'https://intranet.example/lettre-ap.pdf';
  p.$('cFormation').value = 'Formation initiale, 5 jours'; p.$('cFormationLe').value = '2025-02-15'; p.$('cContact').value = '01 23 45 67 89';
  p.ev(p.$('ficheForm'), 'submit');
  let l = p.lire(CLE) || [], a1 = l[0] || {};
  check('enregistré : rôle, personne, fiche RH, mission, désignation, lettre, formation, contact ; toute l\'organisation (pas de service)', l.length === 1 && a1.role === 'Assistant de prévention' && a1.personne === 'Jean MARTIN' && a1.agentId === 'ag1'
    && a1.designeLe === '2025-03-01' && a1.designePar === 'Le Maire' && a1.formationLe === '2025-02-15' && a1.contact === '01 23 45 67 89' && !('service' in a1) && !('finLe' in a1) && a1.auteur === 'PREV1' && /^role-/.test(a1.id), a1);
  check('… journal : création', (p.lire('vigie_hse_audit_log') || []).some(x => x.module === 'Rôles de prévention' && x.type === 'Création' && /Assistant de prévention/.test(x.description)));
  check('… la fiche se rouvre : « En fonction », lien vers la lettre (http seulement)', /En fonction/.test(p.$('fiche').textContent) && (p.d.querySelector('#fiche a.lien-lettre') || {}).href === 'https://intranet.example/lettre-ap.pdf'
    && p.$('cAgent').value === 'ag1');
  // nom retapé : n'est plus la fiche RH
  p.$('cPersonne').value = 'Jean Martin-Durand'; p.ev(p.$('ficheForm'), 'submit');
  a1 = p.lire(CLE)[0];
  check('nom retapé à la main : la fiche RH est détachée', a1.personne === 'Jean Martin-Durand' && !('agentId' in a1) && a1.modifiePar === 'PREV1');
  // un second rôle, à compléter, sur un service
  p.$('btnNouveau').click();
  p.$('cRole').value = 'Sauveteur secouriste du travail'; p.$('cPersonne').value = 'Lucie Durand'; p.$('cService').value = P;
  p.ev(p.$('ficheForm'), 'submit');
  l = p.lire(CLE);
  const a2 = l.find(x => x.personne === 'Lucie Durand');
  check('second rôle : service posé, champs vides absents', a2 && a2.service === P && !('mission' in a2) && !('designeLe' in a2) && !('lettre' in a2));
  check('liste : 2 rôles, à compléter dit ce qui manque', p.d.querySelectorAll('#tbRoles tr[data-id]').length === 2 && /manque : mission, date de désignation/.test(p.d.querySelector(`#tbRoles tr[data-id="${a2.id}"]`).textContent));
  check('compteurs : 2 en fonction, 2 personnes, 1 à compléter, 0 terminé', p.$('kpiEnFonction').textContent === '2' && p.$('kpiPersonnes').textContent === '2' && p.$('kpiCompleter').textContent === '1' && p.$('kpiTermines').textContent === '0');
  // vider un champ le retire
  p.ev(p.d.querySelector(`[data-ouvrir="${a1.id}"]`), 'click');
  p.$('cContact').value = ''; p.ev(p.$('ficheForm'), 'submit');
  check('champ vidé : retiré de l\'enregistrement', !('contact' in p.lire(CLE).find(x => x.id === a1.id)));
  // fin de fonction
  p.ev(p.d.querySelector(`[data-ouvrir="${a2.id}"]`), 'click');
  p.$('cFinLe').value = hier; p.$('cMotifFin').value = 'Départ'; p.ev(p.$('ficheForm'), 'submit');
  check('fin de fonction passée : « Terminé », caché de la liste, compté', p.d.querySelectorAll('#tbRoles tr[data-id]').length === 1 && p.$('kpiTermines').textContent === '1' && p.$('kpiCompleter').textContent === '0' && /1 rôle terminé/.test(p.$('majNote').textContent));
  p.$('fTermines').checked = true; p.ev(p.$('fTermines'), 'change');
  check('« Afficher les rôles terminés » : en fin de liste, grisé, avec sa date', p.d.querySelectorAll('#tbRoles tr[data-id]').length === 2 && p.d.querySelector('#tbRoles tr[data-id]:last-child').classList.contains('retire') && /Terminé/.test(p.d.querySelector('#tbRoles tr[data-id]:last-child').textContent));
  // filtres
  check('filtre des rôles : les rôles présents', J([...p.$('fRole').options].map(o => o.value)) === J(['', 'Assistant de prévention', 'Sauveteur secouriste du travail']));
  p.$('fRole').value = 'Sauveteur secouriste du travail'; p.ev(p.$('fRole'), 'change');
  check('… un rôle choisi : ses seules lignes', p.d.querySelectorAll('#tbRoles tr[data-id]').length === 1 && /Lucie/.test(p.$('tbRoles').textContent));
  p.$('fRole').value = ''; p.ev(p.$('fRole'), 'change');
  p.$('fTexte').value = 'MARTIN-durand'; p.ev(p.$('fTexte'), 'input');
  check('recherche sans casse', p.d.querySelectorAll('#tbRoles tr[data-id]').length === 1 && /Assistant/.test(p.$('tbRoles').textContent));
  p.$('fTexte').value = 'zzz'; p.ev(p.$('fTexte'), 'input');
  check('… rien : message des filtres', /Aucun rôle avec ces filtres/.test(p.$('tbRoles').textContent));
  p.$('fTexte').value = ''; p.ev(p.$('fTexte'), 'input');
  // export
  p.$('btnExport').click();
  const feuille = XLSX.utils.sheet_to_json(p.ecrits.pop().wb.Sheets['Rôles'], { defval:'' });
  const ex2 = feuille.find(x => x['Personne'] === 'Lucie Durand') || {}, ex1 = feuille.find(x => x['Rôle'] === 'Assistant de prévention') || {};
  check('export : une ligne par rôle, terminés compris, périmètre, état, ce qui manque', feuille.length === 2 && ex1['Périmètre'] === "Toute l'organisation" && ex1['État'] === 'En fonction' && ex1['Désigné le'] === '01/03/2025'
    && ex2['État'] === 'Terminé' && ex2['Motif de fin'] === 'Départ' && ex2['Périmètre'] === P && ex2['Manque'] === '');
  // impression
  p.$('btnImprimer').click();
  const imp = p.$('roles-impression');
  check('impression : les rôles en fonction, à qui s\'adresser', imp && /à qui s'adresser/.test(imp.textContent) && imp.querySelectorAll('tbody tr').length === 1 && /Jean Martin-Durand/.test(imp.textContent) && !/Lucie/.test(imp.textContent));
  // ?ouvrir= et suppression
  p = await H.page('roles-prevention.html', PREV, { [CLE]: J(p.lire(CLE)) }, '?ouvrir=' + a2.id);
  check('?ouvrir= ouvre le rôle', H.visible(p.$('fiche')) && p.$('cPersonne').value === 'Lucie Durand');
  p.$('btnSupprimer').click();
  check('supprimer : retiré, journal', p.lire(CLE).length === 1 && !H.visible(p.$('fiche')) && (p.lire('vigie_hse_audit_log') || []).some(x => x.type === 'Suppression' && /Lucie/.test(x.description)));

  // ---------- 3. Lecture seule, périmètre ----------
  const ROLES = [
    { id:'x1', role:'Assistant de prévention', personne:'Jean', mission:'m', designeLe:'2025-01-01' },
    { id:'x2', role:'Correspondant santé-sécurité de service', personne:'Ana', service:V, mission:'m', designeLe:'2025-01-01' },
    { id:'x3', role:'Correspondant santé-sécurité de service', personne:'Bob', service:P },
  ];
  const pa = await H.page('roles-prevention.html', AG, { [CLE]: J(ROLES) });
  check('agent : la page, les 3 rôles, pas d\'ajout', !pa.erreurs.length && pa.d.querySelectorAll('#tbRoles tr[data-id]').length === 3 && !pa.$('btnNouveau') && pa.$('actRoles').innerHTML === '');
  pa.ev(pa.d.querySelector('[data-ouvrir="x1"]'), 'click');
  check('… fiche en lecture : champs désactivés, ni Enregistrer ni Supprimer, pas de choix RH', pa.$('cRole').disabled && pa.$('cMission').disabled && !pa.d.querySelector('#ficheForm button[type="submit"]') && !pa.$('btnSupprimer') && !pa.$('cAgent'));
  const pm = await H.page('roles-prevention.html', MAN, { [CLE]: J(ROLES) });
  check('manager limité à Voirie : toute l\'organisation et son service, pas les autres', J([...pm.d.querySelectorAll('#tbRoles tr[data-id]')].map(r => r.dataset.id).sort()) === J(['x1', 'x2']));
  const pr = await H.page('roles-prevention.html', REP, { [CLE]: J(ROLES) });
  check('représentant du personnel : la page', !pr.erreurs.length && !/dashboard/.test(pr.w.location.href) && pr.d.querySelectorAll('#tbRoles tr[data-id]').length === 3);
  const pn = await H.page('roles-prevention.html', { user:'X', role:'ag', email:'X', services:['*'], profils:[] }, { [CLE]: J(ROLES) });
  check('compte sans profil : renvoyé au tableau de bord', pn.navigation || /dashboard/.test(pn.w.location.href) || !pn.d.querySelectorAll('#tbRoles tr[data-id]').length);

  // ---------- 4. Droits, menu, serveur, stockage ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const def = W.VigieDroits.MODULES.find(m => m.id === 'roles-prevention');
  check('catalogue : « roles-prevention » (Ressources) ; Admin, RH, Préventeur gèrent ; Manager, Agent, Représentant consultent', def && def.section === 'Ressources' && res(ADMIN).peut('roles-prevention', 'gerer') && res(RH).peut('roles-prevention', 'gerer') && res(PREV).peut('roles-prevention', 'gerer')
    && res(MAN).peut('roles-prevention', 'consulter') && !res(MAN).peut('roles-prevention', 'gerer') && res(AG).peut('roles-prevention', 'consulter') && !res(AG).peut('roles-prevention', 'gerer') && res(REP).peut('roles-prevention', 'consulter'));
  check('menu : le lien sous Ressources, pour l\'agent', !!pa.d.querySelector('nav a[href="roles-prevention.html"]'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur, RH complet ; Manager, Agent aucun', Droits.niveau(sess(['p-preventeur']), CLE) === 'complet' && Droits.niveau(sess(['p-rh']), CLE) === 'complet' && Droits.niveau(sess(['p-manager']), CLE) === 'aucun' && Droits.niveau(sess(['p-agent']), CLE) === 'aucun' && Droits.cles.includes(CLE));
  check('serveur, lecture : Agent, Manager, Représentant reçoivent ; un profil sans le module, rien', Lecture.regle(sess(['p-agent']), CLE) === null && Lecture.regle(sess(['p-manager']), CLE) === null && Lecture.regle(sess(['p-representant']), CLE) === null && Lecture.regle(sess([]), CLE) === Lecture.RETIRE);
  check('VigieStore.CLES : registre de données, non sensible', W.VigieStore.CLES[CLE] && W.VigieStore.CLES[CLE].nature === 'donnees' && W.VigieStore.CLES[CLE].sensible === false);
  W.eval(require('fs').readFileSync(ROOT + 'assets/libelles-champs.js', 'utf8'));
  check('libellés : désigné le, lettre de mission', W.VigieLibelles.libelle(CLE, 'designeLe') === 'Désigné le' && W.VigieLibelles.libelle(CLE, 'lettre') === 'Lettre de mission');

  // ---------- 5. Préparation ISO 45001 ----------
  const faits = (pp, c) => { const r = pp.d.querySelector(`tr[data-clause="${c}"]`); return r ? r.textContent : ''; };
  const etat53 = (pp) => pp.w.VigiePreparation.evaluer(pp.w.VigieStore, pp.w.VigieDates.aujourdhui()).find(x => x.clause === '5.3');
  let pp = await H.page('preparation-iso.html', PREV, {});
  check('préparation, registre vide : 5.3 « Aucun enregistrement »', !pp.erreurs.length && etat53(pp).etat === 'rien' && /aucun rôle de prévention en fonction/.test(faits(pp, '5.3')), faits(pp, '5.3').slice(0, 300));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(ROLES.slice(0, 2)) });
  check('… deux rôles complets : « Des enregistrements », 2 rôles, 2 personnes', etat53(pp).etat === 'pret' && /2 rôles de prévention en fonction, 2 personnes/.test(faits(pp, '5.3')));
  pp = await H.page('preparation-iso.html', PREV, { [CLE]: J(ROLES) });
  check('… un rôle à compléter : « Des points à reprendre », le fait', etat53(pp).etat === 'areprendre' && /dont 1 à compléter/.test(faits(pp, '5.3')));
  check('… lien vers Rôles de prévention ; 5.3 couverte (26 couvertes, 1 en partie, 3 hors outil, engagement de la direction, communication, documents, achats et résultats au personnel compris)', /Rôles de prévention/.test(faits(pp, '5.3')) && pp.w.VigiePreparation.COUVERTURE['5.3'].c === 'couverte'
    && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'couverte').length === 26 && Object.values(pp.w.VigiePreparation.COUVERTURE).filter(c => c.c === 'partielle').length === 1);
  const lp = pp.w.VigiePreparation.evaluer(Object.assign({}, pp.w.VigieStore, { complet: (c) => c !== CLE }), pp.w.VigieDates.aujourdhui()).find(x => x.clause === '5.3');
  check('… registre partiel pour ce compte : « Non calculé »', lp.etat === 'partiel');

  fin();
})().catch(e => { console.error(e); process.exit(2); });
