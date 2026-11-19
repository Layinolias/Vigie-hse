// Flash info et actualités (2026-11-19) : composant, module (publier, archiver, republier, archivage d'office, veille,
// réglages, lecture seule), tableau de bord (archives absentes, panneau des actualités HSE masquable), Administration
// sans les anciens onglets, droits, menu, serveur, stockage.
//   RACINE=<dossier> node test-actualites.js
const H = require('./harnais.js');
const { check, fin } = H.bilan();
const ROOT = H.ROOT;
const RH = { user:'RH1', role:'rh', email:'RH1', services:['*'], modulePermissions:{} };
const ADMIN = { user:'admin@verchamps.fr', role:'admin', email:'admin@verchamps.fr', services:['*'], modulePermissions:{} };
const MAN = { user:'manager@verchamps.fr', role:'manager', email:'manager@verchamps.fr', services:['Voirie & Réseaux'], modulePermissions:{} };
const PREV = { user:'PREV1', role:'ag', email:'PREV1', services:['*'], profils:['p-agent', 'p-preventeur'] };
const AG = { user:'AG1', role:'ag', email:'AG1', services:['*'], modulePermissions:{} };
const REP = { user:'REP1', role:'ag', email:'REP1', services:['*'], profils:['p-representant'] };
const FL = 'vigie_hse_news', VE = 'vigie_hse_veille', RG = 'vigie_hse_actualites_reglages';
const J = (o) => JSON.stringify(o);

(async () => {
  // ---------- 1. Composant ----------
  const p0 = await H.page('actualites.html', PREV, {});
  const A = p0.w.VigieActualites, AJD = p0.w.VigieDates.aujourdhui();
  check('page sans erreur', !p0.erreurs.length, p0.erreurs);
  const r0 = A.reglages(null);
  check('réglages par défaut : actualités HSE affichées, pas d\'archivage d\'office ; valeurs lues et bornées', r0.afficherVeille === true && r0.archiverApresJours === 0
    && A.reglages({ afficherVeille:false, archiverApresJours:'30' }).archiverApresJours === 30 && A.reglages({ afficherVeille:false }).afficherVeille === false
    && A.reglages({ archiverApresJours:-4 }).archiverApresJours === 0 && A.reglages({ archiverApresJours:99999 }).archiverApresJours === 3650 && A.reglages([1]).afficherVeille === true);
  check('jours entre deux dates (passage d\'heure compris), date invalide', A.joursEntre('2026-03-01', '2026-04-01') === 31 && A.joursEntre('2026-10-20', '2026-10-30') === 10 && A.joursEntre('x', '2026-01-01') === null);
  const R30 = { archiverApresJours: 30 };
  check('archivé : à la main ; d\'office après le délai ; jamais si gardé publié ; jamais sans délai', A.flashArchive({ id:'a', date:'2026-11-18', archive:true }, null, '2026-11-19')
    && A.flashArchive({ id:'a', date:'2026-10-01' }, R30, '2026-11-19') && !A.flashArchive({ id:'a', date:'2026-10-25' }, R30, '2026-11-19')
    && !A.flashArchive({ id:'a', date:'2026-01-01', archive:false }, R30, '2026-11-19') && !A.flashArchive({ id:'a', date:'2020-01-01' }, null, '2026-11-19')
    && A.archiveAuto({ id:'a', date:'2026-10-01' }, R30, '2026-11-19') && !A.archiveAuto({ id:'a', date:'2026-10-01', archive:true }, R30, '2026-11-19'));
  const L = [{ id:'n1', date:'2026-11-01' }, { id:'n2', date:'2026-11-10', archive:true }, { id:'n3', date:'2026-09-01' }, null, { titre:'sans id' }];
  check('publiés / archivés, les plus récents d\'abord, invalides ignorés', A.flashPublies(L, R30, '2026-11-19').map(n => n.id).join() === 'n1' && A.flashArchives(L, R30, '2026-11-19').map(n => n.id).join() === 'n2,n3' && A.flashPublies(L, null, '2026-11-19').map(n => n.id).join() === 'n1,n3');
  check('veille affichée : sans « Archivé », du secteur ; secteur d\'origine d\'une ancienne actualité', A.veilleAffichee([{ id:'v-1', statut:'À lire', date:'2026-01-01' }, { id:'x', statut:'Archivé' }, { id:'y', secteur:'tous', statut:'Lu', date:'2026-02-01' }], s => s === 'tous').map(v => v.id).join() === 'y'
    && A.secteurDe({ id:'v-1' }) === 'collectivite' && A.secteurDe({ id:'zz' }) === 'tous' && A.veilleDefaut().length === 7);

  // ---------- 2. Module : publier, archiver, republier, supprimer ----------
  let p = await H.page('actualites.html', PREV, {});
  const flashs = () => p.lire(FL) || [];
  check('veille de démonstration posée au premier affichage (qui gère)', (p.lire(VE) || []).length === 7);
  check('vide : aucun flash, invitation ; quatre onglets ; compteurs', /Aucun flash info publié/.test(p.$('flashGrid').textContent) && p.d.querySelectorAll('.onglet').length === 4 && p.$('kpiPublies').textContent === '0' && p.$('kpiArchives').textContent === '0' && p.$('kpiAffichage').textContent === 'Oui' && p.$('nDate').value === AJD);
  const publier = () => p.ev(p.$('flashForm'), 'submit');
  publier();
  check('contrôle : le titre', /le titre/.test(p.alertes.pop() || '') && !flashs().length);
  p.$('nTitre').value = 'Vigilance <b>canicule</b>'; publier();
  check('contrôle : le message', /le message/.test(p.alertes.pop() || '') && !flashs().length);
  p.$('nTexte').value = 'Buvez de l\'eau, portez vos EPI.'; publier();
  let f = flashs()[0] || {};
  check('flash publié : titre, message, date du jour, auteur, identifiant', flashs().length === 1 && f.titre === 'Vigilance <b>canicule</b>' && f.date === AJD && f.auteur === 'PREV1' && /^n-/.test(f.id) && !('archive' in f), f);
  check('… carte affichée, texte échappé ; journal ; bandeau', p.d.querySelectorAll('#flashGrid .flash-card').length === 1 && !p.d.querySelector('#flashGrid b') && /<b>canicule<\/b>/.test(p.$('flashGrid').textContent)
    && (p.lire('vigie_hse_audit_log') || []).some(a => a.module === 'Flash info et actualités' && a.type === 'Création') && /publié/.test(p.$('bandeau').textContent));
  // modifier
  p.d.querySelector('[data-modifier]').click();
  check('modifier : formulaire rempli', p.$('nTitre').value === 'Vigilance <b>canicule</b>' && /Enregistrer/.test(p.$('flashBtn').textContent));
  p.$('nTitre').value = 'Vigilance canicule'; publier();
  check('… modifié, pas dupliqué', flashs().length === 1 && flashs()[0].titre === 'Vigilance canicule' && p.$('flashBtn').textContent === 'Publier');
  // archiver
  p.d.querySelector('[data-archiver]').click();
  f = flashs()[0];
  check('archiver : marqué archivé, date et auteur ; quitte la liste publiée ; dans les archives « À la main »', f.archive === true && !!f.archiveLe && f.archivePar === 'PREV1'
    && /Aucun flash info publié/.test(p.$('flashGrid').textContent) && p.$('kpiArchives').textContent === '1' && /Vigilance canicule/.test(p.$('archBody').textContent) && /À la main/.test(p.$('archBody').textContent)
    && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Archivage'));
  p.$('archRecherche').value = 'introuvable'; p.ev(p.$('archRecherche'), 'input');
  check('archives : recherche', /ne correspond/.test(p.$('archBody').textContent));
  p.$('archRecherche').value = 'canicule'; p.ev(p.$('archRecherche'), 'input');
  p.d.querySelector('[data-republier]').click();
  f = flashs()[0];
  check('republier : gardé publié (archive faux), date d\'archivage retirée ; de retour dans la liste', f.archive === false && !('archiveLe' in f) && p.d.querySelectorAll('#flashGrid .flash-card').length === 1 && p.$('kpiArchives').textContent === '0');
  p.d.querySelector('#flashGrid [data-supprimer]').click();
  check('supprimer', flashs().length === 0 && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Suppression'));

  // ---------- 3. Archivage d'office ----------
  const VIEUX = [{ id:'n-a', titre:'Ancien', texte:'x', date:'2025-01-10' }, { id:'n-b', titre:'Récent', texte:'y', date: AJD }];
  p = await H.page('actualites.html', PREV, { [FL]: J(VIEUX), [RG]: J({ afficherVeille:true, archiverApresJours:60 }) });
  check('réglage 60 jours : l\'ancien flash est archivé d\'office, le récent publié', /Récent/.test(p.$('flashGrid').textContent) && !/Ancien/.test(p.$('flashGrid').textContent) && /Ancien/.test(p.$('archBody').textContent) && /D'office/.test(p.$('archBody').textContent) && /60 jours/.test(p.$('archNote').textContent));
  p.d.querySelector('#archBody [data-republier]').click();
  check('… republié : gardé publié malgré son âge', (p.lire(FL) || []).find(n => n.id === 'n-a').archive === false && /Ancien/.test(p.$('flashGrid').textContent));
  // publier un flash daté de trop loin : rangé d'office, le bandeau le dit
  p.$('nTitre').value = 'Rétro'; p.$('nTexte').value = 'z'; p.$('nDate').value = '2024-01-01'; p.ev(p.$('flashForm'), 'submit');
  check('… publié avec une date trop ancienne : enregistré, rangé d\'office, signalé', /rangé d'office/.test(p.$('bandeau').textContent) && /Rétro/.test(p.$('archBody').textContent));

  // ---------- 4. Réglages ----------
  p = await H.page('actualites.html', PREV, {});
  check('réglages : valeurs lues (affichées, 0)', p.$('rAfficherVeille').checked === true && p.$('rArchiver').value === '0');
  p.ev(p.$('reglagesForm'), 'submit');
  check('… rien changé : rien écrit', p.lire(RG) === null && /Rien n'a changé/.test(p.$('bandeau').textContent));
  p.$('rArchiver').value = '2.5'; p.ev(p.$('reglagesForm'), 'submit');
  check('… nombre de jours invalide refusé', /entier/.test(p.alertes.pop() || '') && p.lire(RG) === null);
  p.$('rAfficherVeille').checked = false; p.$('rArchiver').value = '90'; p.ev(p.$('reglagesForm'), 'submit');
  check('… enregistrés : actualités HSE masquées, 90 jours ; compteur « Non » ; journal', J(p.lire(RG)) === J({ afficherVeille:false, archiverApresJours:90 }) && p.$('kpiAffichage').textContent === 'Non'
    && /ne les affiche pas/.test(p.$('veilleNote').textContent) && (p.lire('vigie_hse_audit_log') || []).some(a => a.type === 'Réglages' && /masquées/.test(a.description) && /90 jours/.test(a.description)));

  // ---------- 5. Actualités du secteur HSE ----------
  p = await H.page('actualites.html', RH, {});
  const veille = () => p.lire(VE) || [];
  check('veille : 7 actualités listées, lien vers l\'article', p.d.querySelectorAll('#veilleBody tr').length === 7 && !!p.d.querySelector('#veilleBody a[href^="https://"]'));
  p.ev(p.$('veilleForm'), 'submit');
  check('contrôle : le titre', /le titre/.test(p.alertes.pop() || ''));
  p.$('vTitre').value = 'Décret <i>bruit</i>'; p.$('vSource').value = 'Légifrance'; p.$('vResume').value = 'Résumé'; p.$('vUrl').value = 'javascript:alert(1)';
  p.choisir('vSecteur', 'entreprise');
  p.ev(p.$('veilleForm'), 'submit');
  let v = veille().find(x => x.titre === 'Décret <i>bruit</i>') || {};
  check('ajoutée : source, date, catégorie, statut, secteur ; titre échappé, lien non sûr non rendu', veille().length === 8 && v.source === 'Légifrance' && v.date === AJD && v.categorie === 'Loi / Réglementation' && v.statut === 'À lire' && v.secteur === 'entreprise'
    && !p.d.querySelector('#veilleBody i') && !p.d.querySelector('#veilleBody a[href^="javascript"]'), v);
  p.d.querySelector(`[data-veille-modifier="${v.id}"]`).click();
  check('modifier : formulaire rempli (secteur)', p.$('vSecteur').value === 'entreprise' && p.$('vTitre').value === 'Décret <i>bruit</i>');
  p.choisir('vStatut', 'Archivé'); p.ev(p.$('veilleForm'), 'submit');
  check('… statut « Archivé » enregistré', veille().find(x => x.id === v.id).statut === 'Archivé' && veille().length === 8);
  p.d.querySelector(`[data-veille-supprimer="${v.id}"]`).click();
  check('supprimer', veille().length === 7);

  // ---------- 6. Lecture seule, accès ----------
  const STOCK = { [FL]: J([{ id:'n1', titre:'Publié', texte:'a', date: AJD }, { id:'n2', titre:'Rangé', texte:'b', date: AJD, archive:true }]) };
  const pa = await H.page('actualites.html', AG, STOCK);
  check('agent : lit les publiés et les archives, sans formulaires, réglages ni boutons', !pa.navigation() && !pa.erreurs.length && /Publié/.test(pa.$('flashGrid').textContent) && /Rangé/.test(pa.$('archBody').textContent)
    && !pa.$('flashForm') && !pa.$('veilleForm') && !pa.$('reglagesForm') && !pa.$('ongletReglages') && !pa.d.querySelector('[data-archiver], [data-republier], [data-supprimer], [data-veille-modifier]'));
  check('… rien écrit (pas de graine de la veille)', pa.lire(VE) === null);
  const pq = await H.page('actualites.html', AG, {}, '?onglet=archives');
  check('?onglet=archives ouvre les archives', pq.$('volet-archives').classList.contains('active'));
  const pn = await H.page('actualites.html', { user:'X', role:'ag', email:'X', services:['*'], profils:[] }, {});
  check('sans le droit : renvoyé au tableau de bord', pn.navigation());

  // ---------- 7. Tableau de bord ----------
  let d = await H.page('dashboard.html', AG, STOCK);
  check('tableau de bord : flash publié seul (pas l\'archivé), lien vers le module ; actualités HSE affichées', !d.erreurs.length && /Publié/.test(d.$('newsGrid').textContent) && !/Rangé/.test(d.$('newsGrid').textContent)
    && !!d.d.querySelector('a#newsLien[href="actualites.html"]') && d.$('sectorNewsPanel').style.display !== 'none' && d.d.querySelectorAll('#sectorNewsGrid .news-card').length === 7, d.erreurs);
  d = await H.page('dashboard.html', AG, Object.assign({ [RG]: J({ afficherVeille:false, archiverApresJours:0 }) }, STOCK));
  check('… réglage « ne pas afficher » : panneau des actualités HSE masqué ; flash toujours là', d.$('sectorNewsPanel').style.display === 'none' && /Publié/.test(d.$('newsGrid').textContent));
  d = await H.page('dashboard.html', AG, { [FL]: J(VIEUX), [RG]: J({ afficherVeille:true, archiverApresJours:30 }) });
  check('… archivage d\'office : l\'ancien flash n\'est plus affiché', /Récent/.test(d.$('newsGrid').textContent) && !/Ancien/.test(d.$('newsGrid').textContent));
  d = await H.page('dashboard.html', { user:'X', role:'ag', email:'X', services:['*'], profils:[] }, STOCK);
  check('… sans le droit au module : flash affiché, sans lien', /Publié/.test(d.$('newsGrid').textContent) && !d.$('newsLien'));

  // ---------- 8. Administration ----------
  const pad = await H.page('administration.html', ADMIN, {});
  check('Administration : plus d\'onglets Flash Info ni Veille ; lien vers le module', !pad.erreurs.length && !pad.d.querySelector('[data-tab="news"], [data-tab="veille"], #tab-news, #tab-veille, #newsForm, #veilleForm') && !!pad.d.querySelector('.page-summary a[href="actualites.html"]'), pad.erreurs);

  // ---------- 9. Droits, menu, serveur, stockage ----------
  const W = p0.w, res = (S) => W.VigieDroits.pour(S);
  const def = W.VigieDroits.MODULES.find(m => m.id === 'actualites');
  check('catalogue : « actualites » (Ressources) ; Admin, RH, Préventeur gèrent ; Manager, Agent, Représentant consultent', def && def.section === 'Ressources' && res(ADMIN).peut('actualites', 'gerer') && res(RH).peut('actualites', 'gerer') && res(PREV).peut('actualites', 'gerer')
    && res(MAN).peut('actualites', 'consulter') && !res(MAN).peut('actualites', 'gerer') && res(AG).peut('actualites', 'consulter') && !res(AG).peut('actualites', 'gerer') && res(REP).peut('actualites', 'consulter') && !res(REP).peut('actualites', 'gerer'));
  const dm = await H.page('dashboard.html', AG, {});
  check('menu : le lien sous Ressources pour l\'agent', !!dm.d.querySelector('nav a[href="actualites.html"]'));
  const Droits = require(ROOT + 'serveur/droits.js'), Lecture = require(ROOT + 'serveur/lecture.js');
  const sess = (profils) => ({ user:'x', profils, services:['*'] });
  check('serveur, écriture : Préventeur, RH, Admin complet ; Manager, Agent aucun (flash, veille, réglages)', [FL, VE, RG].every(c => Droits.niveau(sess(['p-preventeur']), c) === 'complet' && Droits.niveau(sess(['p-rh']), c) === 'complet' && Droits.niveau(sess(['p-admin']), c) === 'complet'
    && Droits.niveau(sess(['p-manager']), c) === 'aucun' && Droits.niveau(sess(['p-agent']), c) === 'aucun' && Droits.cles.includes(c)));
  check('serveur, lecture : transmis à tous (tableau de bord)', [FL, VE, RG].every(c => Lecture.regle(sess(['p-agent']), c) === null && Lecture.regle(sess([]), c) === null));
  check('VigieStore.CLES : flash et veille en données, réglages en paramètres, non sensibles', W.VigieStore.CLES[FL].nature === 'donnees' && W.VigieStore.CLES[VE].nature === 'donnees' && W.VigieStore.CLES[RG].nature === 'parametres' && [FL, VE, RG].every(c => W.VigieStore.CLES[c].sensible === false));
  const pp = await H.page('preparation-iso.html', PREV, {});
  check('Préparation ISO 45001, § 7.4 : la carte cite « Flash info et actualités »', !!pp.d.querySelector('tr[data-clause="7.4"] a[href="actualites.html"]'));

  fin();
})().catch(e => { console.error(e); process.exit(2); });
