// Taxonomie des familles de risque (nom, définition courte) — SOURCE UNIQUE depuis le 2026-09-20 :
// administration.html, document-unique.html et saisie-duerp.html construisent leur RISK_TAXONOMY_DEFAULT
// à partir d'ici (par copie : l'éditeur de référentiels d'administration.html modifie son tableau),
// et base-documentaire.html amorce une fiche wiki par famille.
(function(){
  var FAMILLES = [
    ["Agressions verbales / physique","Risque de violence externe (de la part de clients, usagers ou tiers) ou interne (entre collègues ou hiérarchie), se traduisant par des insultes, des menaces, des intimidations ou des coups, générant un impact sévère sur la santé mentale et physique."],
    ["Chute de plain-pied","Le risque de blessure résulte de la chute elle-même ou du heurt d'un objet, d'une partie de machine ou de mobilier. Sols glissants, inégaux ou encombrés, passages étroits, stockage inadapté dans les zones de passage."],
    ["Chute de hauteur","Le risque de blessure résulte d'une chute avec dénivelé ou du heurt d'un objet en contrebas. Zones en contrebas, accès en hauteur, équipements mobiles (échelles, escabeaux, échafaudages), moyens de fortune."],
    ["Effondrements et aux chutes d'objets","Chute d'objets stockés en hauteur, effondrement de structures ou ensellement. Marchandises en vrac ou en hauteur instable, charges mal arrimées, coactivité sur plusieurs niveaux."],
    ["Circulations Internes","Heurt d'une personne par un véhicule/engin, ou collision entre véhicules/engins et obstacles, à l'intérieur des locaux ou sur sites extérieurs."],
    ["Déplacement dans les locaux","Exiguïté des locaux ou objets encombrants rendant la circulation difficile. Risque permanent de choc contre les éléments fixes."],
    ["Routiers","Accident lié aux déplacements professionnels (missions) ou au trajet domicile-travail. Kilométrage important, dispersion des chantiers, urgence, téléphone au volant, véhicule inadapté."],
    ["Vibrations","Transmission de vibrations mécaniques au corps humain (outils électroportatifs ou engins). Atteintes vasculaires, nerveuses ou articulaires en cas d'exposition prolongée."],
    ["Bruit","Inconfort, fatigue mentale, gêne à la communication ; surdité professionnelle irréversible en cas d'exposition prolongée au-delà de 80dB(A) en continu ou 130dB(C) en impulsif."],
    ["Activité Physique (TMS)","Blessure ou pathologie chronique (TMS) liée aux efforts physiques, chocs, gestes répétitifs ou postures contraignantes. Charges lourdes, rythme élevé, absence d'aides à la manutention."],
    ["Equipement de travail","Blessure grave par l'action mécanique des machines, d'éléments mobiles ou d'outils portatifs. Absence de protections, projections, non-consignation lors de la maintenance."],
    ["Biologique","Contamination par agents biologiques (virus, bactéries, parasites, moisissures) ou contact avec fluides corporels/déchets. Inclut agressions par insectes vecteurs et allergies."],
    ["Produits chimiques","Intoxication, allergie ou brûlure par inhalation, ingestion ou contact cutané avec des substances dangereuses. Étiquetage, gaz, solvants, poussières, fumées."],
    ["Conduites addictives","Consommation de substances psychoactives sur le lieu de travail, altérant vigilance, réflexes et discernement."],
    ["Manutention Mécanique","Blessure liée à la charge manutentionnée ou au moyen de levage/transport (chariot, transpalette, pont roulant). Matériel inadapté, charges mal réparties, vitesse excessive."],
    ["Ambiance thermique","Inconfort et fatigue pouvant porter atteinte à la santé (coups de chaleur, déshydratation, gelures, malaises). Températures inadaptées, hygrométrie, courants d'air."],
    ["Incendie et Explosion","Brûlure, asphyxie ou traumatisme par onde de choc. Substances inflammables/comburantes/explosives, atmosphères ATEX, mélanges incompatibles."],
    ["Electrique","Choc électrique ou brûlure thermique par contact avec pièces sous tension. Matériel défectueux, absence de consignation, non-respect des distances de sécurité."],
    ["Ambiance Lumineuse","Fatigue, erreurs et chutes favorisées par un éclairage insuffisant, l'éblouissement, les reflets ou les zones de passage mal éclairées."],
    ["Rayonnements","Atteinte à la santé par exposition à des rayonnements ionisants, optiques (IR, UV, lasers) ou électromagnétiques."],
    ["Travail de nuit","Perturbation des rythmes circadiens, troubles du sommeil, altération de la vie sociale, risques métaboliques et cardiovasculaires à long terme."],
    ["RPS","Gêne, stress chronique ou traumatismes psychologiques liés à des conditions de travail dégradées : surcharge, manque d'autonomie, conflits, insécurité de l'emploi."],
    ["Animaux","Exposition à des animaux sauvages, errants ou domestiques lors d'interventions en extérieur : traumatismes (morsures, griffures) ou zoonoses."],
    ["Coactivité","Interférence entre activités, équipements et personnel de la structure et d'entreprises extérieures intervenant simultanément. Absence d'inspection commune et de plan de prévention partagé."],
    ["Fluide sous pression","Blessure par projection, éclatement ou fuite sur réseaux sous pression (air comprimé, vapeur, hydraulique). Corrosion, soupapes défectueuses, raccords non conformes."],
    ["Travail isolé","Salarié hors de vue ou de portée de voix d'autrui, sans recours immédiat en cas de détresse — aggravateur majeur des conséquences d'un accident."],
    ["Travail sur écran","Fatigue visuelle, maux de tête, TMS (nuque, épaules, lombaires) liés à une position assise prolongée devant un poste mal réglé."],
    ["Amiante et aux fibres inhalables","Inhalation de fibres pouvant provoquer des pathologies graves à long terme (asbestose, cancers) — critique en bâtiment, rénovation, maintenance."],
    ["Nanomatériaux et nanoparticules","Exposition à des substances à l'échelle nanométrique dont la toxicité par inhalation ou pénétration cutanée est encore mal cernée."],
    ["télétravail et à l'hyperconnexion","Isolement à domicile, flou vie privée/professionnelle, difficulté à déconnecter, ergonomie inadaptée du poste à domicile."],
    ["Noyade","Submersion, hydrocution ou noyade lors de travaux/déplacements à proximité de cours d'eau, plans d'eau, bassins ou ouvrages hydrauliques non sécurisés."],
    ["VSST","Agissements sexistes ou actes de harcèlement/agression sexuelle de la part de l'entourage professionnel ou de tiers."],
    ["Autres","Risques divers non listés spécifiquement dans la nomenclature standard, identifiés lors de l'analyse de situations de travail particulières."],
  ];

  // Identifiant de la fiche wiki d'une famille de risque. C'est la SEULE source de cet identifiant :
  // base-documentaire.html amorce ses fiches avec, document-unique.html et saisie-duerp.html y renvoient.
  function sansAccents(s){
    return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }
  function slug(s){
    return sansAccents(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // Retrouve la famille officielle derrière un libellé saisi ou importé : la comparaison passe par le slug,
  // si bien que « Chute de plain pied » (import Excel) retrouve « Chute de plain-pied » (taxonomie).
  // Libellés d'autres référentiels (risques du Registre AT/MP) qui désignent SANS AMBIGUÏTÉ une famille
  // de la taxonomie mais s'écrivent autrement. N'ajouter ici aucun rapprochement qui demande un jugement
  // de préventeur : un rapprochement discutable se pose d'abord comme question métier (règle 9).
  var EQUIVALENCES = {
    "routier": "Routiers",                              // singulier / pluriel
    "activite-physique": "Activité Physique (TMS)",    // même famille, sans la précision
    // tranchés par le préventeur (question 11, 2026-09-23) — ces deux lignes demandaient son avis
    "chute-d-objet": "Effondrements et aux chutes d'objets",
    "deplacement": "Déplacement dans les locaux",       // déplacement dans les locaux, pas sur la route (« Routier » à part)
  };
  function trouver(nom){
    var s = slug(nom);
    if (!s) return null;
    for (var i = 0; i < FAMILLES.length; i++){ if (slug(FAMILLES[i][0]) === s) return FAMILLES[i]; }
    var cible = EQUIVALENCES[s];
    if (cible){ for (var j = 0; j < FAMILLES.length; j++){ if (FAMILLES[j][0] === cible) return FAMILLES[j]; } }
    return null;
  }
  function idFiche(nom){
    var f = trouver(nom);
    return f ? "wiki-risque-" + slug(f[0]) : "";
  }
  // Lien vers la fiche, ou "" si le libellé ne correspond à aucune famille connue (famille ajoutée
  // à la main dans les référentiels : aucune fiche n'existe pour elle, on n'affiche donc pas de lien).
  function lienFiche(nom){
    var id = idFiche(nom);
    return id ? "base-documentaire.html?fiche=" + encodeURIComponent(id) : "";
  }

  window.VigieRisques = { FAMILLES: FAMILLES, slug: slug, trouver: trouver, idFiche: idFiche, lienFiche: lienFiche };
})();
