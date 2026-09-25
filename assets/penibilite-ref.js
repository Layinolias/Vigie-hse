// Facteurs de pénibilité et seuils d'exposition (module 5, 2026-09-25).
//
// Source : Code du travail, article D4163-2, en vigueur depuis le 1er septembre 2023 (décret
// n° 2023-760) — relu sur Légifrance le 2026-09-25, recoupé avec entreprendre.service-public.gouv.fr
// (fiche F15504). Validé par le préventeur (question 15 du Cahier : « le tableau est juste »).
// LES SEUILS CHANGENT PAR DÉCRET : les relire avant toute nouvelle version, et mettre à jour RELU_LE.
//
// Un seuil est une durée MINIMALE (intitulé de la colonne dans le texte) : il est atteint dès que la
// durée d'exposition l'égale. La saisie se fait en durée passée au-delà de l'intensité minimale.
(function(){
  if (window.VigiePenibilite) return;

  var SOURCE = {
    texte: "Code du travail, article D4163-2 (en vigueur depuis le 1er septembre 2023)",
    lien: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000036410046",
    relu_le: "2026-09-25",
  };

  // Critères à seuil. Le bruit compte deux critères : un seul atteint suffit pour le facteur.
  var CRITERES = [
    { id:"hyperbare",    facteur:"Activités exercées en milieu hyperbare", intensite:"Interventions ou travaux à au moins 1 200 hectopascals", seuil:60, unite:"interventions ou travaux par an" },
    { id:"temperatures", facteur:"Températures extrêmes", intensite:"Température inférieure ou égale à 5 °C ou au moins égale à 30 °C", seuil:900, unite:"heures par an" },
    { id:"bruitMoyen",   facteur:"Bruit", intensite:"Niveau d'exposition rapporté à 8 heures d'au moins 81 décibels (A)", seuil:600, unite:"heures par an" },
    { id:"bruitCrete",   facteur:"Bruit", intensite:"Pression acoustique de crête au moins égale à 135 décibels (C)", seuil:120, unite:"fois par an" },
    { id:"nuit",         facteur:"Travail de nuit", intensite:"Une heure de travail entre minuit et 5 heures", seuil:100, unite:"nuits par an" },
    { id:"alternantes",  facteur:"Travail en équipes successives alternantes", intensite:"Au moins une heure de travail entre minuit et 5 heures", seuil:30, unite:"nuits par an" },
    { id:"repetitif",    facteur:"Travail répétitif", intensite:"Temps de cycle ≤ 30 s : 15 actions techniques ou plus ; temps de cycle > 30 s, variable ou absent : 30 actions techniques ou plus par minute", seuil:900, unite:"heures par an" },
  ];

  // Les quatre autres facteurs de l'article L4161-1 : sans seuil (hors compte professionnel de
  // prévention depuis 2017), suivis quand même pour la prévention (réponse Q15 : « oui »).
  var SANS_SEUIL = [
    { id:"manutention", facteur:"Manutentions manuelles de charges" },
    { id:"postures",    facteur:"Postures pénibles (positions forcées des articulations)" },
    { id:"vibrations",  facteur:"Vibrations mécaniques" },
    { id:"chimiques",   facteur:"Agents chimiques dangereux, y compris poussières et fumées" },
  ];

  function nombre(v){ var n = Number(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) && n > 0 ? n : 0; }

  // valeurs : { idCritère: durée saisie } → { criteres: [ids atteints], facteurs: [libellés, sans doublon] }
  function evaluer(valeurs){
    var v = valeurs || {}, criteres = [], facteurs = [];
    CRITERES.forEach(function(c){
      if (nombre(v[c.id]) >= c.seuil){
        criteres.push(c.id);
        if (facteurs.indexOf(c.facteur) < 0) facteurs.push(c.facteur);
      }
    });
    return { criteres: criteres, facteurs: facteurs };
  }
  // sansSeuil : { id: { expose, precision } } → libellés des facteurs cochés
  function sansSeuilExposes(sansSeuil){
    var s = sansSeuil || {};
    return SANS_SEUIL.filter(function(f){ return s[f.id] && s[f.id].expose; }).map(function(f){ return f.facteur; });
  }

  window.VigiePenibilite = { SOURCE: SOURCE, CRITERES: CRITERES, SANS_SEUIL: SANS_SEUIL, nombre: nombre, evaluer: evaluer, sansSeuilExposes: sansSeuilExposes };
})();
