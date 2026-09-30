/* ============================================================================
   VIGIE HSE — Agents du roster canonique (module Gestion RH) dans les formulaires
   ----------------------------------------------------------------------------
   Composant autonome : aucune dépendance, aucune étape de build, aucun framework.
       <script src="assets/roster.js"></script>
   - bindAgentPicker(select, services, onPick) : liste « Choisir un agent » des
     formulaires (Registre AT/MP, Santé & Visites, Formation, EPI) — additive,
     la saisie libre reste possible ;
   - loadActiveAgents(services) : agents actifs de vigie_hse_agents, triés ;
   - esc(s) : échappement HTML ;
   - hashStr(s) : hash stable d'une clé texte (voir ci-dessous).

   `hashStr(s)` est le même hash simple (base 31) utilisé partout dans ce
   projet pour dériver des identifiants stables à partir d'une clé texte —
   ne pas en écrire une seconde copie dans une page qui charge ce fichier.
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieRoster) return;

  function hashStr(s){
    var h = 0;
    for (var i = 0; i < s.length; i++){ h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }

  /** Échappe une valeur avant de l'injecter dans du HTML (noms, services : saisie libre). */
  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Agents actifs du roster canonique (vigie_hse_agents, module Gestion RH), triés par nom.
   * `myServices` = session.services : un manager scopé ne voit que les agents de ses services. */
  function loadActiveAgents(myServices){
    var list = [];
    try { var raw = VigieStore.getItem("vigie_hse_agents"); if (raw){ var p = JSON.parse(raw); if (Array.isArray(p)) list = p; } } catch (e) {}
    var services = myServices || ["*"];
    return list
      .filter(function (a) { return a.actif !== false && (services.indexOf("*") >= 0 || services.indexOf(a.service) >= 0); })
      .sort(function (a, b) { return (a.nom || "").localeCompare(b.nom || "", "fr"); });
  }

  /** Remplit un <select> « Choisir un agent » et appelle `onPick(agent)` au choix. Additif :
   * sans agent dans le roster le select reste tel quel (saisie libre uniquement). */
  function bindAgentPicker(picker, myServices, onPick){
    if (!picker) return;
    var agents = loadActiveAgents(myServices);
    if (!agents.length) return;
    picker.innerHTML = '<option value="">— Saisie libre —</option>' + agents.map(function (a) {
      return '<option value="' + esc(a.id) + '">' + esc(a.nom + " " + a.prenom + " — " + a.service) + '</option>';
    }).join("");
    picker.addEventListener("change", function () {
      var a = agents.find(function (x) { return x.id === picker.value; });
      if (a) onPick(a);
    });
  }

  window.VigieRoster = { hashStr: hashStr, esc: esc, loadActiveAgents: loadActiveAgents, bindAgentPicker: bindAgentPicker };
})();
