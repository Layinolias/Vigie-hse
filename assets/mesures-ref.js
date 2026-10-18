/* ============================================================================
   VIGIE HSE — Niveaux des mesures de prévention (ISO 45001 § 8.1.2, 2026-10-18)
   ----------------------------------------------------------------------------
   La hiérarchie des mesures, dans l'ordre de la norme (§ 8.1.2 a à e) : supprimer le danger, le remplacer par ce qui
   est moins dangereux, protéger collectivement et réorganiser le travail, organiser (consignes, procédures,
   formation), et seulement en dernier protéger chacun (EPI).

   Une action du Plan d'actions (clé vigie_hse_actions) porte, si on l'a rangée, `niveauMesure` : l'identifiant d'un
   des NIVEAUX. Rien n'est imposé ni signalé : une action non rangée reste valable, et une protection individuelle
   prévue seule n'est pas mise en avant (question 32). Partagé par le Plan d'actions et la Préparation ISO 45001.
   Aucune écriture.
============================================================================ */
(function (racine) {
  "use strict";

  const CHAMP = "niveauMesure";
  const NIVEAUX = [
    { id: "supprimer", rang: 1, libelle: "Supprimer le danger", court: "Supprimer", aide: "Le danger disparaît : on ne fait plus l'opération, on n'utilise plus le produit ou l'équipement" },
    { id: "remplacer", rang: 2, libelle: "Remplacer par moins dangereux", court: "Remplacer", aide: "Un procédé, une opération, un produit ou un équipement moins dangereux" },
    { id: "collective", rang: 3, libelle: "Protection collective, réorganisation", court: "Collective", aide: "Moyens techniques et réorganisation du travail, qui protègent tout le monde à la fois" },
    { id: "organisation", rang: 4, libelle: "Consignes, procédures, formation", court: "Organisation", aide: "Consignes, procédures, signalisation, formation" },
    { id: "individuelle", rang: 5, libelle: "Protection individuelle (EPI)", court: "Individuelle", aide: "Équipement de protection porté par chacun" },
  ];
  const NON_RANGEE = "Non rangée";

  function niveau(id) { return NIVEAUX.find(n => n.id === id) || null; }
  function libelle(id) { const n = niveau(id); return n ? n.libelle : ""; }

  const norm = (s) => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  // Une cellule importée : l'identifiant, le rang (« 3 », « Niveau 3 »), le libellé ou son mot court ; "" si rien n'est reconnu.
  function reconnaitre(texte) {
    const t = norm(texte);
    if (!t) return "";
    const rang = t.match(/^(?:niveau |niv )?([1-5])(?: |$)/);
    if (rang) return NIVEAUX[Number(rang[1]) - 1].id;
    const n = NIVEAUX.find(x => t === x.id || t === norm(x.libelle) || t === norm(x.court) || t.startsWith(norm(x.libelle)));
    if (n) return n.id;
    if (/\bepi\b/.test(t)) return "individuelle";
    return "";
  }

  // Combien d'actions à chaque niveau, et combien ne sont pas rangées.
  function bilan(actions) {
    const s = { total: 0, rangees: 0, nonRangees: 0, parNiveau: {} };
    NIVEAUX.forEach(n => { s.parNiveau[n.id] = 0; });
    (actions || []).forEach(a => {
      if (!a) return;
      s.total++;
      if (niveau(a[CHAMP])) { s.rangees++; s.parNiveau[a[CHAMP]]++; } else s.nonRangees++;
    });
    return s;
  }

  racine.VigieMesures = {
    CHAMP: CHAMP, NIVEAUX: NIVEAUX, NON_RANGEE: NON_RANGEE,
    niveau: niveau, libelle: libelle, reconnaitre: reconnaitre, bilan: bilan,
  };
})(typeof window !== "undefined" ? window : this);
