/* ============================================================================
   VIGIE HSE — Signalements de presque-accidents : référentiel commun (question 20, 2026-10-12)
   ----------------------------------------------------------------------------
   Réponse du préventeur à la question 20 (Cahier, 2026-10-11) : un formulaire « Signaler » à part, ouvert à
   tous ; le manager le traite (droit distribuable par profil) ; suites possibles : classé, action au Plan
   d'actions, analyse d'accident, inscription au Registre AT/MP ; « tout doit compter », une pyramide de Bird
   et un objectif de remontée. Question 22 (Cahier, 2026-10-14) : pas d'anonymat, un délai de traitement de
   8 jours, la pyramide confirmée telle quelle, un objectif de remontée pour toute l'organisation.

   Lu par signalements.html (saisie, traitement), reporting.html (pyramide, objectif) et dashboard.html
   (compteur). Une seule définition des suites, du statut, du délai de traitement, des niveaux de la pyramide et du décompte des
   presque-accidents remontés — Documentation/QUESTIONS-METIER-EN-ATTENTE.md, questions 20 et 22.
   ========================================================================== */
(function (racine) {
  "use strict";

  var CLE = "vigie_hse_signalements";
  var CLE_PHOTOS = "vigie_hse_signalements_photos";
  var CLE_PARAMETRES = "vigie_hse_signalements_parametres";

  // Suites qu'un signalement peut recevoir. « Classé » exclut les autres : il n'y a pas de suite à donner.
  var SUITES = [
    { id: "classe", libelle: "Classé" },
    { id: "action", libelle: "Action au Plan d'actions" },
    { id: "analyse", libelle: "Analyse d'accident" },
    { id: "atmp", libelle: "Inscription au Registre AT/MP" }
  ];
  function libelleSuite(id) {
    for (var i = 0; i < SUITES.length; i++) if (SUITES[i].id === id) return SUITES[i].libelle;
    return id;
  }

  // Statut, toujours calculé : clos ; en cours dès qu'une suite ou un commentaire a été posé ; sinon nouveau.
  function statut(s) {
    if (!s) return "Nouveau";
    if (s.clos) return "Clos";
    var t = s.traitement || {};
    if ((t.suites && t.suites.length) || String(t.commentaire || "").trim()) return "En cours";
    return "Nouveau";
  }

  // Pyramide de Bird (Frank E. Bird, 1969 : pour 1 accident grave, 10 accidents légers, 30 accidents matériels
  // et 600 incidents sans dommage). Le préventeur l'a demandée ; la correspondance avec les types du Registre
  // AT/MP, confirmée à la question 22 : « tout doit compter », chaque événement va dans un niveau.
  var NIVEAUX_BIRD = [
    { id: "arret", libelle: "Avec arrêt de travail", detail: "accidents du travail ou de trajet, maladies professionnelles", repere: 1 },
    { id: "sansArret", libelle: "Sans arrêt", detail: "accidents du travail ou de trajet, maladies professionnelles", repere: 10 },
    { id: "benin", libelle: "Incidents bénins", detail: "", repere: 30 },
    { id: "presque", libelle: "Presque-accidents", detail: "inscrits au Registre AT/MP ou signalés", repere: 600 }
  ];
  var TYPES_AVEC_GRAVITE = ["Accident de travail", "Accident de trajet", "Maladie professionnelle"];
  // niveau (index dans NIVEAUX_BIRD) d'un événement du Registre AT/MP ; -1 : type non renseigné ou inconnu
  function niveauBird(r) {
    var t = r && r.typeAtMp;
    if (t === "Presque accident") return 3;
    if (t === "Incident bénin" || t === "Bénin") return 2;
    if (TYPES_AVEC_GRAVITE.indexOf(t) >= 0) return r.arret ? 0 : 1;
    return -1;
  }

  // Décompte des niveaux sur des événements du registre et des signalements DÉJÀ filtrés (période, périmètre).
  // Un signalement inscrit au registre n'est compté qu'une fois : par son événement du registre (signalementId).
  // registreComplet : tous les événements du registre visibles, pour reconnaître un signalement inscrit dont
  // l'événement tomberait hors de la période choisie.
  function pyramide(evenements, signalements, registreComplet) {
    var n = [0, 0, 0, 0], horsPyramide = 0, inscrits = {};
    (registreComplet || evenements || []).forEach(function (r) { if (r && r.signalementId) inscrits[r.signalementId] = true; });
    (evenements || []).forEach(function (r) { var i = niveauBird(r); if (i < 0) horsPyramide++; else n[i]++; });
    var signales = 0;
    (signalements || []).forEach(function (s) { if (s && !inscrits[s.id]) signales++; });
    n[3] += signales;
    return { niveaux: n, horsPyramide: horsPyramide, signalementsSeuls: signales };
  }

  // Objectif de remontée : un nombre de presque-accidents par an, ramené à la durée de la période (même prorata
  // que le taux de fréquence, question 2). null si aucun objectif n'est fixé.
  function objectifSurPeriode(objectifAnnuel, jours) {
    var o = Number(objectifAnnuel);
    if (!(o > 0)) return null;
    return Math.round(o * Math.max(1, Number(jours) || 365) / 365 * 10) / 10;
  }
  function lireParametres(store) {
    try { var p = JSON.parse(store.getItem(CLE_PARAMETRES) || "null"); return p && typeof p === "object" ? p : {}; } catch (e) { return {}; }
  }

  // Délai de traitement (question 22 : « 8 jours ») : un signalement encore « Nouveau » au-delà de ce délai après
  // son envoi est en retard. 8 jours calendaires par défaut ; chaque organisation le règle sur la page Signalements.
  var DELAI_TRAITEMENT = 8;
  function delaiTraitement(params) {
    var d = Number(params && params.delaiTraitement);
    return Math.floor(d) === d && d >= 1 && d <= 365 ? d : DELAI_TRAITEMENT;
  }
  // Date limite de traitement (« AAAA-MM-JJ », heure locale) : jour de l'envoi + délai — à défaut de date d'envoi,
  // le jour des faits. null si aucune date n'est lisible.
  function echeanceTraitement(s, delai) {
    var D = racine.VigieDates, t = null;
    if (s && s.dateCreation) { t = new Date(s.dateCreation); if (isNaN(t)) t = null; }
    if (!t && s && /^\d{4}-\d{2}-\d{2}$/.test(String(s.date || ""))) t = D.lire(s.date);
    if (!t) return null;
    t.setDate(t.getDate() + (delai || DELAI_TRAITEMENT));
    return D.iso(t);
  }
  function enRetard(s, aujourdhui, delai) {
    if (statut(s) !== "Nouveau") return false;
    var e = echeanceTraitement(s, delai);
    return !!e && aujourdhui > e;
  }

  racine.VigieSignalements = {
    CLE: CLE, CLE_PHOTOS: CLE_PHOTOS, CLE_PARAMETRES: CLE_PARAMETRES,
    SUITES: SUITES, libelleSuite: libelleSuite, statut: statut,
    NIVEAUX_BIRD: NIVEAUX_BIRD, niveauBird: niveauBird, pyramide: pyramide,
    objectifSurPeriode: objectifSurPeriode, lireParametres: lireParametres,
    DELAI_TRAITEMENT: DELAI_TRAITEMENT, delaiTraitement: delaiTraitement, echeanceTraitement: echeanceTraitement, enRetard: enRetard
  };
})(typeof window !== "undefined" ? window : this);
