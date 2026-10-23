// Copie des sauvegardes hors du disque (serveur/sauvegardes.js, Administration → Sauvegardes) : un vrai serveur, un
// vrai dossier de copie qu'on « débranche », la page d'administration et le tableau de bord exécutés dans jsdom, puis
// l'outil de restauration qui retrouve les copies que le dossier des sauvegardes n'a plus.
//   node tests/test-copie-sauvegardes.js
'use strict';
const H = require('./harnais-serveur.js');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');

const PORT = 8893;
const D = H.dossierTemporaire('copie'), DONNEES = path.join(D, 'donnees'), BASE = path.join(DONNEES, 'vigie.db'), SAUV = path.join(DONNEES, 'sauvegardes');
const CLE = path.join(D, 'cle-usb'), CLE2 = path.join(D, 'disque-externe'), SERVEUR = path.join(D, 'partage-serveur');
const ENV = { VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV, VIGIE_SAUVEGARDES_GARDER: '2' };
const MOTIF = /^vigie-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;
const quotidiennes = d => { try { return fs.readdirSync(d).filter(f => MOTIF.test(f)).sort(); } catch(e){ return []; } };
const empreinte = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const lire = r => { try { return JSON.parse(r.texte); } catch(e){ return {}; } };
const appel = (pot, methode, chemin, corps, entetes) => H.requete(PORT, methode, '/api/' + chemin, { pot,
  corps: corps === undefined ? null : JSON.stringify(corps), entetes: Object.assign({ 'Content-Type': 'application/json' }, entetes || {}) });
const COMPTES = [
  { id: 'u-admin', username: 'admin@verchamps.fr', email: 'admin@verchamps.fr', password: 'admin1234', profils: ['p-admin'], services: ['*'], active: true },
  { id: 'u-ag', username: 'AG1', email: 'ag1', password: '1234', profils: ['p-agent'], services: ['*'], active: true },
];

(async () => {
  const { verif, fin } = H.bilan('Copie des sauvegardes hors du disque');
  let srv = null;
  const demarrer = async env => { srv = await H.demarrer({ port: PORT, env: Object.assign({}, ENV, env || {}) }); };
  const arreter = async () => { if (srv){ await srv.arreter(); srv = null; } };
  try {
    // ---------- 1. réglé avant le lancement : la sauvegarde du démarrage est recopiée d'elle-même ----------
    fs.mkdirSync(DONNEES, { recursive: true }); fs.mkdirSync(CLE); fs.mkdirSync(CLE2); fs.mkdirSync(SERVEUR);
    fs.writeFileSync(path.join(DONNEES, 'copie-sauvegardes.json'), JSON.stringify({ dossier: CLE }));
    await demarrer();
    for (let i = 0; i < 40 && !quotidiennes(CLE).length; i++) await H.sleep(150);
    const [s0] = quotidiennes(SAUV), [c0] = quotidiennes(CLE);
    verif('sauvegarde du démarrage recopiée dans le second dossier, à l\'identique, sans fichier provisoire',
      s0 && c0 === s0 && empreinte(path.join(SAUV, s0)) === empreinte(path.join(CLE, c0)) && !fs.readdirSync(CLE).some(f => /partiel/.test(f)),
      { sauvegardes: quotidiennes(SAUV), copie: fs.readdirSync(CLE) });
    verif('le terminal du serveur dit la copie', /Copie hors du disque : .*cle-usb/.test(srv.sortie()), srv.sortie().slice(-500));

    // ---------- 2. qui lit l'état, qui le règle ----------
    const amorce = await H.requete(PORT, 'PUT', '/api/donnees/vigie_hse_users', { corps: JSON.stringify(COMPTES), entetes: { 'X-Vigie-Revision': '0' } });
    const potA = H.nouveauPot(), potG = H.nouveauPot();
    const coA = await H.connecter(PORT, 'admin@verchamps.fr', 'admin1234', potA), coG = await H.connecter(PORT, 'AG1', '1234', potG);
    verif('comptes de démonstration inscrits, administrateur et agent connectés', amorce.statut === 200 && coA.statut === 200 && coG.statut === 200, { amorce: amorce.statut, a: coA.statut, g: coG.statut });
    let r = await appel(potA, 'GET', 'sauvegardes'), e = lire(r);
    verif('l\'administrateur lit l\'état : dossier, réglé ici, réglable de ce poste, dernière copie, même disque signalé',
      r.statut === 200 && e.dossier === CLE && e.source === 'administration' && e.reglable === true && e.derniere && e.derniere.fichier === c0 && !e.echec && e.memeDisque === true && e.garder === 2 && e.heures === 24, e);
    const g = await appel(potG, 'GET', 'sauvegardes'), gp = await appel(potG, 'POST', 'sauvegardes', { dossier: CLE2 }), gc = await appel(potG, 'POST', 'sauvegardes/copier', {});
    const anon = await appel(null, 'GET', 'sauvegardes');
    verif('un agent ne lit, ne règle ni ne lance rien (403) ; sans session : 401', g.statut === 403 && gp.statut === 403 && gc.statut === 403 && anon.statut === 401, [g.statut, gp.statut, gc.statut, anon.statut]);
    const sansEntete = await H.requete(PORT, 'POST', '/api/sauvegardes', { pot: potA, corps: JSON.stringify({ dossier: CLE2 }), entetes: { 'X-Vigie': '0' } });
    verif('réglage sans l\'en-tête X-Vigie (autre site) : refusé', sansEntete.statut === 403, sansEntete.statut);

    // ---------- 3. ce que le réglage refuse ----------
    const fichier = path.join(D, 'un-fichier.txt'); fs.writeFileSync(fichier, 'x');
    const refus = {};
    for (const [nom, d] of Object.entries({ relatif: 'sauvegardes-ailleurs', absent: path.join(D, 'pas-la'), memeDossier: SAUV, pasUnDossier: fichier })){
      const x = await appel(potA, 'POST', 'sauvegardes', { dossier: d }); refus[nom] = x.statut + ' ' + lire(x).erreur;
    }
    verif('refusés : chemin relatif, dossier absent, le dossier des sauvegardes lui-même, un fichier',
      /^400 .*chemin complet/.test(refus.relatif) && /^400 .*n'existe pas/.test(refus.absent) && /^400 .*déjà le dossier des sauvegardes/.test(refus.memeDossier) && /^400 .*pas un dossier/.test(refus.pasUnDossier), refus);
    e = lire(await appel(potA, 'GET', 'sauvegardes'));
    verif('après ces refus, le réglage et son état sont inchangés', e.dossier === CLE && e.derniere && e.derniere.fichier === c0, e);

    // ---------- 4. un autre dossier, puis débranché : l'échec est noté et l'administrateur averti ----------
    r = await appel(potA, 'POST', 'sauvegardes', { dossier: CLE2 }); e = lire(r);
    verif('nouveau dossier enregistré : son état repart de zéro', r.statut === 200 && e.dossier === CLE2 && !e.derniere && !e.echec, e);
    fs.rmSync(CLE2, { recursive: true, force: true });   // le disque externe est débranché
    await H.sleep(1100);
    r = await appel(potA, 'POST', 'sauvegardes/copier', {}); e = lire(r);
    verif('« Sauvegarder et copier maintenant », disque débranché : sauvegarde prise, copie en échec, motif en clair',
      r.statut === 200 && quotidiennes(SAUV).length === 2 && e.echec && /dossier introuvable/.test(e.echec.message) && !e.derniere, e);
    await arreter(); await demarrer();   // l'échec survit à un redémarrage
    let P = await H.ouvrirPage(PORT, 'dashboard.html', { pot: potA });
    const bandeau = P.w && P.w.document.getElementById('sauvegardeRappel');
    verif('tableau de bord de l\'administrateur, après redémarrage : averti de l\'échec, avec le motif et le lien',
      bandeau && bandeau.style.display !== 'none' && /échec le/.test(bandeau.textContent) && /dossier introuvable/.test(bandeau.textContent)
      && bandeau.querySelector('a[href="administration.html#sauvegardes"]') && !P.erreurs.length, { texte: bandeau && bandeau.textContent, erreurs: P.erreurs });
    P.fermer();
    P = await H.ouvrirPage(PORT, 'dashboard.html', { pot: potG });
    verif('tableau de bord de l\'agent : ni bandeau, ni état des sauvegardes reçu',
      P.w.document.getElementById('sauvegardeRappel').style.display === 'none' && !P.w.__VIGIE_SERVEUR__.sauvegardes && !P.erreurs.length, P.erreurs);
    P.fermer();

    // ---------- 5. rebranché : la copie reprend, l'avertissement disparaît, la rotation garde les 2 dernières ----------
    fs.mkdirSync(CLE2);
    for (let i = 0; i < 2; i++){ await H.sleep(1100); r = await appel(potA, 'POST', 'sauvegardes/copier', {}); }
    e = lire(r);
    const dansCle2 = quotidiennes(CLE2), dernieres = quotidiennes(SAUV).slice(-2);
    verif('rebranché : copie réussie, échec effacé, les 2 dernières seulement (comme le dossier des sauvegardes)',
      r.statut === 200 && !e.echec && e.derniere && dansCle2.length === 2 && dansCle2.join() === dernieres.join()
      && dansCle2.every(f => empreinte(path.join(CLE2, f)) === empreinte(path.join(SAUV, f))), { e, dansCle2, dernieres });
    P = await H.ouvrirPage(PORT, 'dashboard.html', { pot: potA });
    verif('tableau de bord de l\'administrateur : plus d\'avertissement', P.w.document.getElementById('sauvegardeRappel').style.display === 'none' && !P.w.__VIGIE_SERVEUR__.sauvegardes);
    P.fermer();

    // ---------- 6. la page Administration → Sauvegardes ----------
    P = await H.ouvrirPage(PORT, 'administration.html#sauvegardes', { pot: potA });
    await H.sleep(500);
    let doc = P.w.document;
    verif('Administration#sauvegardes : l\'onglet s\'ouvre sur l\'état — plan, dossier, copie réussie, même disque signalé',
      doc.getElementById('tab-sauv').classList.contains('show') && doc.getElementById('sauvDossier').value === CLE2 && !doc.getElementById('sauvServeur').hidden
      && /toutes les 24 h/.test(doc.getElementById('sauvPlan').textContent) && /Réussie/.test(doc.getElementById('sauvEtat').textContent)
      && /même disque/.test(doc.getElementById('sauvEtat').textContent) && !doc.getElementById('sauvEnregistrer').disabled && !P.erreurs.length,
      { plan: doc.getElementById('sauvPlan').textContent, etat: doc.getElementById('sauvEtat').textContent, erreurs: P.erreurs });
    doc.getElementById('sauvDossier').value = path.join(D, 'nulle-part');
    doc.getElementById('sauvEnregistrer').click(); await H.sleep(600);
    verif('la page affiche le refus du serveur, en clair', /Non enregistré : ce dossier n'existe pas/.test(doc.getElementById('sauvNote').textContent), doc.getElementById('sauvNote').textContent);
    doc.getElementById('sauvDossier').value = CLE;
    doc.getElementById('sauvEnregistrer').click(); await H.sleep(600);
    e = lire(await appel(potA, 'GET', 'sauvegardes'));
    const audit = (lire(await H.requete(PORT, 'GET', '/api/donnees', { pot: potA })).vigie_hse_audit_log || {}).valeur || '';
    verif('la page enregistre un autre dossier, et le journal des modifications le note',
      e.dossier === CLE && /Dossier enregistré/.test(doc.getElementById('sauvNote').textContent) && audit.includes('Copie des sauvegardes hors du disque'), { e, note: doc.getElementById('sauvNote').textContent });
    doc.getElementById('sauvDossier').value = '';
    doc.getElementById('sauvEnregistrer').click(); await H.sleep(600);
    e = lire(await appel(potA, 'GET', 'sauvegardes'));
    verif('vider le champ arrête la copie ; la page le dit et désactive « copier maintenant »',
      !e.dossier && /Aucune copie hors du disque/.test(doc.getElementById('sauvEtat').textContent) && doc.getElementById('sauvCopier').disabled, e);
    P.fermer();
    const sansDossier = await appel(potA, 'POST', 'sauvegardes/copier', {});
    verif('sans dossier réglé, « copier maintenant » est refusé', sansDossier.statut === 400, sansDossier.statut);
    await arreter();

    // ---------- 7. réglé sur le serveur (VIGIE_SAUVEGARDES_COPIE) : l'emporte, ne se change pas de la page ----------
    await demarrer({ VIGIE_SAUVEGARDES_COPIE: SERVEUR });
    e = lire(await appel(potA, 'GET', 'sauvegardes'));
    const change = await appel(potA, 'POST', 'sauvegardes', { dossier: CLE });
    await H.sleep(1100);
    const copieServeur = lire(await appel(potA, 'POST', 'sauvegardes/copier', {}));
    P = await H.ouvrirPage(PORT, 'administration.html#sauvegardes', { pot: potA }); await H.sleep(500);
    doc = P.w.document;
    verif('VIGIE_SAUVEGARDES_COPIE : l\'emporte, refuse un changement depuis la page, copie dans son dossier ; champ et bouton désactivés',
      e.dossier === SERVEUR && e.source === 'serveur' && change.statut === 400 && /réglé sur le serveur/.test(lire(change).erreur)
      && copieServeur.derniere && quotidiennes(SERVEUR).length === 1 && doc.getElementById('sauvDossier').disabled && doc.getElementById('sauvEnregistrer').disabled
      && /VIGIE_SAUVEGARDES_COPIE/.test(doc.getElementById('sauvReglage').textContent), { e, change: change.texte, copie: quotidiennes(SERVEUR) });
    P.fermer();
    await arreter();

    // ---------- 8. restauration : les copies que le dossier des sauvegardes n'a plus ----------
    fs.writeFileSync(path.join(DONNEES, 'copie-sauvegardes.json'), JSON.stringify({ dossier: CLE2 }));
    for (const f of quotidiennes(SAUV)) fs.rmSync(path.join(SAUV, f));
    const outil = spawnSync(process.execPath, [path.join(H.DEPOT, 'serveur', 'restaurer.js')], { input: '\n', encoding: 'utf8', timeout: 60000,
      env: Object.assign({}, process.env, { VIGIE_DOSSIER: DONNEES, VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV, PORT: String(PORT) }) });
    const sortie = (outil.stdout || '') + (outil.stderr || '');
    verif('« Restaurer une sauvegarde » propose les copies hors du disque, une fois chacune, et n\'a rien touché',
      (sortie.match(/— copie hors du disque/g) || []).length === dansCle2.length && /Annulé/.test(sortie) && sortie.includes(DONNEES), sortie.slice(0, 1500));
  } catch(err){
    verif('déroulé sans exception', false, err.stack);
  } finally {
    await arreter();
    if (!process.argv.includes('--garder')) H.effacer(D); else console.log('dossier gardé : ' + D);
  }
  fin();
})();
