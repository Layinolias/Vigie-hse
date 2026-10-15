/* ============================================================================
   VIGIE HSE — Programme annuel de prévention (PAPRIPACT, question 25, 2026-10-15)
   ----------------------------------------------------------------------------
   Le programme d'une année reprend TOUTES les actions du Plan d'actions dont l'échéance tombe dans l'année
   (réponse du préventeur : option A). Pour chacune : le risque ou l'unité de travail visé, la mesure, le
   responsable, l'échéance, et quatre champs saisis au Plan d'actions — coût estimé, financement, conditions
   d'exécution, indicateur de résultat. Avec le programme : l'avis de l'instance (F3SCT ou CST ; CSSCT ou CSE en
   entreprise) et son adoption. À l'adoption, la liste des mesures est photographiée ; le bilan de fin d'année
   la compare au Plan d'actions : réalisées, reportées (échéance repoussée à une année suivante), abandonnées
   (marquées au programme avec un motif, ou retirées du Plan d'actions), non réalisées. Partagé par la page
   Programme annuel de prévention et la Revue de direction. Aucune écriture.

   Un programme (clé vigie_hse_programmes, un par année, identifiant « pg-AAAA ») :
     { id, annee, statut ("Brouillon" | "Adopté"), bilanPrecedent (commentaire du bilan de l'année écoulée),
       avisDate, avisTexte, adopteLe, adoptePar, adopteSaisiPar, mesures (photo à l'adoption),
       abandons: { <id d'action>: { motif, le, par } }, auteur, dateCreation, modifiePar, dateMaj }
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_programmes";
  // les champs du Plan d'actions propres au programme
  const CHAMPS = [
    { id: "coutEstime", nom: "Coût estimé" },
    { id: "financement", nom: "Financement" },
    { id: "conditionsExecution", nom: "Conditions d'exécution" },
    { id: "indicateurResultat", nom: "Indicateur de résultat" },
  ];
  const PHOTO = ["id", "titre", "description", "origine", "service", "collectivite", "risqueLie", "responsable", "echeance", "priorite", "statut",
    "coutEstime", "financement", "conditionsExecution", "indicateurResultat"];
  const LIBELLES = { realisee: "Réalisée", reportee: "Reportée", abandonnee: "Abandonnée", retiree: "Retirée du Plan d'actions",
    "non-realisee": "Non réalisée", "en-cours": "En cours", "a-faire": "À faire" };
  const TONS = { realisee: "bon", reportee: "attention", abandonnee: "neutre", retiree: "neutre", "non-realisee": "mauvais", "en-cours": "neutre", "a-faire": "neutre" };

  const annee = a => String(a || "").slice(0, 4);
  const estCout = v => typeof v === "number" && isFinite(v) && v >= 0;
  // un montant saisi ou importé (« 1 250,50 », « 1250.5 € ») → nombre, ou null
  function montant(v) {
    if (typeof v === "number") return estCout(v) ? v : null;
    const s = String(v == null ? "" : v).replace(/[\s  €]/g, "").replace(",", ".");
    if (!s) return null;
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    return Number(s);
  }
  const euros = (n, dec) => estCout(n) ? n.toLocaleString("fr-FR", { minimumFractionDigits: dec || 0, maximumFractionDigits: 2 }) + " €" : "—";

  // les actions dont l'échéance tombe dans l'année, par échéance puis titre
  function mesuresDeLAnnee(actions, an) {
    const a = String(an);
    return (Array.isArray(actions) ? actions : []).filter(x => x && typeof x === "object" && x.id && /^\d{4}-\d{2}-\d{2}$/.test(x.echeance || "") && annee(x.echeance) === a)
      .sort((x, y) => String(x.echeance).localeCompare(String(y.echeance)) || String(x.titre || "").localeCompare(String(y.titre || ""), "fr"));
  }
  function photo(a) { const o = {}; PHOTO.forEach(k => { if (a[k] !== undefined && a[k] !== "") o[k] = a[k]; }); return o; }
  // les champs du programme qui manquent à une mesure (le financement n'est pas exigé : il peut ne pas y en avoir)
  function aCompleter(m) {
    const l = [];
    if (!estCout(m.coutEstime)) l.push("coût estimé");
    if (!String(m.conditionsExecution || "").trim()) l.push("conditions d'exécution");
    if (!String(m.indicateurResultat || "").trim()) l.push("indicateur de résultat");
    return l;
  }

  // L'état d'une mesure à une date : m (mesure du programme), action (la même au Plan d'actions aujourd'hui, ou null),
  // abandon ({ motif } marqué au programme, ou rien)
  function etatMesure(m, action, an, jour, abandon) {
    let code;
    if (abandon) code = "abandonnee";
    else if (!action) code = "retiree";
    else if (action.statut === "Fait") code = "realisee";
    else if (/^\d{4}/.test(action.echeance || "") && annee(action.echeance) > String(an)) code = "reportee";
    else if (jour && jour > String(an) + "-12-31") code = "non-realisee";
    else code = action.statut === "En cours" ? "en-cours" : "a-faire";
    return { code: code, libelle: LIBELLES[code], ton: TONS[code] };
  }

  // Le contenu d'un programme à une date → { adopte, lignes: [{ m, action, etat }], ajoutees (actions de l'année absentes
  // de la photo d'un programme adopté), comptes par état, cout (prévu), coutRealise, aCompleter (mesures incomplètes) }.
  // Un programme en brouillon (ou absent) se lit sur le Plan d'actions d'aujourd'hui.
  function lire(programme, actions, an, jour) {
    const liste = Array.isArray(actions) ? actions : [];
    const parId = {}; liste.forEach(a => { if (a && a.id) parId[a.id] = a; });
    const adopte = !!programme && programme.statut === "Adopté" && Array.isArray(programme.mesures);
    const abandons = (programme && programme.abandons && typeof programme.abandons === "object") ? programme.abandons : {};
    const base = adopte ? programme.mesures.filter(m => m && m.id) : mesuresDeLAnnee(liste, an).map(photo);
    const lignes = base.map(m => {
      const action = parId[m.id] || null;
      return { m: m, action: action, etat: etatMesure(m, action, an, jour, adopte ? abandons[m.id] : null), abandon: adopte ? abandons[m.id] || null : null };
    });
    const dans = new Set(base.map(m => m.id));
    const ajoutees = adopte ? mesuresDeLAnnee(liste, an).filter(a => !dans.has(a.id)) : [];
    const r = { annee: Number(an), adopte: adopte, lignes: lignes, ajoutees: ajoutees, total: lignes.length,
      realisees: 0, reportees: 0, abandonnees: 0, nonRealisees: 0, enCours: 0, aFaire: 0, cout: 0, coutRealise: 0, sansCout: 0, aCompleter: 0 };
    lignes.forEach(l => {
      const c = l.etat.code;
      if (c === "realisee") r.realisees++;
      else if (c === "reportee") r.reportees++;
      else if (c === "abandonnee" || c === "retiree") r.abandonnees++;
      else if (c === "non-realisee") r.nonRealisees++;
      else if (c === "en-cours") r.enCours++;
      else r.aFaire++;
      if (estCout(l.m.coutEstime)) { r.cout += l.m.coutEstime; if (c === "realisee") r.coutRealise += l.m.coutEstime; } else r.sansCout++;
      if (aCompleter(l.m).length) r.aCompleter++;
    });
    return r;
  }

  const programmeDe = (programmes, an) => (Array.isArray(programmes) ? programmes : []).find(p => p && String(p.annee) === String(an)) || null;

  // Pour la revue de direction : le programme de l'année → { annee, statut, adopteLe, mesures, cout, realisees, reportees, abandonnees, nonRealisees }
  function pourRevue(programmes, actions, an, jour) {
    const p = programmeDe(programmes, an), r = lire(p, actions, an, jour);
    return { annee: Number(an), statut: p ? (p.statut || "Brouillon") : "Aucun", adopteLe: p && p.adopteLe || "", mesures: r.total, cout: r.cout, sansCout: r.sansCout,
      realisees: r.realisees, reportees: r.reportees, abandonnees: r.abandonnees, nonRealisees: r.nonRealisees };
  }

  racine.VigieProgramme = {
    CLE: CLE, CHAMPS: CHAMPS, LIBELLES: LIBELLES,
    montant: montant, euros: euros, estCout: estCout, mesuresDeLAnnee: mesuresDeLAnnee, photo: photo, aCompleter: aCompleter,
    etatMesure: etatMesure, lire: lire, programmeDe: programmeDe, pourRevue: pourRevue,
  };
})(typeof window !== "undefined" ? window : this);
