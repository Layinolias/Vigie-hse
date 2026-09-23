// Génère DATATEST/11-REF-urgences-exercices.xlsx : le fichier de démonstration que urgences-exercices.html
// demande depuis sa création, mais qui n'avait jamais été produit (404 en ligne, module vide en démo).
// En-têtes = ceux de l'export de la page, pour que le fichier se réimporte aussi à la main.
// Sites et services : ceux déjà utilisés par les autres fichiers DATATEST et par les référentiels.
// Les périodicités (6 ou 12 mois) sont des VALEURS DE DÉMONSTRATION saisies comme le ferait un
// utilisateur (réponse Q6 : la périodicité se saisit au cas par cas) — pas une règle réglementaire.
// Les dates sont réparties pour que le panneau d'échéances montre les trois statuts
// (à jour, à programmer sous 60 jours, en retard) par rapport à la date de génération.
// Usage : npm install xlsx, puis node Documentation/outils/generer-datatest-urgences.js (depuis la racine du dépôt).
const path = require('path');
const XLSX = require('xlsx');

const L = [
  // site, collectivité, service, type, date, durée, participation, périodicité, constatations, auteur
  ["Hôtel de Ville", "Ville", "Accueil & Affaires Générales", "Évacuation incendie", "2026-05-19", 25, "64 personnes évacuées (agents et public)", 12,
   "Évacuation complète en 4 min 10. Deux agents de l'accueil ne connaissaient pas le point de rassemblement.", "PREV1"],
  ["Hôtel de Ville", "Ville", "Accueil & Affaires Générales", "Intrusion", "2025-10-14", 30, "Agents d'accueil et de l'état civil (12)", 12,
   "Consigne de confinement bien appliquée ; l'alerte n'a pas été entendue au 2e étage.", "PREV1"],
  ["Ateliers municipaux", "Ville", "Atelier Mécanique", "Évacuation incendie", "2025-03-11", 20, "Toute l'équipe présente (18 agents)", 12,
   "Issue de secours côté réserve encombrée par des pneus ; dégagée le jour même.", "RH1"],
  ["Ateliers municipaux", "Ville", "Atelier Mécanique", "Évacuation incendie", "2025-11-18", 20, "Toute l'équipe présente (21 agents)", 12,
   "Issue de secours dégagée. Temps d'évacuation amélioré de 50 secondes par rapport à l'exercice précédent.", "RH1"],
  ["Complexe sportif municipal", "Ville", "Sports & Vie Associative", "Évacuation incendie", "2026-04-07", 30, "Agents et usagers d'un créneau scolaire (91 personnes)", 6,
   "Évacuation fluide. Balisage lumineux d'une sortie défaillant, signalé au service Patrimoine.", "PREV1"],
  ["Cuisine centrale", "Ville", "Restauration Collective", "Évacuation incendie", "2025-09-02", 15, "Équipe du matin (14 agents)", 12,
   "Coupure gaz effectuée par le chef d'équipe. Aucun écart relevé.", "RH1"],
  ["Chantier école Jules-Ferry", "Ville", "Enfance & Jeunesse", "Évacuation incendie", "2026-02-24", 20, "Animateurs et enfants de l'accueil périscolaire (48)", 6,
   "Appel des enfants au point de rassemblement trop long : prévoir une liste de présence imprimée.", "PREV1"],
  ["Hôtel d'Agglomération", "Agglomération", "Direction Générale des Services", "Évacuation incendie", "2026-06-09", 25, "Ensemble des agents présents (72)", 12,
   "Guides et serre-files bien identifiés. Un ascenseur utilisé malgré la consigne.", "PREV1"],
  ["Conservatoire de Musique", "Agglomération", "Conservatoire de Musique", "Évacuation incendie", "2025-12-02", 20, "Enseignants et élèves d'un cours collectif (37)", 12,
   "Instruments laissés dans les couloirs pendant l'évacuation : consigne à rappeler.", "RH1"],
  ["Déchetterie intercommunale", "Agglomération", "Collecte & Propreté", "Risque environnemental", "2025-06-17", 45, "Agents de quai et de pesée (9)", 12,
   "Scénario de montée des eaux : procédure de mise en sécurité des bennes connue, mais pas le point de repli.", "PREV1"],
  ["Complexe aquatique intercommunal", "Agglomération", "Sports & Vie Associative", "Risque environnemental", "2026-03-17", 40, "Maîtres-nageurs et agents techniques (16)", 12,
   "Scénario de fuite de produit de traitement de l'eau : confinement du local technique réalisé en 6 minutes.", "PREV1"],
  ["Médiathèque centrale", "Agglomération", "Réseau des Médiathèques", "Évacuation incendie", "2025-11-04", 20, "Agents et lecteurs présents (53)", 12,
   "Évacuation complète. Le déclencheur manuel du rez-de-chaussée était masqué par un présentoir.", "RH1"],
  ["Crèche Les Petits Pas", "Agglomération", "Petite Enfance & Familles", "Évacuation incendie", "2026-01-20", 15, "Professionnelles et enfants (26)", 6,
   "Évacuation des lits à roulettes validée ; une porte coupe-feu se referme trop lentement.", "PREV1"],
];

const lignes = L.map(r => ({
  "Site": r[0], "Date exercice": r[4], "Collectivité": r[1], "Service": r[2],
  "Type": r[3], "Durée minutes": r[5], "Participation": r[6],
  "Périodicité mois": r[7], "Constatations": r[8], "Auteur": r[9],
}));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lignes), "Exercices");
XLSX.writeFile(wb, path.join(__dirname, '..', '..', 'DATATEST', '11-REF-urgences-exercices.xlsx'));
console.log('DATATEST/11-REF-urgences-exercices.xlsx : ' + lignes.length + ' exercices, feuille « Exercices »');
