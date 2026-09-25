// Prépare le paquet à remettre à un utilisateur (Documentation/LIVRAISON-POSTE.md) :
//   node serveur/preparer-livraison.js        → livraison/VIGIE-HSE-AAAA-MM-JJ.zip
// Le paquet contient l'application et son lanceur, sans rien de ce qui ne sert qu'au développement :
// ni documentation interne, ni fichiers de démonstration (DATATEST/), ni base, ni ce script.
// Seuls les fichiers suivis par git y entrent : rien de local ne s'y glisse par erreur.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
const GIT = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\cmd\\git.exe') ? 'C:\\Program Files\\Git\\cmd\\git.exe' : 'git';
const git = (...a) => execFileSync(GIT, a, { cwd: RACINE, encoding: 'utf8' }).trim();

// ce qui part chez l'utilisateur
const GARDER = f =>
  (/^[^/]+\.html$/.test(f)) || f.startsWith('assets/') || f.startsWith('KIT-REPRISE/') ||
  (/^serveur\/[^/]+\.js$/.test(f) && f !== 'serveur/preparer-livraison.js') ||
  f === 'Lancer VIGIE HSE.bat' || f === 'LISEZ-MOI.txt';

const modifies = git('status', '--porcelain').split('\n').filter(Boolean);
if (modifies.length && !process.argv.includes('--brouillon')){
  console.error('Des fichiers ne sont pas commités — commiter d\'abord (ou --brouillon pour un essai) :\n' + modifies.join('\n'));
  process.exit(1);
}
// suivis par git (plus, pour un brouillon, les nouveaux pas encore commités), noms séparés par NUL
const fichiers = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean).filter(GARDER);
for (const f of ['Lancer VIGIE HSE.bat', 'LISEZ-MOI.txt', 'serveur/serveur.js', 'serveur/lancer-poste.js', 'login.html', 'assets/stockage.js'])
  if (!fichiers.includes(f)) throw new Error('fichier indispensable absent du dépôt : ' + f);

const d = new Date(), deux = n => String(n).padStart(2, '0');
const jour = d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate());
const commit = git('rev-parse', '--short', 'HEAD');
const etape = fs.mkdtempSync(path.join(os.tmpdir(), 'vigie-livraison-'));
const dossier = path.join(etape, 'VIGIE-HSE');
for (const f of fichiers){
  const cible = path.join(dossier, f);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.copyFileSync(path.join(RACINE, f), cible);
}
fs.writeFileSync(path.join(dossier, 'VERSION.txt'), 'VIGIE HSE — version du ' + jour + ' (' + commit + ')' + (modifies.length ? ' — BROUILLON, fichiers non commités' : '') + '\r\n');

const sortie = path.join(RACINE, 'livraison');
fs.mkdirSync(sortie, { recursive: true });
const zip = path.join(sortie, 'VIGIE-HSE-' + jour + (modifies.length ? '-brouillon' : '') + '.zip');
fs.rmSync(zip, { force: true });
// tar de Windows (10 et plus) écrit un vrai .zip, que l'Explorateur ouvre
const TAR = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'zip';
if (process.platform === 'win32') execFileSync(TAR, ['-a', '-c', '-f', zip, '-C', etape, 'VIGIE-HSE']);
else execFileSync('zip', ['-r', '-q', zip, 'VIGIE-HSE'], { cwd: etape });
fs.rmSync(etape, { recursive: true, force: true });
console.log(fichiers.length + 1 + ' fichiers → ' + zip + ' (' + Math.round(fs.statSync(zip).size / 1024) + ' Ko)');
