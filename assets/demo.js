/* Données de démonstration des modules qui n'ont pas de fichier Excel dans DATATEST/ (2026-10-23).
 *
 * VigieDemo.charger() lit DATATEST/13-DEMO-modules.json et ajoute à chaque registre les enregistrements dont
 * l'identifiant manque : rien de ce qui est déjà là n'est remplacé (comme les fichiers Excel de démonstration,
 * relus par leurs pages). Appelé par login.html à la connexion, en mode navigateur seulement — sur un poste réel
 * (serveur, VIGIE_DEMO=0), DATATEST/ n'est pas servi et rien n'est chargé. Ne bloque jamais la connexion : au
 * pire, après DELAI, la page continue sans les données.
 *
 * Dates relatives, pour une démonstration toujours d'actualité : "J", "J-12", "J+30" (date du jour, à l'heure
 * locale), "J-3T08:55" (horodatage) ; "{A}", "{A-1}" dans un texte : l'année en cours, la précédente.
 */
(function () {
  const FICHIER = "DATATEST/13-DEMO-modules.json";
  const DELAI = 4000;
  const JOUR = /^J([+-]\d+)?$/, HORO = /^J([+-]\d+)?T(\d{2}):(\d{2})$/, ANNEE = /\{A([+-]\d+)?\}/g;

  function valeur(v, ajd) {
    if (typeof v === "string") {
      let m = JOUR.exec(v);
      if (m) { const d = new Date(ajd); d.setDate(d.getDate() + Number(m[1] || 0)); return VigieDates.iso(d); }
      m = HORO.exec(v);
      if (m) { const d = new Date(ajd); d.setDate(d.getDate() + Number(m[1] || 0)); d.setHours(Number(m[2]), Number(m[3]), 0, 0); return d.toISOString(); }
      return v.replace(ANNEE, (x, n) => String(ajd.getFullYear() + Number(n || 0)));
    }
    if (Array.isArray(v)) return v.map(x => valeur(x, ajd));
    if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = valeur(v[k], ajd); return o; }
    return v;
  }

  // ajoute aux registres les enregistrements absents ; → nombre d'enregistrements ajoutés
  function fusionner(jeu, ajd) {
    let ajoutes = 0;
    for (const cle of Object.keys(jeu || {})) {
      if (!/^vigie_hse_/.test(cle) || !Array.isArray(jeu[cle])) continue;
      let actuel = [];
      try { const raw = VigieStore.getItem(cle); if (raw) actuel = JSON.parse(raw); } catch (e) { continue; }
      if (!Array.isArray(actuel)) continue;   // registre d'une autre forme : on n'y touche pas
      const ids = new Set(actuel.map(r => r && r.id));
      const nouveaux = jeu[cle].filter(r => r && r.id && !ids.has(r.id)).map(r => valeur(r, ajd));
      if (!nouveaux.length) continue;
      try { VigieStore.setItem(cle, JSON.stringify(actuel.concat(nouveaux))); ajoutes += nouveaux.length; } catch (e) {}
    }
    return ajoutes;
  }

  function charger() {
    if (VigieStore.mode && VigieStore.mode() === "serveur") return Promise.resolve(0);
    const lecture = fetch(FICHIER, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(jeu => jeu ? fusionner(jeu, new Date()) : 0)
      .catch(() => 0);
    return Promise.race([lecture, new Promise(ok => setTimeout(() => ok(0), DELAI))]);
  }

  window.VigieDemo = { charger, fusionner, valeur, FICHIER };
})();
