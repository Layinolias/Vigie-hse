/* ============================================================================
   VIGIE HSE — Contexte et enjeux (ISO 45001 § 4.1, 4.2 et 6.1.1, 2026-10-15 ; domaine d'application, § 4.3, 2026-10-18)
   ----------------------------------------------------------------------------
   Trois registres courts, tenus ensemble parce qu'ils se répondent : les enjeux internes et externes qui pèsent sur
   la démarche de santé et de sécurité (§ 4.1), les parties intéressées et leurs besoins et attentes (§ 4.2), et les
   risques et opportunités pour la démarche elle-même (§ 6.1.1 ; les risques pour la santé des personnes restent au
   Document unique), chacun rattaché, s'il y a lieu, à l'enjeu ou à la partie dont il vient, avec ses actions au Plan
   d'actions ; et, à part, le domaine d'application du système, en versions datées (§ 4.3). Partagé par la page Contexte et enjeux, le Plan d'actions et la Revue de direction (§ 9.3 b : les
   changements des enjeux, des attentes, des risques et opportunités en sont une donnée d'entrée). Aucune écriture.
   À charger après dates-locales.js.

   Un élément (clé vigie_hse_contexte), selon son registre :
     enjeu  { id, registre: "enjeu", origine (« Interne », « Externe »), theme (THEMES), texte, effet }
     partie { id, registre: "partie", partie, besoins, exigence (vrai : une obligation, à suivre dans Conformité
              réglementaire), reponse (comment on y répond) }
     ro     { id, registre: "ro", type (« Risque », « Opportunité »), texte, sourceId (enjeu ou partie d'origine),
              niveau (NIVEAUX : importance), evaluation, actions: [{ id, description, responsable, echeance }] }
     revue  { id, registre: "revue", date, par, constat } — la revue annuelle du registre (hors des trois registres)
     domaine { id, registre: "domaine", version (1, 2…), depuis (« AAAA-MM-JJ », en vigueur depuis), enonce, activites,
              exclusions (et leur justification), validePar, diffusion (comment il est mis à disposition),
              organisation: [{ nom, services: [...] }] (les entrées et services suivis par l'outil le jour de la version),
              auteur, dateCreation } — le domaine d'application du système (§ 4.3, 2026-10-18), hors des trois registres :
              une nouvelle version s'ajoute, les précédentes restent ; celle en vigueur est la plus récente déjà commencée
   et pour tous : archive (n'est plus d'actualité : avec motifArchive, archiveLe, archivePar), auteur, dateCreation,
   modifiePar, dateMaj. Les actions rejoignent le Plan d'actions sous « pa-ro-<élément>-<action> » (origine
   « Risques et opportunités »).

   Réponse du préventeur (question 30, 2026-10-16) : l'importance d'un risque ou d'une opportunité se dit sur trois niveaux
   (élevée, moyenne, faible), avec un texte d'évaluation ; le registre se tient au fil de l'eau et se revoit chaque année
   (« revue annuelle à faire » un an après la dernière) ; les listes proposées conviennent.
   ========================================================================== */
(function (racine) {
  "use strict";

  const CLE = "vigie_hse_contexte";
  const REGISTRES = { enjeu: "Enjeu", partie: "Partie intéressée", ro: "Risque ou opportunité" };
  const ORIGINES = ["Interne", "Externe"];
  const THEMES = ["Réglementaire", "Organisation et management", "Social et humain", "Technique et matériel",
    "Économique et budgétaire", "Environnement et territoire", "Autre"];
  const TYPES_RO = ["Risque", "Opportunité"];
  const NIVEAUX = ["Élevée", "Moyenne", "Faible"];   // importance d'un risque ou d'une opportunité (question 30)
  // des suggestions à la saisie, pas une liste fermée (les mots du secteur s'appliquent à l'affichage)
  const PARTIES = ["Agents", "Encadrement", "Représentants du personnel et F3SCT", "Médecine de prévention",
    "Inspection en santé et sécurité", "Centre de gestion", "Assureur", "Entreprises extérieures", "Usagers", "Élus", "Fournisseurs"];

  const valides = l => (Array.isArray(l) ? l : []).filter(x => x && typeof x === "object" && x.id && REGISTRES[x.registre]);
  const du = (l, r) => valides(l).filter(x => x.registre === r);
  const actifs = l => valides(l).filter(x => !x.archive);
  const actionsDe = x => (x && Array.isArray(x.actions) ? x.actions : []).filter(a => a && String(a.description || "").trim());
  const idAction = (x, a) => "pa-ro-" + x.id + "-" + a.id;
  function statutAction(x, a, actions) {
    const p = (Array.isArray(actions) ? actions : []).find(z => z && z.id === idAction(x, a));
    return p ? (p.statut || "À faire") : "À faire";
  }
  const pasFaites = (x, actions) => actionsDe(x).filter(a => statutAction(x, a, actions) !== "Fait");
  // ce qui nomme un élément dans une liste
  const libelle = x => !x ? "" : x.registre === "partie" ? String(x.partie || "") : String(x.texte || "");
  const source = (x, liste) => x && x.sourceId ? valides(liste).find(z => z.id === x.sourceId && z.registre !== "ro") || null : null;
  // les risques et opportunités actifs rattachés à un enjeu ou à une partie
  const lies = (liste, id) => actifs(liste).filter(x => x.registre === "ro" && x.sourceId === id);

  // le jour (AAAA-MM-JJ, heure locale) d'une date ou d'un horodatage
  function jourDe(v) {
    if (typeof v !== "string" || !v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const d = new Date(v);
    return isNaN(d) ? "" : (racine.VigieDates ? racine.VigieDates.iso(d) : v.slice(0, 10));
  }
  // la dernière mise à jour d'un élément : retrait, modification ou création
  const majLe = x => [jourDe(x && x.archiveLe), jourDe(x && x.dateMaj), jourDe(x && x.dateCreation)].filter(Boolean).sort().pop() || "";

  // un an après une date « AAAA-MM-JJ », à l'heure locale
  function unAnApres(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "") || !racine.VigieDates) return "";
    const d = racine.VigieDates.lire(iso); d.setFullYear(d.getFullYear() + 1);
    return racine.VigieDates.iso(d);
  }
  // les revues annuelles du registre, la plus récente d'abord
  const revues = l => (Array.isArray(l) ? l : []).filter(x => x && typeof x === "object" && x.id && x.registre === "revue" && /^\d{4}-\d{2}-\d{2}$/.test(x.date || ""))
    .sort((a, b) => b.date.localeCompare(a.date));
  // la revue annuelle est à faire : un registre non vide, jamais revu, ou revu il y a un an ou plus
  function revueAFaire(liste, aujourdhui) {
    if (!actifs(liste).length) return false;
    const r = revues(liste)[0];
    return !r || unAnApres(r.date) <= aujourdhui;
  }

  // Le domaine d'application (§ 4.3) : ses versions, la plus récente d'abord, et celle en vigueur à une date
  const domaines = l => (Array.isArray(l) ? l : []).filter(x => x && typeof x === "object" && x.id && x.registre === "domaine" && /^\d{4}-\d{2}-\d{2}$/.test(x.depuis || ""))
    .sort((a, b) => (Number(b.version) || 0) - (Number(a.version) || 0) || b.depuis.localeCompare(a.depuis));
  const domaineEnVigueur = (l, jour) => domaines(l).filter(x => x.depuis <= jour).sort((a, b) => b.depuis.localeCompare(a.depuis) || (Number(b.version) || 0) - (Number(a.version) || 0))[0] || null;
  const prochaineVersion = l => domaines(l).reduce((n, x) => Math.max(n, Number(x.version) || 0), 0) + 1;
  // l'organisation suivie par l'outil (assets/organisation.js) : [{ nom, services }]
  const organisationDe = O => O ? O.noms().map(nom => ({ nom: nom, services: O.services(nom).slice() })) : [];
  // Ce qui, dans l'organisation d'aujourd'hui, n'est pas celle de la version : entrées et services ajoutés ou disparus
  // → { ajouts: ["Usine 2", "Atelier (Usine 1)"], retraits: [...] } ; vide si la version n'a pas relevé l'organisation
  function ecartOrganisation(version, actuelle) {
    const avant = version && Array.isArray(version.organisation) ? version.organisation : null, r = { ajouts: [], retraits: [] };
    if (!avant) return r;
    const plat = o => (Array.isArray(o) ? o : []).reduce((t, e) => t.concat([String(e.nom)], (Array.isArray(e.services) ? e.services : []).map(s => String(s) + " (" + e.nom + ")")), []);
    const a = plat(avant), b = plat(actuelle);
    r.ajouts = b.filter(x => !a.includes(x));
    r.retraits = a.filter(x => !b.includes(x));
    return r;
  }

  // Le compte des éléments actifs
  function synthese(liste, actions, jour) {
    const a = actifs(liste), ro = a.filter(x => x.registre === "ro");
    const d = domaineEnVigueur(liste, jour || (racine.VigieDates ? racine.VigieDates.aujourdhui() : ""));
    return {
      domaine: d ? { version: Number(d.version) || 0, depuis: d.depuis, validePar: d.validePar || "" } : null,
      enjeux: a.filter(x => x.registre === "enjeu").length,
      internes: a.filter(x => x.registre === "enjeu" && x.origine === "Interne").length,
      externes: a.filter(x => x.registre === "enjeu" && x.origine === "Externe").length,
      parties: a.filter(x => x.registre === "partie").length,
      exigences: a.filter(x => x.registre === "partie" && x.exigence).length,
      risques: ro.filter(x => x.type !== "Opportunité").length,
      opportunites: ro.filter(x => x.type === "Opportunité").length,
      sansAction: ro.filter(x => !actionsDe(x).length).length,
      elevees: ro.filter(x => x.niveau === "Élevée").length,
      sansNiveau: ro.filter(x => !NIVEAUX.includes(x.niveau)).length,
      derniereRevue: (revues(liste)[0] || {}).date || "",
      actions: ro.reduce((n, x) => n + actionsDe(x).length, 0),
      actionsPasFaites: ro.reduce((n, x) => n + pasFaites(x, actions).length, 0),
      retires: valides(liste).length - a.length,
      derniereMaj: valides(liste).map(majLe).filter(Boolean).sort().pop() || "",
    };
  }

  // Pour la revue de direction : le compte du jour, et ce qui a changé entre debut et fin
  // → synthese + mouvements [{ registre, libelle, type, quoi (« Ajouté », « Modifié », « Retiré »), date }]
  function pourPeriode(liste, actions, debut, fin) {
    const s = synthese(liste, actions), dans = d => !!d && d >= debut && d <= fin;
    s.mouvements = valides(liste).map(x => {
      const ar = jourDe(x.archiveLe), cr = jourDe(x.dateCreation), mo = jourDe(x.dateMaj);
      const quoi = x.archive && dans(ar) ? ["Retiré", ar] : dans(cr) && !x.archive ? ["Ajouté", cr] : dans(mo) && !x.archive ? ["Modifié", mo] : null;
      return quoi ? { registre: REGISTRES[x.registre], libelle: libelle(x), type: x.registre === "ro" ? (x.type || "Risque") : "", quoi: quoi[0], date: quoi[1] } : null;
    }).filter(Boolean).concat(revues(liste).filter(r => dans(r.date)).map(r => ({ registre: "Revue annuelle du registre", libelle: r.constat || "", type: "", quoi: "Revu", date: r.date })))
      .concat(domaines(liste).filter(x => dans(x.depuis)).map(x => ({ registre: "Domaine d'application", libelle: "version " + (Number(x.version) || "?") + (x.validePar ? ", validée par " + x.validePar : ""), type: "", quoi: "Nouvelle version", date: x.depuis })))
      .sort((a, b) => a.date.localeCompare(b.date));
    return s;
  }

  racine.VigieContexte = {
    CLE: CLE, REGISTRES: REGISTRES, ORIGINES: ORIGINES, THEMES: THEMES, TYPES_RO: TYPES_RO, NIVEAUX: NIVEAUX, PARTIES: PARTIES,
    unAnApres: unAnApres, revues: revues, revueAFaire: revueAFaire,
    domaines: domaines, domaineEnVigueur: domaineEnVigueur, prochaineVersion: prochaineVersion, organisationDe: organisationDe, ecartOrganisation: ecartOrganisation,
    valides: valides, du: du, actifs: actifs, actionsDe: actionsDe, idAction: idAction, statutAction: statutAction, pasFaites: pasFaites,
    libelle: libelle, source: source, lies: lies, jourDe: jourDe, majLe: majLe, synthese: synthese, pourPeriode: pourPeriode,
  };
})(typeof window !== "undefined" ? window : this);
