// Impression / export PDF d'un registre, tel qu'il est affiché à l'écran.
// Ajoute un bouton « Imprimer / PDF » à côté du bouton d'export Excel d'un panneau :
//     VigieImpression.brancher("btnExport");                       // tableau du même panneau
//     VigieImpression.brancher("rdvExport", { table: "#rdvTable" }); // tableau désigné
// Ce qui est imprimé est une COPIE du tableau affiché : mêmes lignes (filtres, périmètre du
// compte, colonnes masquées « — » comprises), sans boutons ni champs, précédée d'un en-tête
// (titre, date d'édition, compte, nombre de lignes, filtres actifs). La page elle-même n'est pas
// modifiée. Le style d'impression n'est injecté que le temps de l'impression, pour ne pas gêner
// les impressions propres à une page (convocation, fiche d'accueil).
// Le bouton suit la visibilité du bouton d'export : pas de bouton d'export, pas d'impression.
(function(){
  if (window.VigieImpression) return;

  var CSS = [
    "@page{ size:A4 landscape; margin:10mm; }",
    "@media screen{ #vigie-impression{ display:none; } }",
    "@media print{",
    "  body{ background:#fff !important; }",
    "  body > *:not(#vigie-impression){ display:none !important; }",
    "  #vigie-impression{ display:block !important; color:#000; font:10px/1.4 'IBM Plex Sans',Arial,sans-serif; }",
    "  #vigie-impression .vi-marque{ font:700 10px 'Barlow Condensed',Arial,sans-serif; letter-spacing:.08em; text-transform:uppercase; color:#555; }",
    "  #vigie-impression h1{ font:600 17px 'Barlow Condensed',Arial,sans-serif; margin:2px 0 3px; color:#000; }",
    "  #vigie-impression .vi-meta{ font-size:9.5px; color:#444; margin:0 0 2px; }",
    // la copie garde les classes du tableau d'origine : on neutralise ses largeurs et son « nowrap »
    "  #vigie-impression table{ width:100% !important; min-width:0 !important; max-width:100% !important; table-layout:auto; border-collapse:collapse; margin-top:8px; }",
    "  #vigie-impression th, #vigie-impression td{ border:1px solid #bbb; padding:3px 5px; font-size:8.5px; text-align:left; vertical-align:top; color:#000 !important; background:#fff !important;",
    "    white-space:normal !important; min-width:0 !important; max-width:none !important; width:auto !important; overflow-wrap:break-word; }",
    "  #vigie-impression td *, #vigie-impression th *{ white-space:normal !important; max-width:none !important; }",
    "  #vigie-impression thead th{ background:#eee !important; font-weight:600; }",
    "  #vigie-impression thead{ display:table-header-group; }",
    "  #vigie-impression tr{ break-inside:avoid; page-break-inside:avoid; }",
    "  #vigie-impression *{ box-shadow:none !important; position:static !important; }",
    "}",
  ].join("\n");

  function texte(el){ return String(el && el.textContent || "").replace(/\s+/g, " ").trim(); }
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function compte(){
    try { var s = JSON.parse(sessionStorage.getItem("vigie_hse_session") || "null"); return s && s.user ? String(s.user) : ""; }
    catch(e){ return ""; }
  }

  // filtres de la barre de filtres de la page (première option = « Tous »), puis filtres de colonne
  function filtresActifs(table){
    var out = [];
    var champs = document.querySelectorAll(".console .field");
    for (var i = 0; i < champs.length; i++){
      var f = champs[i], lab = texte(f.querySelector(".flabel, label"));
      var sel = f.querySelector("select"), inp = f.querySelector("input:not([type=checkbox]):not([type=radio]):not([type=hidden])");
      if (sel && sel.selectedIndex > 0 && sel.options[sel.selectedIndex]) out.push((lab ? lab + " : " : "") + texte(sel.options[sel.selectedIndex]));
      else if (inp && String(inp.value).trim()) out.push((lab ? lab + " : " : "") + String(inp.value).trim());
    }
    var actifs = table.querySelectorAll("thead th .vt-btn.on");
    for (var j = 0; j < actifs.length; j++){
      var th = actifs[j].closest("th");
      var nom = texte(th && (th.querySelector(".vt-label") || th));
      if (nom) out.push("colonne « " + nom + " » filtrée");
    }
    return out;
  }

  // copie du tableau sans ce qui ne s'imprime pas, puis retrait des colonnes restées vides
  function copieTableau(table){
    var t = table.cloneNode(true);
    t.removeAttribute("id");
    var aRetirer = t.querySelectorAll("button, input, select, textarea, svg, .no-print, .vt-pop");
    for (var i = 0; i < aRetirer.length; i++) aRetirer[i].remove();
    var idd = t.querySelectorAll("[id]");
    for (var k = 0; k < idd.length; k++) idd[k].removeAttribute("id");
    // la ligne « aucun enregistrement » (tr.empty-row) couvre toutes les colonnes : on l'écarte du
    // calcul, puis on ajuste sa largeur au nombre de colonnes restantes
    var tetes = t.querySelectorAll("thead tr");
    var fusion = t.querySelector("tr:not(.empty-row) > [colspan], tr:not(.empty-row) > [rowspan]");
    if (tetes.length === 1 && !fusion){
      var nb = tetes[0].children.length, lignes = t.querySelectorAll("tr:not(.empty-row)");
      for (var c = nb - 1; c >= 0; c--){
        var vide = true;
        for (var r = 0; r < lignes.length && vide; r++){
          var cell = lignes[r].children[c];
          if (cell && texte(cell)) vide = false;
        }
        if (vide) for (var r2 = 0; r2 < lignes.length; r2++){ var x = lignes[r2].children[c]; if (x) x.remove(); }
      }
      var restantes = tetes[0].children.length, vides = t.querySelectorAll("tr.empty-row > [colspan]");
      for (var v = 0; v < vides.length; v++) vides[v].setAttribute("colspan", restantes);
    }
    return t;
  }

  function imprimer(opts){
    var table = opts.table;
    if (!table) return;
    var ancien = document.getElementById("vigie-impression");
    if (ancien) ancien.remove();
    var style = document.getElementById("vigie-impression-style");
    if (!style){ style = el("style"); style.id = "vigie-impression-style"; style.textContent = CSS; document.head.appendChild(style); }

    var bloc = el("div"); bloc.id = "vigie-impression";
    bloc.appendChild(el("div", "vi-marque", "VIGIE HSE"));
    bloc.appendChild(el("h1", null, opts.titre || document.title));
    var n = table.querySelectorAll("tbody tr:not(.empty-row)").length;
    var maintenant = new Date();
    var qui = compte();
    bloc.appendChild(el("p", "vi-meta",
      "Édité le " + maintenant.toLocaleDateString("fr-FR") + " à " + maintenant.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" }) +
      (qui ? " par " + qui : "") + " · " + n + " ligne" + (n > 1 ? "s" : "")));
    var filtres = filtresActifs(table);
    bloc.appendChild(el("p", "vi-meta", filtres.length ? "Filtres : " + filtres.join(" · ") : "Aucun filtre : toutes les lignes visibles par ce compte."));
    bloc.appendChild(copieTableau(table));
    document.body.appendChild(bloc);

    var nettoyer = function(){
      window.removeEventListener("afterprint", nettoyer);
      if (bloc.parentNode) bloc.remove();
      if (style.parentNode) style.remove();
    };
    window.addEventListener("afterprint", nettoyer);
    window.print();
  }

  function trouverTable(depuis, cible){
    if (cible){
      var c = typeof cible === "string" ? document.querySelector(cible) : cible;
      return c && c.tagName !== "TABLE" ? c.closest("table") : c;
    }
    var e = depuis;
    while (e && !(e.querySelector && e.querySelector("table"))) e = e.parentElement;
    return e ? e.querySelector("table") : null;
  }

  function brancher(idExport, opts){
    opts = opts || {};
    var exp = document.getElementById(idExport);
    if (!exp || document.getElementById(idExport + "Pdf")) return null;
    var b = el("button", exp.className);
    b.type = "button";
    b.id = idExport + "Pdf";
    b.title = "Utilise l'impression du navigateur — choisissez « Enregistrer au format PDF » comme imprimante.";
    b.innerHTML = '<svg class="icon"><use href="#i-download"/></svg> Imprimer / PDF';
    exp.insertAdjacentElement("afterend", b);
    var suivre = function(){ b.style.display = exp.style.display; b.hidden = exp.hidden; };
    suivre();
    if (window.MutationObserver) new MutationObserver(suivre).observe(exp, { attributes:true, attributeFilter:["style", "hidden"] });
    b.addEventListener("click", function(){
      var table = trouverTable(exp, opts.table);
      var panneau = table && table.closest(".panel, section, .tab-panel");
      var titre = opts.titre || texte(panneau && panneau.querySelector(".panel-title")) || document.title;
      var h1 = texte(document.querySelector(".page-summary h1, header h1"));
      imprimer({ table: table, titre: h1 && titre && h1 !== titre ? h1 + " — " + titre : (titre || h1) });
    });
    return b;
  }

  window.VigieImpression = { brancher: brancher, imprimer: imprimer };
})();
