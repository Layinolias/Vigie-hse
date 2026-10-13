/* ============================================================================
   VIGIE HSE — Objectifs santé-sécurité (ISO 45001 § 6.2, 2026-10-13)
   ----------------------------------------------------------------------------
   Le catalogue des indicateurs sur lesquels un objectif peut porter, et la lecture d'un objectif : sa
   valeur sur sa période, l'écart à sa cible, son état. Partagé par la page Objectifs santé-sécurité et
   la Revue de direction. Aucune écriture.

   Les valeurs viennent d'assets/indicateurs.js : les mêmes chiffres, calculés de la même façon, que la page
   Indicateurs & Reporting (à charger avant : dates-locales.js, hse-formulas.js, signalements-ref.js,
   indicateurs.js).

   Trois natures d'indicateur, lues différemment en cours de période (aucun prorata : la cible vaut pour
   la période entière) :
     - « taux » (taux de fréquence, part d'actions soldées…) : comparable à tout moment → « Tenu à ce jour »
       ou « En écart » ;
     - « cumul » (accidents avec arrêt, presque-accidents remontés…) : ne fait que croître → « Atteint » dès qu'un
       « au moins » est franchi, « Non atteint » dès qu'un « au plus » est dépassé, « En cours » sinon ;
     - « etat » (retards, échéances dépassées) : l'état à la date du calcul, comme un taux.
   Échéance passée : « Atteint » ou « Non atteint ». Un objectif clos garde le résultat de sa clôture.
   ========================================================================== */
(function (racine) {
  "use strict";

  const G_AT = "Accidents du travail et maladies professionnelles";
  const G_PREV = "Prévention et remontée";
  const G_ACT = "Plan d'actions";
  const G_SURV = "Surveillance (état à la date du calcul)";
  const INDICATEURS = [
    { id: "tf", groupe: G_AT, nom: "Taux de fréquence estimé", nature: "taux", sens: "max", dec: 1, unite: "",
      aide: "Accidents avec arrêt × 1 000 000 ÷ heures travaillées estimées sur la période (question 2), comme Indicateurs & Reporting.", valeur: I => I.tf },
    { id: "tfReel", groupe: G_AT, nom: "Taux de fréquence réel", nature: "taux", sens: "max", dec: 1, unite: "",
      aide: "Sur les heures saisies dans Gestion RH, aux mois entiers de la période ; pas de valeur sans heures saisies.", valeur: I => I.tfReel },
    { id: "tg", groupe: G_AT, nom: "Taux de gravité estimé", nature: "taux", sens: "max", dec: 2, unite: "",
      aide: "Jours d'arrêt × 1 000 ÷ heures travaillées estimées sur la période, même formule que le Registre AT/MP.", valeur: I => I.tg },
    { id: "atAvec", groupe: G_AT, nom: "Accidents avec arrêt", nature: "cumul", sens: "max", dec: 0, unite: "",
      aide: "Événements du Registre AT/MP avec arrêt, datés de la période.", valeur: I => I.atAvec },
    { id: "atJours", groupe: G_AT, nom: "Jours d'arrêt", nature: "cumul", sens: "max", dec: 0, unite: "j",
      aide: "Somme des jours d'arrêt des événements de la période.", valeur: I => I.atJours },
    { id: "presqueAccidents", groupe: G_PREV, nom: "Presque-accidents remontés", nature: "cumul", sens: "min", dec: 0, unite: "",
      aide: "Presque-accidents du Registre AT/MP et signalements de la période, sans doublon : le dernier étage de la pyramide de Bird, que mesure aussi l'objectif de remontée (question 20).", valeur: I => I.bird.niveaux[3] },
    { id: "hseScorePct", groupe: G_PREV, nom: "Score HSE du Document unique", nature: "taux", sens: "min", dec: 0, unite: "%",
      aide: "Part des risques évalués sur la période qui ne sont ni élevés ni critiques, comme Indicateurs & Reporting.", valeur: I => I.hseScorePct },
    { id: "iaTaux", groupe: G_PREV, nom: "Inspections conformes", nature: "taux", sens: "min", dec: 0, unite: "%",
      aide: "Part des inspections de la période jugées conformes.", valeur: I => I.iaTaux },
    { id: "rsstTaux", groupe: G_PREV, nom: "Observations du registre santé et sécurité traitées", nature: "taux", sens: "min", dec: 0, unite: "%",
      aide: "Part des observations de la période qui sont traitées.", valeur: I => I.rsstTaux },
    { id: "paTaux", groupe: G_ACT, nom: "Actions soldées", nature: "taux", sens: "min", dec: 0, unite: "%",
      aide: "Part des actions créées sur la période qui sont faites.", valeur: I => I.paTaux },
    { id: "paRetard", groupe: G_ACT, nom: "Actions en retard", nature: "etat", sens: "max", dec: 0, unite: "",
      aide: "Actions créées sur la période, non faites, dont l'échéance est passée à la date du calcul.", valeur: I => I.paRetard },
    { id: "svLateTous", groupe: G_SURV, nom: "Visites médicales en retard", nature: "etat", sens: "max", dec: 0, unite: "",
      aide: "Toutes les visites en retard à la date du calcul, y compris hors période (question 1).", valeur: I => I.svLateTous },
    { id: "vpLateTous", groupe: G_SURV, nom: "Vérifications périodiques en retard", nature: "etat", sens: "max", dec: 0, unite: "",
      aide: "Toutes les vérifications en retard à la date du calcul.", valeur: I => I.vpLateTous },
    { id: "fhExpireeTous", groupe: G_SURV, nom: "Habilitations expirées", nature: "etat", sens: "max", dec: 0, unite: "",
      aide: "Toutes les habilitations expirées à la date du calcul.", valeur: I => I.fhExpireeTous },
    { id: "epiLateTous", groupe: G_SURV, nom: "EPI à renouveler en retard", nature: "etat", sens: "max", dec: 0, unite: "",
      aide: "Toutes les dotations d'EPI en retard de renouvellement à la date du calcul.", valeur: I => I.epiLateTous },
    { id: "manuel", groupe: "Autre", nom: "Mesure saisie à la main", nature: "etat", sens: "max", dec: 2, unite: "",
      aide: "Une valeur relevée hors de l'application (agents formés, budget engagé…), saisie par le responsable ; sans cible, le résultat se constate à la clôture.", valeur: null },
  ];
  const PAR_ID = {};
  INDICATEURS.forEach(i => { PAR_ID[i.id] = i; });
  const indicateur = id => PAR_ID[id] || null;

  const STATUTS = ["En vigueur", "Clos"];
  // état → classe de pastille : bon, mauvais, neutre
  const TON = { "tenu": "bon", "atteint": "bon", "ecart": "mauvais", "non-atteint": "mauvais" };
  const ton = etat => TON[etat] || "neutre";

  // « 1,5 » ou « 1.5 » → 1.5 ; vide ou illisible → null
  function nombre(v) {
    if (v === null || v === undefined) return null;
    const t = String(v).trim().replace(/\s/g, "").replace(",", ".");
    if (t === "" || !/^-?\d+(\.\d+)?$/.test(t)) return null;
    return Number(t);
  }
  const arrondi = (v, dec) => { const p = Math.pow(10, dec == null ? 2 : dec); return Math.round(v * p) / p; };
  function decimales(o) { const ind = indicateur(o && o.indicateur); return ind ? ind.dec : 2; }
  function unite(o) {
    const ind = indicateur(o && o.indicateur);
    if (!ind) return "";
    return ind.id === "manuel" ? String((o && o.unite) || "").trim() : ind.unite;
  }
  // une valeur affichable : « 12,4 », « 85 % », « 6 j », « — »
  function formater(v, o) {
    if (v === null || v === undefined || v === "") return "—";
    const u = unite(o);
    const t = Number(v).toLocaleString("fr-FR", { maximumFractionDigits: decimales(o) });
    return u ? t + (u === "%" ? " %" : " " + u) : t;
  }
  function formaterEcart(e, o) {
    if (e === null || e === undefined) return "—";
    const t = formater(Math.abs(e), o);
    return e > 0 ? "+" + t : e < 0 ? "−" + t : t;
  }
  const libelleSens = s => s === "min" ? "au moins" : "au plus";

  /* La lecture d'un objectif à une date (« ajd », AAAA-MM-JJ ; aujourd'hui par défaut) :
       { valeur, cible, sens, ecart, etat, libelle, borne, fige }
     opts.final : lire comme si l'échéance était passée (clôture). Un objectif clos rend le résultat figé. */
  function evaluer(o, store, ajd, opts) {
    opts = opts || {};
    ajd = ajd || racine.VigieDates.aujourdhui();
    if (o && o.statut === "Clos" && o.resultat && !opts.final) return Object.assign({ fige: true }, o.resultat);
    const ind = indicateur(o && o.indicateur);
    const cible = nombre(o && o.cible);
    const sens = o && o.sens === "min" ? "min" : "max";
    const debut = (o && o.periodeDebut) || "", fin = (o && o.periodeFin) || "";
    const r = { valeur: null, cible: cible, sens: sens, ecart: null, etat: "", libelle: "", borne: "", fige: false };
    const etat = (e, l) => { r.etat = e; r.libelle = l; return r; };
    if (!ind) return etat("sans-donnee", "Indicateur inconnu");
    if (debut && ajd < debut && !opts.final) return etat("a-venir", "À venir");
    const termine = !!opts.final || (!!fin && ajd > fin);
    r.borne = fin && fin < ajd ? fin : ajd;
    if (ind.id === "manuel") r.valeur = nombre(o.valeurManuelle);
    else {
      const v = ind.valeur(racine.VigieIndicateurs.calculer(store, debut, r.borne));
      r.valeur = typeof v === "number" && isFinite(v) ? arrondi(v, ind.dec) : null;
    }
    if (cible === null) return termine ? etat("a-constater", "À constater") : etat("sans-cible", "Sans cible chiffrée");
    if (r.valeur === null) return etat("sans-donnee", "Pas de donnée");
    const ok = sens === "max" ? r.valeur <= cible : r.valeur >= cible;
    r.ecart = arrondi(r.valeur - cible, ind.dec);
    if (termine) return ok ? etat("atteint", "Atteint") : etat("non-atteint", "Non atteint");
    if (ind.nature === "cumul") {
      if (sens === "max" && !ok) return etat("non-atteint", "Non atteint");   // la cible est déjà dépassée
      if (sens === "min" && ok) return etat("atteint", "Atteint");            // déjà franchie
      return etat("en-cours", "En cours");
    }
    return ok ? etat("tenu", "Tenu à ce jour") : etat("ecart", "En écart");
  }

  // Le résultat figé à la clôture ; « constat » (« atteint » ou « non-atteint ») tranche un objectif sans cible chiffrée.
  function resultatDeCloture(o, store, ajd, constat) {
    const e = evaluer(o, store, ajd, { final: true });
    if (e.etat === "a-constater" || e.etat === "sans-donnee") {
      if (constat === "atteint") { e.etat = "atteint"; e.libelle = "Atteint"; }
      else if (constat === "non-atteint") { e.etat = "non-atteint"; e.libelle = "Non atteint"; }
    }
    e.fige = false;
    e.calculeLe = new Date().toISOString();
    return e;
  }

  // Les objectifs dont la période croise [debut, fin] (bornes vides = sans limite), lus à la date « ajd ».
  function pourPeriode(objectifs, store, debut, fin, ajd) {
    return (objectifs || []).filter(o => o && (!fin || !o.periodeDebut || o.periodeDebut <= fin) && (!debut || !o.periodeFin || o.periodeFin >= debut))
      .map(o => {
        const e = evaluer(o, store, ajd);
        return { id: o.id, intitule: o.intitule || "", indicateurId: o.indicateur || "", indicateur: (indicateur(o.indicateur) || { nom: "—" }).nom, sens: e.sens,
          cible: e.cible, valeur: e.valeur, ecart: e.ecart, etat: e.etat, libelle: e.libelle, echeance: o.periodeFin || "",
          unite: unite(o), dec: decimales(o), statut: o.statut || "En vigueur", responsable: o.responsable || "" };
      });
  }

  racine.VigieObjectifs = {
    CLE: "vigie_hse_objectifs", INDICATEURS: INDICATEURS, STATUTS: STATUTS,
    indicateur: indicateur, nombre: nombre, formater: formater, formaterEcart: formaterEcart, libelleSens: libelleSens,
    unite: unite, evaluer: evaluer, resultatDeCloture: resultatDeCloture, pourPeriode: pourPeriode, ton: ton,
  };
})(typeof window !== "undefined" ? window : this);
