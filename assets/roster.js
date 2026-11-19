/* ============================================================================
   VIGIE HSE — Agents du roster canonique (module Gestion RH) dans les formulaires
   ----------------------------------------------------------------------------
   Composant autonome : aucune dépendance, aucune étape de build, aucun framework.
       <script src="assets/roster.js"></script>
   - bindAgentSearch(champ, services, onPick, options) : recherche de l'agent en
     tapant son nom, dans les formulaires d'un agent (Registre AT/MP, Santé &
     Visites, Formation, EPI, Accueil au poste, Rôles de prévention) — la saisie
     libre reste possible ;
   - bindAgentPicker(select, services, onPick) : ancienne liste « Choisir un agent »
     (plus utilisée par les pages depuis le 2026-11-19, gardée pour compatibilité) ;
   - LISTES : civilités, catégories, filières, cadres d'emploi, grades ;
   - ageA(naissance, date) : âge en années pleines ;
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
  /** Données privées d'un agent qu'un compte anonymisé ne reçoit pas (serveur/anonymisation.js, MASQUES). */
  var PRIVES = ["dateNaissance", "civilite"];
  function anonymise(){ try { var s = JSON.parse(sessionStorage.getItem("vigie_hse_session") || "null"); return !!(s && s.anonymise); } catch (e) { return false; } }
  function loadActiveAgents(myServices){
    var list = [];
    try { var raw = VigieStore.getItem("vigie_hse_agents"); if (raw){ var p = JSON.parse(raw); if (Array.isArray(p)) list = p; } } catch (e) {}
    var services = myServices || ["*"];
    if (anonymise()) list = list.map(function (a) { var o = Object.assign({}, a); PRIVES.forEach(function (c) { delete o[c]; }); return o; });
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


  /** Listes d'identité d'un agent (vocabulaire fusionné Ville DB.xlsx + Agglomération Bilan AT GACG 2025),
   * partagées par la fiche agent (Gestion RH) et la déclaration AT/MP (saisie-rh.html). */
  var LISTES = {
    civilites: ["Madame","Monsieur"],
    categories: ["Catégorie A","Catégorie B","Catégorie C","Sans categorie"],
    filieres: ["Filière administrative","Filière animation","Filière culturelle","Filière médico-sociale","Filière Sécurité (Police Municipale)","Filière Sociale","Filière sportive","Filière technique","Sans filière"],
    cadresEmploi: ["Adjoints administratifs territoriaux","Adjoints du patrimoine territoriaux","Adjoints techniques territoriaux","Adjoints territoriaux d'animation","Agents de maîtrise Territoriaux","Agents de police municipale","Agents ter.spécialis. écoles maternelles","Attachés Territoriaux","Auxiliaires de puériculture territoriaux","Cadre d'emploi animateurs temporaires","Educateurs terr. de jeunes enfants","Educateurs territoriaux des APS","Emplois fonctionnels administratifs","Grade non statutaire - sans cadre emploi","Puéricultrices territoriales","Rédacteurs Territoriaux","Techniciens territoriaux"],
    grades: ["Adjt adm","Adjt adm Pal 1Cl","Adjt adm Pal 2Cl","Adjt ter anim Pal 1Cl","Adjt ter anim Pal 2Cl","Adjt ter animation","Adjt ter patr Pal 1Cl","Adjt tech","Adjt tech Pal 1Cl","Adjt tech Pal 2Cl","Agent maitrise","Agent maitrise Pal","Animateur","Assistante maternelle","ATSEM Pal 1Cl","Attaché","Attaché Pal","Auxiliaire puér Cl N","Auxiliaire puér Cl Sup","Brigadier-chef Pal","Dir.adj.ets pub.","Educateur APS Pal 2Cl","Educateur Jeunes Enfants","Gardien-brigadier","Puér","Rédacteur Pal 1Cl","Technicien"]
  };

  // ---------- Recherche d'un agent en tapant son nom (2026-11-19) ----------
  // « Chaque fois qu'on demande le nom d'un agent, on va le chercher dans la base agents » : quelques lettres
  // dans le champ Nom (ou Personne) proposent les agents actifs du périmètre du compte ; un choix appelle
  // onPick(agent), qui remplit le reste de la fiche. La saisie libre reste possible (agent pas encore répertorié).
  function sansAccent(s){ return String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function correspond(a, q){
    var texte = sansAccent([a.nom, a.prenom, a.service, a.matricule].filter(Boolean).join(" "));
    return sansAccent(q).split(/\s+/).filter(Boolean).every(function (m) { return texte.indexOf(m) >= 0; });
  }
  var styleAjoute = false;
  function ajouterStyle(){
    if (styleAjoute) return; styleAjoute = true;
    var st = document.createElement("style");
    st.textContent = ".vr-recherche{position:relative}" +
      ".vr-liste{position:absolute;left:0;right:0;top:100%;z-index:60;margin:4px 0 0;padding:4px;list-style:none;max-height:260px;overflow:auto;" +
      "background:var(--surface-el);border:1px solid var(--border);border-radius:var(--r-sm);box-shadow:var(--shadow-md)}" +
      ".vr-liste li{padding:7px 10px;border-radius:8px;cursor:pointer;color:var(--text);font-size:13.5px;line-height:1.3}" +
      ".vr-liste li small{display:block;color:var(--text-muted);font-size:12px}" +
      ".vr-liste li[aria-selected=true],.vr-liste li:hover{background:rgba(var(--accent-rgb),.12)}" +
      ".vr-liste li.vr-vide{cursor:default;color:var(--text-muted)}.vr-liste li.vr-vide:hover{background:none}";
    document.head.appendChild(st);
  }
  var compteur = 0;
  /** Branche la recherche sur un champ texte. options.format(agent) : texte écrit dans le champ au choix
   * (par défaut le nom seul). Renvoie { fermer } ; sans effet si le champ manque. */
  function bindAgentSearch(input, myServices, onPick, options){
    if (!input || input.dataset.vrRecherche) return null;
    options = options || {};
    input.dataset.vrRecherche = "1";
    ajouterStyle();
    var parent = input.parentNode, boite = document.createElement("div");
    boite.className = "vr-recherche";
    parent.insertBefore(boite, input); boite.appendChild(input);
    var liste = document.createElement("ul"), id = "vr-liste-" + (++compteur);
    liste.className = "vr-liste"; liste.id = id; liste.setAttribute("role", "listbox"); liste.hidden = true;
    boite.appendChild(liste);
    input.setAttribute("role", "combobox"); input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", id); input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    var mot = function (t) { return window.VigieOrga && VigieOrga.mots ? VigieOrga.mots(t) : t; };
    if (!input.title) input.title = mot("Tapez quelques lettres : les agents de Gestion RH s'affichent");
    var trouves = [], actif = -1;
    function fermer(){ liste.hidden = true; liste.innerHTML = ""; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); actif = -1; }
    function marquer(i){
      actif = i;
      Array.prototype.forEach.call(liste.children, function (li, j) { li.setAttribute("aria-selected", j === i ? "true" : "false"); });
      if (i >= 0 && liste.children[i]){ input.setAttribute("aria-activedescendant", liste.children[i].id); if (liste.children[i].scrollIntoView) liste.children[i].scrollIntoView({ block: "nearest" }); }
    }
    function choisir(i){
      var a = trouves[i]; if (!a) return;
      input.value = options.format ? options.format(a) : (a.nom || "");
      fermer();
      onPick(a);
    }
    function ouvrir(){
      var q = input.value.trim();
      if (!q){ fermer(); return; }
      trouves = loadActiveAgents(myServices).filter(function (a) { return correspond(a, q); }).slice(0, 8);
      var tous = loadActiveAgents(myServices);
      if (!tous.length){ fermer(); return; }   // base vide : saisie libre, rien à proposer
      liste.innerHTML = trouves.length ? trouves.map(function (a, i) {
        return '<li role="option" id="' + id + '-' + i + '" data-i="' + i + '" aria-selected="false">' + esc((a.nom || "") + " " + (a.prenom || "")) +
          '<small>' + esc([a.service, a.poste || a.statut].filter(Boolean).join(" · ")) + '</small></li>';
      }).join("") : '<li class="vr-vide" role="option" aria-disabled="true">' + esc(mot("Aucun agent de Gestion RH ne correspond — saisie libre")) + '</li>';
      liste.hidden = false; input.setAttribute("aria-expanded", "true");
      marquer(trouves.length ? 0 : -1);
    }
    input.addEventListener("input", ouvrir);
    input.addEventListener("keydown", function (e) {
      if (liste.hidden) { if (e.key === "ArrowDown" && input.value.trim()) { ouvrir(); e.preventDefault(); } return; }
      if (e.key === "ArrowDown"){ marquer(Math.min(actif + 1, trouves.length - 1)); e.preventDefault(); }
      else if (e.key === "ArrowUp"){ marquer(Math.max(actif - 1, 0)); e.preventDefault(); }
      else if (e.key === "Enter"){ if (actif >= 0){ choisir(actif); e.preventDefault(); } }
      else if (e.key === "Escape" || e.key === "Tab"){ fermer(); }
    });
    // mousedown (et non click) : le choix passe avant que le champ perde le focus et ferme la liste
    liste.addEventListener("mousedown", function (e) {
      var li = e.target.closest ? e.target.closest("li[data-i]") : null;
      e.preventDefault();
      if (li) choisir(Number(li.getAttribute("data-i")));
    });
    input.addEventListener("blur", function () { setTimeout(fermer, 0); });
    return { fermer: fermer };
  }

  /** Âge en années pleines à une date (AAAA-MM-JJ), à partir d'une date de naissance AAAA-MM-JJ ; null si l'une manque. */
  function ageA(naissance, date){
    var n = /^(\d{4})-(\d{2})-(\d{2})/.exec(naissance || ""), d = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
    if (!n || !d) return null;
    var age = Number(d[1]) - Number(n[1]);
    if (d[2] + d[3] < n[2] + n[3]) age--;
    return age >= 0 ? age : null;
  }

  window.VigieRoster = { hashStr: hashStr, esc: esc, loadActiveAgents: loadActiveAgents, bindAgentPicker: bindAgentPicker,
    bindAgentSearch: bindAgentSearch, ageA: ageA, LISTES: LISTES, PRIVES: PRIVES };
})();
