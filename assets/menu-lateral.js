/* ============================================================================
   VIGIE HSE — Menu latéral (toutes les pages à menu) : contenu et comportement
   ----------------------------------------------------------------------------
   Composant autonome : aucune dépendance autre que VigieStore (assets/stockage.js,
   chargé avant), aucune étape de build, aucun framework.

       <script src="assets/menu-lateral.js"></script>

   puis, dans le script de la page, une fois la session lue :

       VigieMenu.init(session);

   Contenu : la liste MENU ci-dessous est la seule — un nouveau module s'y ajoute
   une fois, avec sa règle de visibilité dans voir(), et apparaît sur toutes les
   pages. Le lien de la page ouverte est marqué « actif » et toujours affiché ;
   une section dont aucun lien n'est permis n'est pas affichée. Les icônes du menu
   absentes du sprite de la page y sont ajoutées (même dessin partout).
   Comportement :
   - téléphone : le bouton ☰ (#menuToggle) ouvre le menu, le voile (#scrim) le ferme ;
   - bureau (plus de 980 px) : le menu se replie quand la souris le quitte, que l'on
     survole ou fait défiler la page, et se déplie au survol ou au clavier ;
   - l'épingle (#sidebarPin) le garde ouvert, choix retenu sur ce poste
     (clé « vigie_hse_sidebar_locked », préférence : jamais envoyée au serveur).
   Jusqu'au 2026-09-30, menu et comportement étaient recopiés dans chaque page :
   trois pages avaient perdu des liens, une montrait des liens interdits à son
   compte, une avait perdu l'épingle.
   Ce que le menu cache n'est pas une protection : chaque page garde sa propre
   garde d'accès, et le serveur ses droits (serveur/droits.js, lecture.js).
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieMenu) return;

  // [page, icône, libellé (HTML fixe, jamais de donnée)]
  var MENU = [
    { liens: [["dashboard.html", "i-grid", "Accueil"]] },
    { titre: "Santé au travail", liens: [
      ["registre-at-mp.html", "i-activity", "Registre AT/MP"],
      ["registre-sst.html", "i-message-square", "Registre SST"]] },
    { titre: "Sécurité &amp; Risques", liens: [
      ["document-unique.html", "i-alert-triangle", "Document Unique"],
      ["produits-chimiques.html", "i-flask", "Produits chimiques"]] },
    { titre: "Suivi", liens: [
      ["plan-actions.html", "i-clipboard", "Plan d'Actions"],
      ["sante-visites.html", "i-shield-check", "Santé &amp; Visites"],
      ["verifications-periodiques.html", "i-check-circle", "Vérifications Périodiques"],
      ["inspection-audit.html", "i-search", "Inspection / Audit"],
      ["formation-habilitation.html", "i-award", "Formation / Habilitation"],
      ["epi-dotation.html", "i-package", "EPI &amp; Dotation"],
      ["penibilite.html", "i-gauge", "Pénibilité"]] },
    { titre: "Espace RH", liens: [
      ["saisie-rh.html", "i-plus", "Déclarer un AT/MP"],
      ["saisie-duerp.html", "i-plus", "Évaluer un risque"]] },
    { titre: "Administratif", liens: [
      ["dossiers-atmp-citis.html", "i-shield", "Dossiers AT/MP &amp; CITIS"],
      ["accident-analyse.html", "i-git-branch", "Analyse d'accident"],
      ["urgences-exercices.html", "i-life-buoy", "Situations d'urgence"],
      ["gestion-rh.html", "i-users", "Gestion RH"],
      ["entreprises-exterieures.html", "i-briefcase", "Entreprises extérieures"],
      ["accueil-poste.html", "i-user-plus", "Accueil au poste"]] },
    { titre: "Ressources", liens: [
      ["base-documentaire.html", "i-book", "Base documentaire"],
      ["dialogue-social.html", "i-messages", "Dialogue social"]] },
    { titre: "Pilotage", liens: [
      ["reporting.html", "i-bar-chart", "Indicateurs &amp; Reporting"],
      ["administration.html", "i-settings", "Administration"]] }
  ];

  // Qui voit quel lien (un lien absent d'ici est pour tous) — mêmes règles que les gardes d'accès des pages
  // (Documentation/ETAT-DU-PROJET.md §7) : RH et administrateurs voient tout le métier ; les autres, les
  // modules dont ils ont la permission (lecture ou écriture).
  function voir(session){
    var role = (session && session.role) || "ag";
    var rhAdmin = role === "rh" || role === "admin";
    var niveau = function (m) { return (session && session.modulePermissions && session.modulePermissions[m]) || "none"; };
    var module = function (m) { return rhAdmin || niveau(m) !== "none"; };
    return {
      "sante-visites.html": rhAdmin || role === "manager" || niveau("sante-visites") !== "none",   // encadrement (question 17)
      "penibilite.html": module("penibilite"),
      "saisie-rh.html": rhAdmin || niveau("atmp-declare") === "write",
      "saisie-duerp.html": rhAdmin,
      "dossiers-atmp-citis.html": module("atmp-admin"),
      "accident-analyse.html": module("accident-analyse"),
      "urgences-exercices.html": module("urgences"),
      "gestion-rh.html": module("gestion-rh"),
      "entreprises-exterieures.html": module("entreprises-ext"),
      "accueil-poste.html": module("accueil-poste"),
      "dialogue-social.html": module("dialogue-social"),
      "reporting.html": rhAdmin,
      "administration.html": role === "admin"
    };
  }

  // Icônes du menu (sprite des pages, dessin identique partout) : ajoutées si la page ne les a pas.
  var ICONES = {
    "i-grid": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    "i-activity": '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    "i-message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    "i-alert-triangle": '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    "i-flask": '<path d="M9 2v6L3 20a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3L15 8V2"/><line x1="9" y1="2" x2="15" y2="2"/><line x1="8" y1="16" x2="16" y2="16"/>',
    "i-clipboard": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3"/>',
    "i-shield-check": '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><polyline points="9 12 11 14 15 10"/>',
    "i-check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    "i-search": '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    "i-award": '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    "i-package": '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    "i-gauge": '<path d="M12 14l4-5"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.2"/>',
    "i-plus": '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    "i-shield": '<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>',
    "i-git-branch": '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    "i-life-buoy": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>',
    "i-users": '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    "i-briefcase": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    "i-user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    "i-book": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    "i-messages": '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
    "i-bar-chart": '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    "i-settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };

  function pageCourante(){
    try { return decodeURIComponent(location.pathname.split("/").pop() || ""); } catch (e) { return ""; }
  }

  function rendreMenu(nav, session){
    var permis = voir(session), ici = pageCourante();
    nav.innerHTML = MENU.map(function (section) {
      var liens = section.liens.filter(function (l) { return l[0] === ici || permis[l[0]] !== false; });
      if (!liens.length) return "";
      return '<div class="nav-section">' + (section.titre ? '<div class="nav-label">' + section.titre + "</div>" : "") +
        liens.map(function (l) {
          return '<a class="nav-item' + (l[0] === ici ? " active" : "") + '" href="' + l[0] + '"><svg class="icon"><use href="#' + l[1] + '"/></svg> ' + l[2] + "</a>";
        }).join("") + "</div>";
    }).join("");
    var manquantes = Object.keys(ICONES).filter(function (id) { return !document.getElementById(id); });
    if (manquantes.length) document.body.insertAdjacentHTML("afterbegin", '<svg style="display:none" aria-hidden="true">' +
      manquantes.map(function (id) { return '<symbol id="' + id + '" viewBox="0 0 24 24">' + ICONES[id] + "</symbol>"; }).join("") + "</svg>");
  }

  function init(session){
    var sidebar = document.getElementById("sidebar"), scrim = document.getElementById("scrim");
    var appShell = document.querySelector(".app-shell");
    var pinBtn = document.getElementById("sidebarPin");
    var mainEl = document.querySelector(".main");
    var collapseTimer = null;
    var sidebarLocked = VigieStore.getItem("vigie_hse_sidebar_locked") === "true";

    rendreMenu(sidebar.querySelector("nav"), session);

    document.getElementById("menuToggle").addEventListener("click", function () { sidebar.classList.add("open"); scrim.classList.add("show"); });
    scrim.addEventListener("click", function () { sidebar.classList.remove("open"); scrim.classList.remove("show"); });

    function applyPinVisual(){ if (pinBtn) pinBtn.classList.toggle("active", sidebarLocked); }
    function isDesktopWidth(){ return window.innerWidth > 980; }
    function sidebarExpand(){
      clearTimeout(collapseTimer);
      if (appShell) appShell.classList.remove("sidebar-collapsed");
    }
    function sidebarCollapse(delay){
      clearTimeout(collapseTimer);
      if (!isDesktopWidth() || sidebarLocked) return;
      collapseTimer = setTimeout(function () { if (appShell) appShell.classList.add("sidebar-collapsed"); }, delay || 0);
    }

    sidebar.addEventListener("mouseenter", sidebarExpand);
    sidebar.addEventListener("mouseleave", function () { sidebarCollapse(150); });
    sidebar.addEventListener("focusin", sidebarExpand);
    sidebar.addEventListener("focusout", function (e) { if (!sidebar.contains(e.relatedTarget)) sidebarCollapse(150); });
    if (mainEl){
      mainEl.addEventListener("mouseenter", function () { sidebarCollapse(200); });
      mainEl.addEventListener("scroll", function () { sidebarCollapse(0); }, { passive: true });
    }
    window.addEventListener("scroll", function () { sidebarCollapse(0); }, { passive: true });

    if (sidebarLocked) sidebarExpand();
    applyPinVisual();
    if (pinBtn) pinBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      sidebarLocked = !sidebarLocked;
      VigieStore.setItem("vigie_hse_sidebar_locked", sidebarLocked ? "true" : "false");
      applyPinVisual();
      if (sidebarLocked) sidebarExpand(); else sidebarCollapse(150);
    });
  }

  window.VigieMenu = { init: init, MENU: MENU, voir: voir };
})();
