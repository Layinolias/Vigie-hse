// « Fiches utiles » : sous le titre d'une page de suivi, les articles de la Base documentaire que le
// préventeur a choisi d'y proposer (case « Proposer sur les pages » de l'article, champ `pages`).
// Le logiciel ne décide pas quelle fiche va avec quel module : c'est une question de métier (règle 9),
// tranchée par le rédacteur dans base-documentaire.html. Sans article proposé, rien n'est affiché.
// Seuls les articles « Publié » apparaissent (un brouillon reste dans la Base documentaire).
// À charger après assets/stockage.js ; la page elle-même n'a rien à appeler.
(function(){
  // Pages qui peuvent recevoir des fiches — SOURCE UNIQUE : le formulaire d'article de
  // base-documentaire.html construit ses cases à partir d'ici. Identifiant = nom du fichier sans « .html ».
  var PAGES = [
    ["registre-at-mp", "Registre AT/MP"],
    ["document-unique", "Document Unique"],
    ["plan-actions", "Plan d'actions"],
    ["sante-visites", "Santé & Visites"],
    ["registre-sst", "Registre Santé & Sécurité"],
    ["verifications-periodiques", "Vérifications périodiques"],
    ["inspection-audit", "Inspection / Audit"],
    ["produits-chimiques", "Produits chimiques"],
    ["formation-habilitation", "Formation / Habilitation"],
    ["epi-dotation", "EPI & Dotation"],
    ["dossiers-atmp-citis", "Dossiers AT/MP & CITIS"],
    ["accident-analyse", "Analyse d'accident"],
    ["urgences-exercices", "Situations d'urgence"],
    ["entreprises-exterieures", "Entreprises extérieures"],
    ["accueil-poste", "Accueil au poste"],
    ["penibilite", "Pénibilité"],
    ["dialogue-social", "Dialogue social"],
    ["gestion-rh", "Gestion RH"],
    ["reporting", "Reporting"]
  ];
  var CONNUES = {}; PAGES.forEach(function(p){ CONNUES[p[0]] = p[1]; });

  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]; }); }
  function articles(){
    try { var raw = window.VigieStore && VigieStore.getItem("vigie_hse_wiki"); var l = raw ? JSON.parse(raw) : []; return Array.isArray(l) ? l.filter(function(a){ return a && a.id; }) : []; } catch(e){ return []; }
  }
  // Articles publiés proposés sur cette page, par ordre alphabétique de titre
  function pour(page){
    return articles().filter(function(a){ return a.statut !== "Brouillon" && Array.isArray(a.pages) && a.pages.indexOf(page) >= 0; })
      .sort(function(a, b){ return String(a.titre).localeCompare(String(b.titre), "fr"); });
  }
  function pageCourante(){
    var m = /([a-z0-9-]+)\.html$/i.exec(location.pathname || "");
    return m ? m[1].toLowerCase() : "";
  }
  function afficher(){
    var page = pageCourante();
    if (!CONNUES[page]) return;
    var hote = document.querySelector(".page-summary-text");
    if (!hote || document.getElementById("fichesUtiles")) return;
    var liste = pour(page);
    if (!liste.length) return;
    if (!document.getElementById("fichesUtilesStyle")){
      var st = document.createElement("style"); st.id = "fichesUtilesStyle";
      st.textContent = ".fiches-utiles{ display:flex; flex-wrap:wrap; align-items:center; gap:4px 6px; margin-top:4px; font-size:11px; color:var(--text-muted); }" +
        ".fiches-utiles a{ font-size:10.5px; font-weight:600; color:var(--accent); text-decoration:none; border:1px solid rgba(var(--accent-rgb),.45); border-radius:var(--r-pill); padding:1px 8px; white-space:nowrap; max-width:28ch; overflow:hidden; text-overflow:ellipsis; }" +
        ".fiches-utiles a:hover{ background:rgba(var(--accent-rgb),.10); }" +
        "@media print{ .fiches-utiles{ display:none !important; } }";
      document.head.appendChild(st);
    }
    var div = document.createElement("div"); div.className = "fiches-utiles"; div.id = "fichesUtiles";
    div.innerHTML = "<span>Fiches utiles :</span>" + liste.map(function(a){
      return '<a href="base-documentaire.html?fiche=' + encodeURIComponent(a.id) + '" title="' + esc("Ouvrir « " + a.titre + " » dans la Base documentaire") + '">' + esc(a.titre) + "</a>";
    }).join("");
    hote.appendChild(div);
  }

  window.VigieFichesUtiles = { PAGES: PAGES, pour: pour, afficher: afficher };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", afficher); else afficher();
})();
