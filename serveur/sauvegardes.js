// Sauvegardes planifiées de la base (P1c, Documentation/PLAN-MISE-EN-PRODUCTION.md §4 quater).
// Une copie complète au démarrage si la dernière date de plus d'un intervalle, puis à chaque intervalle ;
// seules les GARDER plus récentes restent. Une copie se prend sans arrêter le serveur (base.copier).
//
// Restaurer : serveur arrêté, node serveur/restaurer.js (« Restaurer une sauvegarde.bat » sur un poste) —
// ou à la main : remplacer vigie.db par la copie choisie, supprimer vigie.db-wal et vigie.db-shm, relancer.
//
// Une sauvegarde sur le même disque protège d'une erreur de saisie ou d'une base abîmée, pas d'une panne
// du disque : chaque sauvegarde planifiée est donc recopiée dans un second dossier, s'il est réglé (copieHorsDisque).
'use strict';
const fs = require('fs'), path = require('path');

const MOTIF = /^vigie-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;
const deux = n => String(n).padStart(2, '0');
// nom lisible, à l'heure locale : vigie-2026-09-25_14-30-00.db
const nom = d => 'vigie-' + d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '_' + deux(d.getHours()) + '-' + deux(d.getMinutes()) + '-' + deux(d.getSeconds()) + '.db';

function existantes(dossier){
  try { return fs.readdirSync(dossier).filter(f => MOTIF.test(f)).sort(); } catch(e){ return []; }
}

// une sauvegarde maintenant, puis le ménage : renvoie le chemin de la copie
function sauvegarder(base, dossier, garder){
  fs.mkdirSync(dossier, { recursive: true });
  const f = path.join(dossier, nom(new Date()));
  if (fs.existsSync(f)) return f;   // deux dans la même seconde : la première suffit
  base.copier(f);
  const liste = existantes(dossier);
  for (const vieille of liste.slice(0, Math.max(0, liste.length - garder))) fs.rmSync(path.join(dossier, vieille), { force: true });
  return f;
}

// planifie les sauvegardes ; heures = 0 les désactive. Renvoie la fonction qui les arrête.
// apres(fichier) : appelée après chaque sauvegarde réussie (la copie hors du disque)
function planifier(base, { dossier, heures, garder, journal, apres }){
  if (!(heures > 0)) { journal('Sauvegardes planifiées désactivées (VIGIE_SAUVEGARDE_HEURES=0).'); return () => {}; }
  const intervalle = heures * 3600 * 1000;
  const une = () => {
    let f = null;
    try { f = sauvegarder(base, dossier, garder); journal('Sauvegarde : ' + f); }
    catch(e){ journal('SAUVEGARDE ÉCHOUÉE : ' + e.message); }
    if (f && apres) apres(f);
  };
  const derniere = existantes(dossier).pop();
  const age = derniere ? Date.now() - fs.statSync(path.join(dossier, derniere)).mtimeMs : Infinity;
  let minuteur = null;
  const premiere = setTimeout(() => { une(); minuteur = setInterval(une, intervalle); minuteur.unref(); }, Math.max(0, Math.min(intervalle, intervalle - age)));
  premiere.unref();
  journal('Sauvegardes : toutes les ' + heures + ' h dans ' + dossier + ' (les ' + garder + ' dernières gardées).');
  return () => { clearTimeout(premiere); if (minuteur) clearInterval(minuteur); };
}

// Avant une nouvelle version de l'application : une copie de la base, prise avant que la nouvelle
// version n'y écrive quoi que ce soit. La version est reconnue à l'empreinte de ses fichiers (rien à
// numéroter à la main), notée dans un fichier à côté de la base. Ces copies ne suivent pas la rotation
// quotidienne : les AVANT_MAJ dernières restent.
const MOTIF_MAJ = /^vigie-avant-mise-a-jour-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.db$/;
const AVANT_MAJ = 5;
function avantMiseAJour(base, { dossier, fichierVersion, empreinte, journal }){
  let precedente = null;
  try { precedente = fs.readFileSync(fichierVersion, 'utf8').trim(); } catch(e){}
  if (precedente === empreinte) return null;
  let copie = null;
  if (base.nombre() > 0){
    fs.mkdirSync(dossier, { recursive: true });
    copie = base.copier(path.join(dossier, nom(new Date()).replace(/^vigie-/, 'vigie-avant-mise-a-jour-')));
    const liste = fs.readdirSync(dossier).filter(f => MOTIF_MAJ.test(f)).sort();
    for (const vieille of liste.slice(0, Math.max(0, liste.length - AVANT_MAJ))) fs.rmSync(path.join(dossier, vieille), { force: true });
    journal((precedente ? "Nouvelle version de l'application" : 'Première version suivie') + ' : copie de la base prise avant tout changement — ' + copie);
  }
  fs.writeFileSync(fichierVersion, empreinte + '\n');
  return copie;
}

// Copie hors du disque (P2, PLAN-MISE-EN-PRODUCTION.md) : chaque sauvegarde planifiée est recopiée dans un second
// dossier — clé USB, disque externe, partage réseau —, où les GARDER plus récentes restent aussi. Le dossier se règle
// dans Administration → Sauvegardes, depuis ce poste seulement ; VIGIE_SAUVEGARDES_COPIE l'emporte, et c'est la
// seule voie sur un serveur ouvert au réseau (un mot de passe d'administrateur volé ne doit pas suffire à envoyer
// la base entière vers un partage choisi à distance). Le réglage et l'état de la dernière copie (réussie, échouée)
// sont notés dans un fichier à côté de la base : une restauration ne les ramène pas en arrière, et l'échec
// survit à un redémarrage — l'administrateur en est averti au tableau de bord.
const ERREURS = { ENOENT: 'dossier introuvable (clé ou disque débranché, partage absent ?)', EACCES: 'écriture refusée dans ce dossier',
  EPERM: 'écriture refusée dans ce dossier', ENOSPC: 'plus de place sur ce disque', EROFS: 'ce disque est en lecture seule',
  ENOTDIR: "ce chemin n'est pas un dossier", EBUSY: 'fichier occupé' };
const clair = e => ERREURS[e && e.code] || (e && e.message) || String(e);
const meme = (a, b) => process.platform === 'win32' ? path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase() : path.resolve(a) === path.resolve(b);

// le même disque que les sauvegardes ? numéro de volume s'ils existent, sinon la racine du chemin (C:\, \\serveur\partage\)
function memeDisque(a, b){
  try { return fs.statSync(a).dev === fs.statSync(b).dev; }
  catch(e){ return path.parse(path.resolve(a)).root.toLowerCase() === path.parse(path.resolve(b)).root.toLowerCase(); }
}

function copieHorsDisque({ fichierEtat, dossierServeur, dossierSauvegardes, garder, journal }){
  let note = {};
  try { note = JSON.parse(fs.readFileSync(fichierEtat, 'utf8')) || {}; } catch(e){}
  const noter = () => { try { fs.writeFileSync(fichierEtat, JSON.stringify(note, null, 2) + '\n'); } catch(e){ journal('Copie des sauvegardes : état non noté — ' + e.message); } };
  const dossier = () => dossierServeur || note.dossier || '';
  let enCours = Promise.resolve();

  function etat(){
    const d = dossier();
    return { dossier: d, source: dossierServeur ? 'serveur' : (d ? 'administration' : ''),
      memeDisque: !!d && memeDisque(d, dossierSauvegardes), derniere: note.derniere || null, echec: note.echec || null };
  }

  // règle (ou retire, avec '') le dossier : un chemin complet, un dossier qui existe, où l'on peut écrire
  function regler(d){
    if (dossierServeur) return { refus: 'dossier réglé sur le serveur (VIGIE_SAUVEGARDES_COPIE)' };
    d = String(d || '').trim();
    if (d){
      if (!path.isAbsolute(d) || d.length > 400) return { refus: 'donner le chemin complet du dossier (par exemple E:\\Sauvegardes VIGIE)' };
      if (meme(d, dossierSauvegardes)) return { refus: "c'est déjà le dossier des sauvegardes : choisir un autre disque" };
      try { if (!fs.statSync(d).isDirectory()) return { refus: "ce chemin n'est pas un dossier" }; }
      catch(e){ return { refus: e.code === 'ENOENT' ? "ce dossier n'existe pas (le créer d'abord, ou brancher la clé ou le disque)" : clair(e) }; }
      const essai = path.join(d, '.vigie-essai-' + process.pid);
      try { fs.writeFileSync(essai, 'essai'); fs.rmSync(essai, { force: true }); }
      catch(e){ return { refus: clair(e) }; }
      d = path.resolve(d);
      if (note.dossier && meme(d, note.dossier)) return { ok: true };   // inchangé : son état (un échec) reste
    }
    note = d ? { dossier: d } : {};
    noter();
    journal(d ? 'Copie des sauvegardes hors du disque : ' + d : 'Copie des sauvegardes hors du disque retirée.');
    return { ok: true };
  }

  // recopie une sauvegarde (une à la fois) : sous un nom provisoire, renommée une fois complète, puis le ménage
  function copier(fichier){
    const suite = enCours.then(async () => {
      const d = dossier();
      if (!d) return etat();
      const cible = path.join(d, path.basename(fichier)), provisoire = cible + '.partiel';
      let reussie = null, echec = null;
      try {
        await fs.promises.copyFile(fichier, provisoire);
        await fs.promises.rename(provisoire, cible);
        const liste = (await fs.promises.readdir(d)).filter(f => MOTIF.test(f)).sort();
        for (const vieille of liste.slice(0, Math.max(0, liste.length - garder))) await fs.promises.rm(path.join(d, vieille), { force: true });
        reussie = { quand: new Date().toISOString(), fichier: path.basename(fichier) };
        journal('Copie hors du disque : ' + cible);
      } catch(e){
        fs.promises.rm(provisoire, { force: true }).catch(() => {});
        echec = { quand: new Date().toISOString(), message: clair(e) };
        journal('COPIE HORS DU DISQUE ÉCHOUÉE : ' + d + ' — ' + e.message);
      }
      // le dossier a changé pendant la copie : ce résultat-là ne le concerne pas
      if (dossier() === d){
        if (reussie){ note.derniere = reussie; delete note.echec; } else note.echec = echec;
        noter();
      }
      return etat();
    });
    enCours = suite.catch(() => {});
    return suite;
  }

  return { etat, regler, copier, dossier };
}

module.exports = { planifier, sauvegarder, existantes, avantMiseAJour, copieHorsDisque, memeDisque };
