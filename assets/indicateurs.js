/* ============================================================================
   VIGIE HSE — Indicateurs d'une période : une seule définition des chiffres (2026-10-12)
   ----------------------------------------------------------------------------
   Les calculs d'Indicateurs & Reporting, sortis de la page pour être partagés avec la Revue de direction
   (ISO 45001 § 9.3) et les Objectifs santé-sécurité (§ 6.2, assets/objectifs-ref.js) : les mêmes chiffres, calculés de la
   même façon, partout. Aucune écriture.

     VigieIndicateurs.calculer(store, debut, fin) → un objet de chiffres (et les listes filtrées utiles aux
     graphiques). « store » : VigieStore (ou tout objet qui a getItem) ; « debut » et « fin » : dates
     « AAAA-MM-JJ » ou "" (pas de borne). Une période inversée est remise dans l'ordre.

   Règles reprises telles quelles du Reporting : question 1 (un retard hors période reste compté à part),
   question 2 (TF au prorata de la durée réelle, assets/hse-formulas.js), question 20 (pyramide de Bird et
   objectif de remontée, assets/signalements-ref.js). Dates lues à l'heure locale (assets/dates-locales.js).
   ========================================================================== */
(function (racine) {
  "use strict";

  function inPeriod(dateStr, dDebut, dFin) {
    if (!dateStr) return true;
    if (dDebut && dateStr < dDebut) return false;
    if (dFin && dateStr > dFin) return false;
    return true;
  }

  // Échéance d'un élément daté : « late » (dépassée), « soon » (dans les 60 jours), « ok », « inconnu » (sans date).
  function computeStatus(dateStr, periodiciteMois, fallbackMonths) {
    if (!dateStr) return "inconnu";
    const d = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? racine.VigieDates.lire(dateStr) : new Date(dateStr);
    if (isNaN(d.getTime())) return "inconnu";
    const prochaine = new Date(d); prochaine.setMonth(prochaine.getMonth() + (Number(periodiciteMois) || fallbackMonths));
    const today = new Date(); const in60 = new Date(today); in60.setDate(in60.getDate() + 60);
    if (prochaine < today) return "late";
    if (prochaine <= in60) return "soon";
    return "ok";
  }

  // Lecture défensive d'un registre (aucune génération de seed ici) : un tableau, vide si absent ou illisible
  function lecteur(store) {
    return function (key) {
      try { const raw = store.getItem(key); if (!raw) return []; const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
      catch (e) { return []; }
    };
  }

  function calculer(store, debut, fin) {
    const lire = lecteur(store);
    let dDebut = debut || "", dFin = fin || "";
    if (dDebut && dFin && dDebut > dFin) { const t = dDebut; dDebut = dFin; dFin = t; }
    const today = new Date();
    const VF = racine.VigieFormules, VS = racine.VigieSignalements;

    // ---- AT/MP ----
    const ATMP_ALL = lire("vigie_hse_dataset");
    const ATMP = ATMP_ALL.filter(r => inPeriod(r.dateAT, dDebut, dFin));
    const atTotal = ATMP.length;
    const atAvec = ATMP.filter(r => r.arret).length;
    const atJours = ATMP.reduce((s, r) => s + (Number(r.joursArret) || 0), 0);
    // Question 2 (2026-09-15, option B) : prorata de la durée réelle de la période ; sans borne de début, depuis
    // l'événement le plus ancien affiché.
    const dureeAtJours = (() => {
      const fin2 = dFin || racine.VigieDates.iso(today);
      let debut2 = dDebut;
      if (!debut2) {
        const dates = ATMP.map(r => r.dateAT).filter(Boolean).sort();
        debut2 = dates.length ? dates[0] : fin2;
      }
      const ms = new Date(fin2) - new Date(debut2);
      return Math.max(1, Math.round(ms / 86400000) + 1);
    })();
    const tf = VF.tauxFrequence(atAvec, dureeAtJours);
    // TG estimé, même formule que le Registre AT/MP (2026-10-13 : lu par les Objectifs santé-sécurité, pas affiché par le Reporting)
    const tg = VF.tauxGravite(atJours, dureeAtJours);
    // TF « réel » (heures saisies dans Gestion RH, au mois) : numérateur et dénominateur bornés aux mêmes mois entiers.
    const periodeDebut = dDebut ? dDebut.slice(0, 7) : "";
    const periodeFin = dFin ? dFin.slice(0, 7) : "";
    const atAvecReel = ATMP_ALL.filter(r => r.arret && r.dateAT &&
      (!periodeDebut || r.dateAT.slice(0, 7) >= periodeDebut) && (!periodeFin || r.dateAT.slice(0, 7) <= periodeFin)).length;
    const heuresReelles = VF.sommeHeures(lire("vigie_hse_heures_travaillees"), { debut: periodeDebut, fin: periodeFin });
    const tfReel = VF.tauxFrequenceReel(atAvecReel, heuresReelles);

    // ---- DUERP ----
    const DUERP = lire("vigie_hse_duerp_dataset")
      .filter(r => inPeriod(r.dateEvaluation, dDebut, dFin))
      .map(r => Object.assign({}, r, { score: (Number(r.frequence) || 0) * (Number(r.gravite) || 0) }));
    const duTotal = DUERP.length;
    const duPrio = DUERP.filter(r => r.score > 6);
    const hseScorePct = duTotal ? Math.round(((duTotal - duPrio.length) / duTotal) * 100) : null;

    // ---- Plan d'actions ----
    const ACTIONS = lire("vigie_hse_actions").filter(a => inPeriod(a.dateCreation, dDebut, dFin));
    const paTotal = ACTIONS.length;
    const todayStr = racine.VigieDates.iso(today);
    const paRetard = ACTIONS.filter(a => a.statut !== "Fait" && a.echeance && a.echeance < todayStr).length;
    const paEnCours = ACTIONS.filter(a => a.statut === "En cours").length;
    const paFait = ACTIONS.filter(a => a.statut === "Fait").length;
    const paTaux = paTotal ? Math.round((paFait / paTotal) * 100) : null;
    // Efficacité (ISO 45001 § 10.2, 2026-10-07) : parmi les actions faites de la période
    const paEfficaces = ACTIONS.filter(a => a.statut === "Fait" && a.efficacite === "Efficace").length;
    const paNonEfficaces = ACTIONS.filter(a => a.statut === "Fait" && a.efficacite === "Non efficace").length;
    const paAVerifier = paFait - paEfficaces - paNonEfficaces;

    // ---- Santé & Visites (question 1, option B : le retard hors période reste compté à part) ----
    const VISITES_ALL = lire("vigie_hse_visites");
    const VISITES = VISITES_ALL.filter(v => inPeriod(v.dateDerniere, dDebut, dFin));
    const svTotal = VISITES.length;
    const svStatus = VISITES.map(v => computeStatus(v.dateDerniere, v.periodiciteMois, 24));
    const svOk = svStatus.filter(s => s === "ok").length;
    const svSoon = svStatus.filter(s => s === "soon").length;
    const svLate = svStatus.filter(s => s === "late").length;
    const svLateTous = VISITES_ALL.map(v => computeStatus(v.dateDerniere, v.periodiciteMois, 24)).filter(s => s === "late").length;
    const svLateHorsPeriode = Math.max(0, svLateTous - svLate);

    // ---- Registre santé et sécurité ----
    const RSST = lire("vigie_hse_rsst").filter(r => inPeriod(r.date, dDebut, dFin));
    const rsstTotal = RSST.length;
    const rsstNouvelle = RSST.filter(r => r.statut === "Nouvelle").length;
    const rsstTraitee = RSST.filter(r => r.statut === "Traitée").length;
    const rsstTaux = rsstTotal ? Math.round((rsstTraitee / rsstTotal) * 100) : null;

    // ---- Vérifications périodiques ----
    const VERIF_ALL = lire("vigie_hse_verifications");
    const VERIF = VERIF_ALL.filter(v => inPeriod(v.dateDerniere, dDebut, dFin));
    const vpTotal = VERIF.length;
    const vpStatus = VERIF.map(v => computeStatus(v.dateDerniere, v.periodiciteMois, 12));
    const vpOk = vpStatus.filter(s => s === "ok").length;
    const vpNonConforme = VERIF.filter(v => v.conformite === "Non conforme").length;
    const vpLate = vpStatus.filter(s => s === "late").length;
    const vpLateTous = VERIF_ALL.map(v => computeStatus(v.dateDerniere, v.periodiciteMois, 12)).filter(s => s === "late").length;
    const vpLateHorsPeriode = Math.max(0, vpLateTous - vpLate);

    // ---- Inspection / Audit ----
    const INSPECTIONS = lire("vigie_hse_inspections").filter(i => inPeriod(i.dateInspection, dDebut, dFin));
    const iaTotal = INSPECTIONS.length;
    const iaConforme = INSPECTIONS.filter(i => i.statutGlobal === "Conforme").length;
    const iaTaux = iaTotal ? Math.round((iaConforme / iaTotal) * 100) : null;
    const iaNonConforme = INSPECTIONS.filter(i => i.statutGlobal === "Non conforme").length;

    // ---- Produits chimiques ----
    const PRODUITS = lire("vigie_hse_produits_chimiques").filter(p => inPeriod(p.dateMajFDS, dDebut, dFin));
    const pcTotal = PRODUITS.length;
    const pcCmr = PRODUITS.filter(p => Array.isArray(p.pictogrammes) && p.pictogrammes.some(c => c === "GHS06" || c === "GHS08")).length;

    // ---- Formation / Habilitation ----
    const HABS_ALL = lire("vigie_hse_habilitations");
    const HABS = HABS_ALL.filter(h => inPeriod(h.dateObtention, dDebut, dFin));
    const fhTotal = HABS.length;
    const fhStatus = HABS.map(h => computeStatus(h.dateObtention, h.dureeValiditeMois, 24));
    const fhOk = fhStatus.filter(s => s === "ok").length;
    const fhExpiree = fhStatus.filter(s => s === "late").length;
    const fhExpireeTous = HABS_ALL.map(h => computeStatus(h.dateObtention, h.dureeValiditeMois, 24)).filter(s => s === "late").length;
    const fhExpireeHorsPeriode = Math.max(0, fhExpireeTous - fhExpiree);

    // ---- EPI & Dotation ----
    const EPI_CAT = lire("vigie_hse_epi_catalogue");
    const EPI_DOT_ALL = lire("vigie_hse_epi_dotations");
    const EPI_DOT = EPI_DOT_ALL.filter(d => inPeriod(d.dateRemise, dDebut, dFin));
    const catById = {};
    EPI_CAT.forEach(c => { catById[c.id] = c; });
    const epiTotal = EPI_DOT.length;
    let epiOk = 0, epiRenew = 0, epiLate = 0;
    EPI_DOT.forEach(d => {
      const cat = catById[d.articleId] || {};
      if (!cat.dureeVieMois) return;
      const s = computeStatus(d.dateRemise, cat.dureeVieMois, cat.dureeVieMois);
      if (s === "ok") epiOk++; else if (s === "soon" || s === "late") epiRenew++;
      if (s === "late") epiLate++;
    });
    let epiLateTous = 0;
    EPI_DOT_ALL.forEach(d => {
      const cat = catById[d.articleId] || {};
      if (!cat.dureeVieMois) return;
      if (computeStatus(d.dateRemise, cat.dureeVieMois, cat.dureeVieMois) === "late") epiLateTous++;
    });
    const epiLateHorsPeriode = Math.max(0, epiLateTous - epiLate);

    // ---- Accidents et jours d'arrêt par type de risque ----
    const riskCounts = {}, riskJours = {};
    ATMP.forEach(r => {
      const risque = r.risque || "Non renseigné";
      riskCounts[risque] = (riskCounts[risque] || 0) + 1;
      riskJours[risque] = (riskJours[risque] || 0) + (Number(r.joursArret) || 0);
    });

    // ---- Remontée des événements par type (jalon J2) : ordre de gravité, nombres bruts ----
    const TYPES_REMONTEE = [
      ["Presque accident", r => r.typeAtMp === "Presque accident"],
      ["Incident bénin", r => r.typeAtMp === "Incident bénin" || r.typeAtMp === "Bénin"],
      ["Accident de travail sans arrêt", r => r.typeAtMp === "Accident de travail" && !r.arret],
      ["Accident de travail avec arrêt", r => r.typeAtMp === "Accident de travail" && !!r.arret],
      ["Accident de trajet", r => r.typeAtMp === "Accident de trajet"],
      ["Maladie professionnelle", r => r.typeAtMp === "Maladie professionnelle"],
    ];
    const typeCounts = TYPES_REMONTEE.map(([libelle, f]) => [libelle, ATMP.filter(f).length]);
    const typeAutres = ATMP.filter(r => !TYPES_REMONTEE.some(([, f]) => f(r))).length;
    if (typeAutres) typeCounts.push(["Autre ou non renseigné", typeAutres]);

    // ---- Pyramide de Bird et objectif de remontée (question 20) ----
    const SIG = lire(VS.CLE).filter(s => inPeriod(s.date, dDebut, dFin));
    const bird = VS.pyramide(ATMP, SIG, ATMP_ALL);
    const objectifAnnuel = Number(VS.lireParametres(store).objectifAnnuel) || 0;
    const objectifPeriode = VS.objectifSurPeriode(objectifAnnuel, dureeAtJours);
    const sigStatuts = SIG.map(VS.statut);
    const sigTotal = SIG.length;
    const sigNouveaux = sigStatuts.filter(s => s === "Nouveau").length;
    const sigClos = sigStatuts.filter(s => s === "Clos").length;

    return {
      dDebut, dFin, dureeAtJours,
      ATMP, ATMP_ALL, VISITES_ALL, VERIF_ALL, HABS_ALL, EPI_DOT_ALL, SIG,
      atTotal, atAvec, atJours, tf, tg, tfReel, hseScorePct, duTotal, duPrio,
      paTotal, paTaux, paEnCours, paRetard, paFait, paEfficaces, paNonEfficaces, paAVerifier,
      svTotal, svOk, svSoon, svLate, svLateHorsPeriode, svLateTous,
      rsstTotal, rsstTaux, rsstNouvelle, rsstTraitee,
      vpTotal, vpOk, vpNonConforme, vpLate, vpLateHorsPeriode, vpLateTous,
      iaTotal, iaConforme, iaTaux, iaNonConforme, pcTotal, pcCmr,
      fhTotal, fhOk, fhExpiree, fhExpireeHorsPeriode, fhExpireeTous,
      epiTotal, epiOk, epiRenew, epiLate, epiLateHorsPeriode, epiLateTous,
      riskCounts, riskJours, typeCounts, bird, objectifAnnuel, objectifPeriode,
      sigTotal, sigNouveaux, sigClos,
    };
  }
  racine.VigieIndicateurs = { calculer: calculer, lecteur: lecteur, inPeriod: inPeriod, computeStatus: computeStatus };
})(typeof window !== "undefined" ? window : this);
