// Le paquet remis à un utilisateur, essayé comme lui (Documentation/LIVRAISON-POSTE.md) : zip préparé, décompressé
// dans un dossier vide, lancé par son lanceur, première connexion, toutes les pages ; puis l'application remplacée
// par une nouvelle version, les données restant à leur place.
//   node tests/test-paquet.js [--brouillon]   (--brouillon : paquet d'essai avec les fichiers non commités)
'use strict';
const H = require('./harnais-serveur.js');
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const BROUILLON = process.argv.includes('--brouillon'), GARDER = process.argv.includes('--garder');
const PORT_BAT = 8881, PORT = 8882;
const ADMIN = ['responsable.hse', 'Essai-paquet-2026'];   // le compte administrateur créé au premier lancement
const INDISPENSABLES = ['Lancer VIGIE HSE.bat', 'Restaurer une sauvegarde.bat', 'LISEZ-MOI.txt', 'VERSION.txt', 'login.html', 'index.html', 'dashboard.html',
  'serveur/serveur.js', 'serveur/lancer-poste.js', 'serveur/restaurer.js', 'serveur/poste-commun.js', 'serveur/base-sqlite.js',
  'assets/stockage.js', 'assets/droits.js', 'assets/marque.js', 'assets/xlsx.full.min.js', 'assets/polices/polices.css'];
// ce qui ne sert qu'au développement, ou serait une donnée : jamais dans le paquet
const INTERDIT = f => /^(Documentation|DATATEST|tests|livraison|\.claude|\.git|serveur\/donnees)\//.test(f) || /\.(md|db|db-wal|db-shm)$/.test(f) || f === 'serveur/preparer-livraison.js' || f === 'CLAUDE.md';
const VIDES = ['vigie_hse_dataset', 'vigie_hse_visites', 'vigie_hse_duerp_dataset', 'vigie_hse_rsst', 'vigie_hse_verifications', 'vigie_hse_inspections',
  'vigie_hse_habilitations', 'vigie_hse_signalements', 'vigie_hse_actions', 'vigie_hse_atmp_dossiers'];
const crlf = t => t.includes('\r\n') && !/[^\r]\n/.test(t) && !/^\n/.test(t);

(async () => {
  const { verif, fin } = H.bilan('Paquet');
  const T = H.dossierTemporaire('paquet');
  let srv = null, bat = null;
  try {
    // 1. le paquet
    const sortie = execFileSync(process.execPath, [path.join(H.DEPOT, 'serveur', 'preparer-livraison.js')].concat(BROUILLON ? ['--brouillon'] : []), { encoding: 'utf8' });
    const zip = (/→ (.+\.zip) \(/.exec(sortie) || [])[1];
    if (!verif('paquet préparé : ' + sortie.trim(), zip && fs.existsSync(zip), sortie)) return;
    const APP = path.join(H.deballer(zip, path.join(T, 'deballe')), 'VIGIE-HSE');
    const fichiers = H.lister(APP);
    const manquent = INDISPENSABLES.filter(f => !fichiers.includes(f));
    verif('contenu : ' + fichiers.length + ' fichiers, les indispensables présents', !manquent.length, manquent);
    const intrus = fichiers.filter(INTERDIT);
    verif('contenu : ni documentation, ni démonstration, ni tests, ni base', !intrus.length, intrus);
    const version = fs.readFileSync(path.join(APP, 'VERSION.txt'), 'utf8');
    verif('VERSION.txt : la version du commit (' + H.git('rev-parse', '--short', 'HEAD') + ')', version.includes(H.git('rev-parse', '--short', 'HEAD')) && (BROUILLON || !/BROUILLON/.test(version)), version.trim());
    const finsDeLigne = ['Lancer VIGIE HSE.bat', 'Restaurer une sauvegarde.bat', 'LISEZ-MOI.txt'].filter(f => !crlf(fs.readFileSync(path.join(APP, f), 'utf8')));
    verif('lanceur, outil de restauration et guide : fins de ligne Windows', !finsDeLigne.length, finsDeLigne);
    const bats = ['Lancer VIGIE HSE.bat', 'Restaurer une sauvegarde.bat'].filter(f => /\/dev\/null/.test(fs.readFileSync(path.join(APP, f), 'utf8')));
    verif('fichiers .bat : aucune redirection « /dev/null » (inconnue de cmd.exe)', !bats.length, bats);

    // 2. le lanceur, exécuté par cmd.exe comme un double-clic
    if (process.platform === 'win32'){
      bat = H.lancerBat(path.join(APP, 'Lancer VIGIE HSE.bat'), { env: { VIGIE_DOSSIER: path.join(T, 'donnees-bat'), PORT: String(PORT_BAT), VIGIE_NAVIGATEUR: '0' } });
      let ok = false;
      for (let i = 0; i < 60 && !ok; i++){ ok = await H.repond(PORT_BAT); if (!ok) await H.sleep(250); }
      await H.sleep(500);
      const texte = bat.sortie();
      H.tuer(bat.proc); await H.attendreFin(bat.proc); bat = null;
      verif('« Lancer VIGIE HSE.bat » par cmd.exe : VIGIE HSE répond', ok, texte.slice(-600));
      verif('… la fenêtre dit où sont les données, sans aucun message technique', /vos données : .*donnees-bat/.test(texte) && !H.MESSAGES_TECHNIQUES.test(texte), texte.slice(-800));
    }

    // 3. lancé, données hors du dossier de l'application
    const DONNEES = path.join(T, 'donnees');
    srv = await H.demarrer({ racine: APP, script: 'serveur/lancer-poste.js', port: PORT, env: { VIGIE_DOSSIER: DONNEES, VIGIE_NAVIGATEUR: '0' } });
    verif('lancement : aucun avertissement technique', !H.MESSAGES_TECHNIQUES.test(srv.sortie()) && !/Warning/i.test(srv.sortie()), srv.sortie().slice(-800));
    // première connexion : pas de comptes de démonstration (mots de passe publiés), le compte administrateur se crée
    const pot = H.nouveauPot();
    const court = await H.creerPremierCompteParLaPage(PORT, ADMIN[0], 'court-11car', H.nouveauPot());
    const amorceCourte = await H.requete(PORT, 'PUT', '/api/donnees/vigie_hse_users', { corps: JSON.stringify([{ id: 'u-admin', username: 'admin@verchamps.fr', email: 'admin@verchamps.fr', password: 'admin1234', profils: ['p-admin'], services: ['*'], active: true }]), entetes: { 'X-Vigie-Revision': '0' } });
    verif('premier lancement : écran de création du compte administrateur ; mot de passe de moins de 12 caractères refusé, par la page et par le serveur', court.formulaire && !court.session && /12 caractères/.test(court.message) && amorceCourte.statut === 403, { court, amorce: amorceCourte.statut });
    const premiere = await H.creerPremierCompteParLaPage(PORT, ADMIN[0], ADMIN[1], pot);
    const demoRefusee = await H.connecter(PORT, 'admin@verchamps.fr', 'admin1234', H.nouveauPot());
    verif('première connexion : le compte administrateur créé et connecté, aucun compte de démonstration', premiere.session && premiere.session.user === ADMIN[0] && premiere.cookie && !premiere.erreurs.length && demoRefusee.statut !== 200, { premiere, demo: demoRefusee.statut });
    const liste = H.pages(APP).filter(p => p !== 'login.html');   // l'écran de connexion ferme la session
    const fautives = [], externes = [];
    for (const pg of liste){
      const P = await H.ouvrirPage(PORT, pg, { pot });
      if (P.statut !== 200 || P.erreurs.length) fautives.push(pg + ' : ' + (P.statut !== 200 ? P.statut : P.erreurs.join(' | ')));
      (P.externes || []).forEach(u => externes.push(pg + ' → ' + u));
      P.fermer();
    }
    verif('les ' + liste.length + ' pages s\'ouvrent sans erreur', !fautives.length, fautives);
    verif('aucune page ne demande quoi que ce soit hors du poste (scripts, données)', !externes.length, externes);
    const google = fichiers.filter(f => /\.(html|css)$/.test(f) && /fonts\.(googleapis|gstatic)\.com/.test(fs.readFileSync(path.join(APP, f), 'utf8')));
    const polices = fichiers.filter(f => /^assets\/polices\/.+\.woff2$/.test(f));
    const policesServies = [];
    for (const f of polices) if ((await H.requete(PORT, 'GET', '/' + f)).statut === 200) policesServies.push(f);
    verif('polices fournies par le paquet (' + polices.length + '), aucune demandée à Google', polices.length >= 5 && policesServies.length === polices.length && !google.length, { google, polices: polices.length, servies: policesServies.length });
    const xlsx = await H.requete(PORT, 'GET', '/assets/xlsx.full.min.js', { pot });
    verif('bibliothèque Excel servie par le poste', xlsx.statut === 200 && xlsx.corps.length === fs.statSync(path.join(APP, 'assets', 'xlsx.full.min.js')).size, xlsx.statut);
    const demo = fs.readdirSync(path.join(H.DEPOT, 'DATATEST')).find(f => f.endsWith('.xlsx'));
    const d = await H.donnees(PORT, pot);
    const pleins = VIDES.filter(k => d[k] && d[k].valeur != null && (JSON.parse(d[k].valeur) || []).length);
    verif('pas de démonstration : DATATEST non servi, registres vides', (await H.requete(PORT, 'GET', '/DATATEST/' + encodeURIComponent(demo), { pot })).statut === 404 && !pleins.length, pleins);
    verif('données hors du dossier de l\'application', fs.existsSync(path.join(DONNEES, 'vigie.db')) && !H.lister(APP).some(f => /\.db$/.test(f)));
    // une saisie, pour la suite
    const reg = d.vigie_hse_dataset || { valeur: '[]', revision: 0 };
    const saisie = { id: 'paquet-essai-' + Date.now().toString(36), dateAT: '2026-04-07', typeAtMp: 'Accident de travail', arret: false, joursArret: 0, collectivite: 'Ville', service: 'Voirie & Réseaux', circonstances: 'Saisie du test du paquet.' };
    verif('une saisie enregistrée', await H.ecrire(PORT, pot, 'vigie_hse_dataset', JSON.stringify(JSON.parse(reg.valeur || '[]').concat([saisie])), reg.revision) === 200);
    await srv.arreter(); srv = null;

    // 4. nouvelle version : dossier de l'application supprimé, remplacé (un fichier changé : une autre version)
    H.effacer(APP);
    H.deballer(zip, path.join(T, 'deballe'));
    fs.appendFileSync(path.join(APP, 'assets', 'stockage.js'), '\n// version suivante (test du paquet)\n');
    srv = await H.demarrer({ racine: APP, script: 'serveur/lancer-poste.js', port: PORT, env: { VIGIE_DOSSIER: DONNEES, VIGIE_NAVIGATEUR: '0' } });
    const pot2 = H.nouveauPot();
    const c = await H.connecter(PORT, ADMIN[0], ADMIN[1], pot2);
    const d2 = c.statut === 200 ? await H.donnees(PORT, pot2) : {};
    const retrouvee = JSON.parse((d2.vigie_hse_dataset || {}).valeur || '[]').find(x => x && x.id === saisie.id);
    verif('application remplacée : comptes et données toujours là', c.statut === 200 && !!retrouvee, c);
    const copies = fs.existsSync(path.join(DONNEES, 'sauvegardes')) ? fs.readdirSync(path.join(DONNEES, 'sauvegardes')).filter(f => /^vigie-avant-mise-a-jour-/.test(f)) : [];
    verif('… et une copie « avant mise à jour » prise', copies.length === 1, copies);
  } finally {
    if (bat) H.tuer(bat.proc);
    if (srv) await srv.arreter();
    if (GARDER) console.log('dossier de travail gardé : ' + T); else H.effacer(T);
  }
  process.exit(fin() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
