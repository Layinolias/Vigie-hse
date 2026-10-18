// Comptes et sessions du serveur (revue de sécurité du 2026-10-18), essayés comme un utilisateur et comme un appel
// direct à l'API : premier compte d'un poste réel, longueur des mots de passe, sessions fermées quand un mot de passe
// change. Chaque serveur démarre sur une base neuve, dans un dossier temporaire.
//   node tests/test-securite.js [--garder]
'use strict';
const H = require('./harnais-serveur.js');
const path = require('path');

const GARDER = process.argv.includes('--garder');
const PORT_POSTE = 8895, PORT_DEMO = 8896;
const D = H.dossierTemporaire('securite');
const ADMIN = ['responsable.hse', 'Premier-compte-2026'];

const lireComptes = async (port, pot) => { const d = await H.donnees(port, pot); const x = d && d.vigie_hse_users; return x ? { liste: JSON.parse(x.valeur), revision: x.revision } : null; };
const ecrireComptes = (port, pot, liste, revision) => H.ecrire(port, pot, 'vigie_hse_users', JSON.stringify(liste), revision);
const connecte = async (port, pot) => (await H.requete(port, 'GET', '/api/donnees', { pot })).statut === 200;

(async () => {
  const { verif, fin } = H.bilan('Sécurité des comptes');
  let srv = null;
  try {
    // ---------- 1. poste réel (VIGIE_DEMO=0) : pas de comptes de démonstration ----------
    srv = await H.demarrer({ port: PORT_POSTE, env: { VIGIE_BASE: path.join(D, 'poste', 'vigie.db'), VIGIE_SAUVEGARDES: path.join(D, 'poste', 'sauvegardes'), VIGIE_DEMO: '0' } });
    verif('poste réel, base neuve : le serveur annonce la création du compte administrateur', /fait créer le compte administrateur/.test(srv.sortie()), srv.sortie().slice(-400));

    const P = await H.ouvrirPage(PORT_POSTE, 'login.html', { pot: H.nouveauPot() });
    const doc = P.w.document;
    const demoVisible = Array.from(doc.querySelectorAll('.demo-seule')).filter(p => !p.hidden).length;
    verif('écran de connexion : formulaire du premier compte, pas celui de connexion, mentions de démonstration masquées',
      !doc.getElementById('premierCompte').hidden && doc.getElementById('loginForm').hidden && demoVisible === 0 && !P.erreurs.length, { demoVisible, erreurs: P.erreurs });
    P.fermer();

    const court = await H.creerPremierCompteParLaPage(PORT_POSTE, ADMIN[0], 'onze-caract', H.nouveauPot());
    const different = await H.creerPremierCompteParLaPage(PORT_POSTE, ADMIN[0], ADMIN[1], H.nouveauPot(), ADMIN[1] + 'x');
    verif('la page refuse un mot de passe de moins de 12 caractères, et deux saisies différentes',
      /12 caractères/.test(court.message) && /identiques/.test(different.message) && !court.session && !different.session, { court: court.message, different: different.message });

    const demo = [{ id: 'u-admin', username: 'admin@verchamps.fr', email: 'admin@verchamps.fr', password: 'admin1234', profils: ['p-admin'], services: ['*'], active: true }];
    const amorceDemo = await H.requete(PORT_POSTE, 'PUT', '/api/donnees/vigie_hse_users', { corps: JSON.stringify(demo), entetes: { 'X-Vigie-Revision': '0' } });
    verif('le serveur refuse d\'inscrire un compte de démonstration (appel direct, mot de passe trop court)', amorceDemo.statut === 403 && /trop court/.test(amorceDemo.texte), amorceDemo.statut + ' ' + amorceDemo.texte);

    const potA = H.nouveauPot();
    const premier = await H.creerPremierCompteParLaPage(PORT_POSTE, ADMIN[0], ADMIN[1], potA);
    verif('le premier compte créé par la page, administrateur, connecté', premier.session && premier.session.user === ADMIN[0] && premier.cookie && !premier.erreurs.length, premier);
    const encore = await H.requete(PORT_POSTE, 'PUT', '/api/donnees/vigie_hse_users', { corps: JSON.stringify(demo), entetes: { 'X-Vigie-Revision': '1' } });
    const demoCo = await H.connecter(PORT_POSTE, 'admin@verchamps.fr', 'admin1234', H.nouveauPot());
    verif('un compte existe : plus d\'écriture des comptes sans session ; aucun compte de démonstration', encore.statut === 401 && demoCo.statut !== 200, { encore: encore.statut, demo: demoCo.statut });

    const P2 = await H.ouvrirPage(PORT_POSTE, 'login.html', { pot: H.nouveauPot() });
    verif('ensuite, l\'écran de connexion est l\'écran habituel', P2.w.document.getElementById('premierCompte').hidden && !P2.w.document.getElementById('loginForm').hidden);
    P2.fermer();

    // ---------- 4. longueur des mots de passe posés par l'administrateur ----------
    let c = await lireComptes(PORT_POSTE, potA);
    const agent = { id: 'u-agent-essai', nom: 'Essai', prenom: 'Agent', email: 'agent.essai', username: 'agent.essai', profils: ['p-agent'], services: ['*'], active: true };
    const st11 = await ecrireComptes(PORT_POSTE, potA, c.liste.concat([Object.assign({ password: 'onze-caract' }, agent)]), c.revision);
    c = await lireComptes(PORT_POSTE, potA);
    verif('compte créé avec un mot de passe de 11 caractères : refusé (403), rien d\'inscrit', st11 === 403 && !c.liste.some(u => u.id === agent.id), st11);
    const MDP1 = 'Agent-essai-mdp-1';
    const st12 = await ecrireComptes(PORT_POSTE, potA, c.liste.concat([Object.assign({ password: MDP1 }, agent)]), c.revision);
    const potAgent1 = H.nouveauPot();
    verif('avec 12 caractères au moins : accepté, l\'agent se connecte', st12 === 200 && (await H.connecter(PORT_POSTE, agent.username, MDP1, potAgent1)).statut === 200, st12);

    // ---------- 3. un mot de passe changé ferme les sessions ouvertes ----------
    c = await lireComptes(PORT_POSTE, potA);
    const MDP2 = 'Agent-essai-mdp-2';
    const avecMdp = mdp => c.liste.map(u => u.id === agent.id ? Object.assign({}, u, { password: mdp }) : u);
    const stReinit = await ecrireComptes(PORT_POSTE, potA, avecMdp(MDP2), c.revision);
    verif('réinitialisation par l\'administrateur : la session ouverte avec l\'ancien mot de passe est fermée', stReinit === 200 && !(await connecte(PORT_POSTE, potAgent1)), stReinit);
    const potAgent2 = H.nouveauPot();
    const ancien = await H.connecter(PORT_POSTE, agent.username, MDP1, H.nouveauPot());
    const nouveau = await H.connecter(PORT_POSTE, agent.username, MDP2, potAgent2);
    verif('l\'ancien mot de passe ne sert plus, le nouveau oui', ancien.statut !== 200 && nouveau.statut === 200, { ancien: ancien.statut, nouveau: nouveau.statut });

    c = await lireComptes(PORT_POSTE, potA);
    const stRenvoi = await ecrireComptes(PORT_POSTE, potA, avecMdp(MDP2), c.revision);
    verif('la page renvoie la liste avec le même mot de passe : rien ne change, la session reste ouverte', stRenvoi === 200 && await connecte(PORT_POSTE, potAgent2), stRenvoi);

    // l'administrateur change son propre mot de passe : son autre session se ferme, pas celle d'où il le change
    const potA2 = H.nouveauPot();
    await H.connecter(PORT_POSTE, ADMIN[0], ADMIN[1], potA2);
    c = await lireComptes(PORT_POSTE, potA);
    const MDPA = 'Nouveau-mdp-admin-2026';
    const stSoi = await ecrireComptes(PORT_POSTE, potA, c.liste.map(u => u.username === ADMIN[0] ? Object.assign({}, u, { password: MDPA }) : u), c.revision);
    verif('l\'administrateur change son mot de passe : sa session reste ouverte, l\'autre se ferme, celle de l\'agent ne bouge pas',
      stSoi === 200 && await connecte(PORT_POSTE, potA) && !(await connecte(PORT_POSTE, potA2)) && await connecte(PORT_POSTE, potAgent2), stSoi);

    // ---------- 2. un compte qui ne peut qu'ajouter signe ses ajouts ----------
    // l'agent écrit directement à l'API, au nom de l'administrateur ; le serveur inscrit le nom de sa session
    const ajouter = async (pot, cle, rec) => {
      const d = await H.donnees(PORT_POSTE, pot), x = d && d[cle];
      return H.ecrire(PORT_POSTE, pot, cle, JSON.stringify((x ? JSON.parse(x.valeur) : []).concat([rec])), x ? x.revision : 0);
    };
    const stocke = async (cle, id) => (JSON.parse(((await H.donnees(PORT_POSTE, potA)) || {})[cle]?.valeur || '[]')).find(r => r && r.id === id);
    const stSig = await ajouter(potAgent2, 'vigie_hse_signalements', { id: 'sig-essai-1', date: '2026-10-18', description: 'Essai', auteur: ADMIN[0] });
    const stPh = await ajouter(potAgent2, 'vigie_hse_signalements_photos', { id: 'sph-essai-1', signalementId: 'sig-essai-1', auteur: ADMIN[0], data: '' });
    verif('signalement et photo ajoutés au nom d\'un autre : signés du nom de l\'agent',
      stSig === 200 && stPh === 200 && (await stocke('vigie_hse_signalements', 'sig-essai-1') || {}).auteur === agent.username && (await stocke('vigie_hse_signalements_photos', 'sph-essai-1') || {}).auteur === agent.username, { stSig, stPh });
    const stLuAutre = await ajouter(potAgent2, 'vigie_hse_politique_lectures', { id: 'lu-pol-1-' + ADMIN[0], versionId: 'pol-1', auteur: ADMIN[0], le: '2026-10-18' });
    const stLu = await ajouter(potAgent2, 'vigie_hse_politique_lectures', { id: 'lu-pol-1-' + agent.username, versionId: 'pol-1', auteur: ADMIN[0], le: '2026-10-18' });
    verif('prise de connaissance : au nom d\'un autre refusée (403) ; la sienne signée de son nom',
      stLuAutre === 403 && stLu === 200 && (await stocke('vigie_hse_politique_lectures', 'lu-pol-1-' + agent.username) || {}).auteur === agent.username, { stLuAutre, stLu });
    const stSst = await ajouter(potAgent2, 'vigie_hse_rsst', { id: 'rsst-essai-1', date: '2026-10-18', observation: 'Essai', auteur: ADMIN[0] });
    const stAno = await ajouter(potAgent2, 'vigie_hse_rsst', { id: 'rsst-essai-2', date: '2026-10-18', observation: 'Essai', auteur: 'Anonyme' });
    verif('Registre SST : un dépôt au nom d\'un autre signé du nom de l\'agent ; « Anonyme » reste anonyme',
      stSst === 200 && stAno === 200 && (await stocke('vigie_hse_rsst', 'rsst-essai-1') || {}).auteur === agent.username && (await stocke('vigie_hse_rsst', 'rsst-essai-2') || {}).auteur === 'Anonyme', { stSst, stAno });
    const stAdm = await ajouter(potA, 'vigie_hse_rsst', { id: 'rsst-import-1', date: '2026-10-18', observation: 'Import', auteur: 'Durand Paul' });
    verif('qui gère le registre (droits complets) garde l\'auteur qu\'il saisit ou importe', stAdm === 200 && (await stocke('vigie_hse_rsst', 'rsst-import-1') || {}).auteur === 'Durand Paul', stAdm);
    await srv.arreter(); srv = null;

    // ---------- serveur de démonstration : rien ne change ----------
    srv = await H.demarrer({ port: PORT_DEMO, env: { VIGIE_BASE: path.join(D, 'demo', 'vigie.db'), VIGIE_SAUVEGARDES: path.join(D, 'demo', 'sauvegardes') } });
    const potD = H.nouveauPot();
    const d = await H.seConnecterParLaPage(PORT_DEMO, 'admin@verchamps.fr', 'admin1234', potD);
    const rh = await H.connecter(PORT_DEMO, 'RH1', '1234', H.nouveauPot());
    verif('serveur de démonstration : les comptes de démonstration inscrits au premier lancement, comme avant', d.session && d.session.user === 'admin@verchamps.fr' && !d.erreurs.length && rh.statut === 200, { d, rh: rh.statut });
    c = await lireComptes(PORT_DEMO, potD);
    const stDemo = await ecrireComptes(PORT_DEMO, potD, c.liste.concat([Object.assign({ password: '1234' }, agent)]), c.revision);
    verif('… mais un compte nouveau y demande aussi 12 caractères', stDemo === 403, stDemo);
  } catch(e){
    verif('exécution sans exception', false, e.stack || String(e));
  } finally {
    if (srv) await srv.arreter();
    if (!GARDER) H.effacer(D); else console.log('Dossier gardé : ' + D);
  }
  process.exit(fin() ? 1 : 0);
})();
