// L'outil de restauration (serveur/restaurer.js, « Restaurer une sauvegarde.bat ») essayé comme un utilisateur, sur
// un vrai dossier de données avec de vraies copies prises par la base (Documentation/LIVRAISON-POSTE.md).
//   node tests/test-restauration.js
'use strict';
const H = require('./harnais-serveur.js');
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const { ouvrir, examiner } = require(path.join(H.DEPOT, 'serveur', 'base-sqlite.js'));

const GARDER = process.argv.includes('--garder');
const PORT_OUTIL = 8891, PORT_SERVEUR = 8892;
const D = H.dossierTemporaire('restauration'), BASE = path.join(D, 'vigie.db'), SAUV = path.join(D, 'sauvegardes');
const ENV = { VIGIE_DOSSIER: D, PORT: String(PORT_OUTIL) };

// l'outil, avec ce que l'utilisateur tape ; → { code, sortie }
function outil(entree, env){
  const r = spawnSync(process.execPath, [path.join(H.DEPOT, 'serveur', 'restaurer.js')], { input: entree, encoding: 'utf8', env: Object.assign({}, process.env, ENV, env || {}), timeout: 60000 });
  return { code: r.status, sortie: (r.stdout || '') + (r.stderr || '') };
}
const empreinte = f => fs.existsSync(f) ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') : 'absent';
const etat = () => [BASE, BASE + '-wal', BASE + '-shm'].map(empreinte).join('/') + '|' + (fs.existsSync(SAUV) ? fs.readdirSync(SAUV).sort().join(',') : '');
const accidents = f => { const b = ouvrir(f); try { return JSON.parse(b.lire('vigie_hse_dataset') || '[]').length; } finally { b.fermer(); } };
const deux = n => String(n).padStart(2, '0');
const nomQuotidien = d => 'vigie-' + d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '_' + deux(d.getHours()) + '-' + deux(d.getMinutes()) + '-' + deux(d.getSeconds()) + '.db';
// la base, avec n accidents (+ un journal d'audit)
function remplir(n, auditIds){
  const b = ouvrir(BASE);
  try {
    const l = Array.from({ length: n }, (_, i) => ({ id: 'at-' + i, dateAT: '2026-0' + (1 + i % 9) + '-10', typeAtMp: 'Accident de travail', service: 'Voirie & Réseaux' }));
    const ecrire = (cle, valeur) => { const t = b.lireTout()[cle]; b.ecrire(cle, valeur, t ? t.revision : 0); };
    ecrire('vigie_hse_dataset', JSON.stringify(l));
    ecrire('vigie_hse_users', JSON.stringify([{ id: 'u1', email: 'admin@verchamps.fr', profils: ['p-admin'] }]));
    ecrire('vigie_hse_audit_log', JSON.stringify((auditIds || []).map(id => ({ id, timestamp: new Date().toISOString(), utilisateur: 'admin', module: 'Test', type: 'Modification', description: id }))));
  } finally { b.fermer(); }
}
// une copie quotidienne, datée d'il y a « heures » heures
function copieQuotidienne(heures){
  fs.mkdirSync(SAUV, { recursive: true });
  const quand = new Date(Date.now() - heures * 3600000);
  const f = path.join(SAUV, nomQuotidien(quand));
  const b = ouvrir(BASE); try { b.copier(f); } finally { b.fermer(); }
  fs.utimesSync(f, quand, quand);
  return f;
}
// un processus qui vit le temps du test (son numéro sert de repère « base en service »)
function processusVivant(){ return spawn(process.execPath, ['-e', 'setTimeout(() => {}, 120000)'], { stdio: 'ignore' }); }

(async () => {
  const { verif, fin } = H.bilan('Restauration');
  let srv = null, vivant = null;
  try {
    // préparation : deux copies quotidiennes (3 puis 5 accidents), base actuelle à 8 accidents, plus récente qu'elles
    remplir(3, ['a-1']); const ancienne = copieQuotidienne(48);
    remplir(5, ['a-1', 'a-2']); const recente = copieQuotidienne(24);
    remplir(8, ['a-1', 'a-2', 'a-3']);
    { const b = ouvrir(BASE); try { b.noterConsultation('RH1', 'registre-at-mp.html', ['vigie_hse_dataset']); } finally { b.fermer(); } }
    const avant = etat();

    // 1. refus si VIGIE HSE tourne (sur le port de l'outil)
    srv = await H.demarrer({ port: PORT_OUTIL, env: { VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV, VIGIE_DEMO: '0' } });
    let r = outil('1\nOUI\n');
    verif('VIGIE HSE lancé : refus, rien de modifié', r.code === 1 && /en cours d'utilisation/.test(r.sortie) && accidents(BASE) === 8, r.sortie.slice(-300));
    await srv.arreter(); srv = null;
    const avant2 = etat();   // le serveur a pu écrire (copie avant mise à jour, repère)

    // 2. annulations et numéro invalide : sans effet
    r = outil('\n');
    verif('Entrée seule : « Annulé », rien de modifié', r.code === 0 && /Annulé/.test(r.sortie) && etat() === avant2, r.sortie.slice(-200));
    verif('… la liste des copies dit ce qu\'elles contiennent', /3 accident\(s\)/.test(r.sortie) && /5 accident\(s\)/.test(r.sortie) && /Vos données actuelles : .*8 accident\(s\)/.test(r.sortie), r.sortie.slice(0, 900));
    r = outil('9\n');
    verif('numéro invalide : refus, rien de modifié', r.code === 1 && /ne correspond à aucune/.test(r.sortie) && etat() === avant2, r.sortie.slice(-200));
    r = outil('1\nnon\n');
    verif('confirmation autre que OUI : « Annulé », rien de modifié', r.code === 0 && /Annulé/.test(r.sortie) && etat() === avant2, r.sortie.slice(-200));

    // 3. copie abîmée : refusée avant toute modification
    const abimee = path.join(SAUV, nomQuotidien(new Date(Date.now() - 3600000)));
    fs.writeFileSync(abimee, Buffer.concat([Buffer.from('SQLite format 3\0'), crypto.randomBytes(4096)]));
    fs.utimesSync(abimee, new Date(Date.now() - 3600000), new Date(Date.now() - 3600000));
    const avant3 = etat();
    const k = /(\d+)\. [^\n]+\n\s+ILLISIBLE/.exec(outil('\n').sortie);
    r = outil((k ? k[1] : '0') + '\nOUI\n');
    verif('copie abîmée : listée « ILLISIBLE », refusée, rien de modifié', r.code === 1 && /ILLISIBLE/.test(r.sortie) && /ne peut pas être utilisée/.test(r.sortie) && etat() === avant3, r.sortie.slice(-300));
    fs.rmSync(abimee);

    // 4. restauration complète, avec un -wal résiduel à éliminer
    fs.writeFileSync(BASE + '-wal', crypto.randomBytes(2048));
    const listeAvant = outil('\n').sortie;
    const n = (new RegExp('(\\d+)\\. [^\\n]+ — copie quotidienne\\n\\s+[^\\n]*5 accident')).exec(listeAvant);
    r = outil((n ? n[1] : '1') + '\nOUI\n');
    verif('restauration de la copie à 5 accidents : faite', r.code === 0 && /C'est fait/.test(r.sortie) && accidents(BASE) === 5, r.sortie.slice(-500));
    verif('… sans -wal ni -shm résiduel, base saine', !fs.existsSync(BASE + '-wal') && !fs.existsSync(BASE + '-shm') && examiner(BASE).ok);
    const deCote = fs.readdirSync(SAUV).filter(f => /^vigie-avant-restauration-/.test(f));
    verif('… les données d\'avant mises de côté', deCote.length === 1 && accidents(path.join(SAUV, deCote[0])) === 8, deCote);
    { const b = ouvrir(BASE);
      try {
        const audit = JSON.parse(b.lire('vigie_hse_audit_log') || '[]');
        verif('journaux reportés : la ligne postérieure à la copie reprise, la restauration inscrite', audit.some(x => x.id === 'a-3') && audit.some(x => x.type === 'Restauration'), audit.map(x => x.id));
        verif('… et la consultation de données de santé reprise', b.consultations('', 1e9).length >= 1);
      } finally { b.fermer(); } }

    // 5. VIGIE HSE redémarre sur la base remise en place
    srv = await H.demarrer({ port: PORT_SERVEUR, env: { VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV, VIGIE_DEMO: '0' } });
    verif('VIGIE HSE redémarre sur la base remise en place', await H.repond(PORT_SERVEUR));
    await srv.arreter(); srv = null;

    // 6. la restauration se défait avec le même outil
    const liste2 = outil('\n').sortie;
    const m = /(\d+)\. [^\n]+ — vos données juste avant une restauration/.exec(liste2);
    r = outil((m ? m[1] : '1') + '\nOUI\n');
    verif('restauration défaite : retour aux 8 accidents', r.code === 0 && accidents(BASE) === 8, r.sortie.slice(-300));

    // 7. rotation : 5 copies « avant restauration » au plus
    for (let i = 0; i < 6; i++){ outil('1\nOUI\n'); await H.sleep(1100); }
    const gardees = fs.readdirSync(SAUV).filter(f => /^vigie-avant-restauration-.+\.db$/.test(f));
    verif('rotation : 5 copies « avant restauration » gardées', gardees.length === 5, gardees);

    // 8. repère « base en service »
    vivant = processusVivant();
    await H.sleep(300);
    fs.writeFileSync(BASE + '.en-service', String(vivant.pid));
    r = outil('1\nOUI\n', { PORT: '8899' });
    verif('repère d\'un processus vivant : refus, même sur un autre port', r.code === 1 && /en cours d'utilisation/.test(r.sortie), r.sortie.slice(-200));
    H.tuer(vivant); await H.attendreFin(vivant);
    r = outil('\n');
    verif('repère d\'un processus disparu (arrêt brutal) : ignoré', r.code === 0 && /Annulé/.test(r.sortie), r.sortie.slice(-200));
    fs.rmSync(BASE + '.en-service', { force: true });
    srv = await H.demarrer({ port: PORT_SERVEUR, env: { VIGIE_BASE: BASE, VIGIE_SAUVEGARDES: SAUV, VIGIE_DEMO: '0' } });
    r = outil('1\nOUI\n');   // l'outil regarde le port 8891 : seul le repère du serveur (8892) peut l'arrêter
    verif('VIGIE HSE lancé sur un autre port : refus par son repère', r.code === 1 && /en cours d'utilisation/.test(r.sortie) && fs.existsSync(BASE + '.en-service'), r.sortie.slice(-200));
    await srv.arreter(); srv = null;

    // 9. le .bat, exécuté par cmd.exe : Entrée seule → annulé, aucun message technique
    if (process.platform === 'win32'){
      const b = H.lancerBat(path.join(H.DEPOT, 'Restaurer une sauvegarde.bat'), { env: ENV, entree: '\n' });
      await H.attendreFin(b.proc, 30000);
      const texte = b.sortie();
      verif('« Restaurer une sauvegarde.bat » par cmd.exe : la liste, « Annulé », aucun message technique', /Sauvegardes disponibles/.test(texte) && /Annulé/.test(texte) && !H.MESSAGES_TECHNIQUES.test(texte), texte.slice(-600));
      if (b.proc.exitCode === null) H.tuer(b.proc);
    }
    void avant; void ancienne; void recente;
  } finally {
    if (vivant) H.tuer(vivant);
    if (srv) await srv.arreter();
    if (GARDER) console.log('dossier de travail gardé : ' + D); else H.effacer(D);
  }
  process.exit(fin() ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
