/* ============================================================================
   VIGIE HSE — Options d'un tableau : colonnes et graphiques (2026-11-19)
   ----------------------------------------------------------------------------
   Demandé par le préventeur : un bouton en haut à droite du tableau ouvre une
   fenêtre où l'on
     - range les colonnes (liste verticale, glisser-déposer ou flèches) et choisit
       celles qu'on affiche (case cochée = colonne affichée) ;
     - compose des graphiques à partir du tableau (regrouper par une colonne,
       compter ou additionner, barres ou courbe), affichés sous le tableau et
       qui suivent ses filtres.
   Les réglages sont gardés pour chaque compte, sur cet appareil (clé
   `vigie_hse_options_tableaux`, nature « preference » de VigieStore).

   Composant partagé, branché d'abord sur le Registre AT/MP :

       <script src="assets/options-tableau.js"></script>

       const options = VigieOptionsTableau.create({
         id: "registre-at-mp",                    // un nom par tableau
         compte: session,                         // la session (email ou user)
         colonnes: [{ key, label }],              // celles que le compte a le droit de voir, ordre d'origine
         groupes: [{ key, label, date?:true, valeur?(row) }],   // colonnes qui peuvent regrouper un graphique
         mesures: [{ key, label, valeur(row) → nombre }],        // ce qu'on compte ou additionne
         bouton: $("btnOptions"),                 // ouvre la fenêtre
         zone: $("zoneGraphiques"),               // où dessiner les graphiques (masquée s'il n'y en a pas)
         onColonnes: (keys) => { ... },           // ordre des colonnes affichées a changé
       });
       options.colonnes();        // clés affichées, dans l'ordre choisi
       options.ordreOrigine();    // vrai si l'ordre relatif est celui d'origine
       options.graphiques(rows);  // dessine les graphiques sur les lignes filtrées

   Une page n'offre au graphique que ce que le compte voit déjà dans le tableau :
   les droits restent ceux des colonnes. Le composant injecte sa feuille de style,
   bâtie sur les jetons de couleur (assets/jetons.css) : clair et sombre suivent.
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieOptionsTableau) return;

  var CLE = "vigie_hse_options_tableaux";
  var MAX_GRAPHIQUES = 8;
  var MAX_BARRES = 12;
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  var CSS = [
    '.vot-fond{ position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.38); display:flex; align-items:flex-start; justify-content:center; padding:48px 16px; overflow:auto; }',
    '.vot-boite{ width:100%; max-width:480px; background:var(--surface-el); color:var(--text); border:1px solid var(--border); border-radius:var(--r-lg,14px); box-shadow:0 18px 50px rgba(0,0,0,.28); font:500 13px "IBM Plex Sans",system-ui,sans-serif; }',
    '.vot-tete{ display:flex; align-items:center; gap:10px; padding:16px 18px 0; }',
    '.vot-tete h2{ flex:1; margin:0; font:600 17px "IBM Plex Sans",system-ui,sans-serif; }',
    '.vot-x{ background:none; border:none; cursor:pointer; color:var(--text-faint); font-size:20px; line-height:1; padding:4px 8px; border-radius:6px; }',
    '.vot-x:hover{ background:var(--bg-2); color:var(--text); }',
    '.vot-onglets{ display:flex; gap:4px; padding:12px 18px 0; border-bottom:1px solid var(--border); }',
    '.vot-onglet{ background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-muted); font:600 13px inherit; padding:8px 10px; margin-bottom:-1px; }',
    '.vot-onglet[aria-selected="true"]{ color:var(--accent); border-bottom-color:var(--accent); }',
    '.vot-corps{ padding:14px 18px 18px; }',
    '.vot-aide{ color:var(--text-muted); font-size:12.5px; margin:0 0 10px; }',
    '.vot-liste{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:3px; max-height:52vh; overflow:auto; }',
    '.vot-col{ display:flex; align-items:center; gap:8px; padding:6px 8px; border:1px solid var(--border); border-radius:8px; background:var(--surface); }',
    '.vot-col.vot-masquee .vot-nom{ color:var(--text-faint); }',
    '.vot-col.vot-survol{ border-color:var(--accent); box-shadow:0 0 0 2px rgba(var(--accent-rgb),.18); }',
    '.vot-col.vot-tire{ opacity:.45; }',
    '.vot-poignee{ cursor:grab; color:var(--text-faint); font-size:14px; letter-spacing:-2px; user-select:none; padding:0 2px; }',
    '.vot-col input{ width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; margin:0; }',
    '.vot-nom{ flex:1; cursor:pointer; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }',
    '.vot-fl{ background:none; border:1px solid transparent; cursor:pointer; color:var(--text-muted); width:26px; height:26px; border-radius:6px; font-size:12px; line-height:1; }',
    '.vot-fl:hover:not(:disabled){ border-color:var(--border); background:var(--bg-2); color:var(--text); }',
    '.vot-fl:disabled{ opacity:.3; cursor:default; }',
    '.vot-pied{ display:flex; gap:14px; flex-wrap:wrap; margin-top:12px; padding-top:10px; border-top:1px solid var(--border); }',
    '.vot-lien{ background:none; border:none; cursor:pointer; color:var(--accent); font:600 12.5px inherit; padding:0; }',
    '.vot-lien:hover{ text-decoration:underline; }',
    '.vot-msg{ color:var(--danger); font-size:12px; min-height:16px; margin-top:6px; }',
    '.vot-champ{ display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }',
    '.vot-champ label{ font-size:12px; color:var(--text-muted); font-weight:600; }',
    '.vot-champ select{ background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:8px; padding:8px 9px; font:500 13px inherit; }',
    '.vot-faits{ list-style:none; margin:0 0 14px; padding:0; display:flex; flex-direction:column; gap:3px; }',
    '.vot-fait{ display:flex; align-items:center; gap:8px; padding:7px 9px; border:1px solid var(--border); border-radius:8px; background:var(--surface); }',
    '.vot-fait span{ flex:1; }',
    '.vot-vide{ color:var(--text-faint); font-size:12.5px; margin:0 0 14px; }',
    '.vot-titre-form{ font-weight:600; margin:0 0 8px; }',
    '.vot-btn{ display:inline-flex; align-items:center; gap:6px; font:600 12.5px inherit; padding:8px 14px; border-radius:var(--r-sm,8px); cursor:pointer; border:1px solid var(--accent); background:var(--accent); color:#fff; }',
    '.vot-btn:disabled{ opacity:.5; cursor:default; }',
    /* graphiques sous le tableau */
    '.vot-zone-tete{ display:flex; align-items:baseline; gap:10px; margin-bottom:12px; flex-wrap:wrap; }',
    '.vot-zone-tete .panel-title{ flex:1; }',
    '.vot-zone-tete small{ color:var(--text-faint); font-size:12px; }',
    '.vot-grille{ display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr)); gap:14px; }',
    '.vot-carte{ border:1px solid var(--border); border-radius:var(--r-md,10px); background:var(--surface); padding:14px 14px 10px; min-width:0; }',
    '.vot-carte-tete{ display:flex; align-items:flex-start; gap:8px; margin-bottom:10px; }',
    '.vot-carte-tete h3{ flex:1; margin:0; font:600 14px "IBM Plex Sans",system-ui,sans-serif; color:var(--text); }',
    '.vot-carte-tete .vot-x{ font-size:16px; padding:2px 6px; }',
    '.vot-hb{ display:grid; grid-template-columns:minmax(80px,38%) 1fr; gap:5px 10px; align-items:center; font-size:12.5px; }',
    '.vot-hb-lib{ color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; }',
    '.vot-hb-piste{ display:flex; align-items:center; gap:6px; min-width:0; }',
    '.vot-hb-barre{ height:14px; background:var(--accent); border-radius:0 4px 4px 0; min-width:2px; }',
    '.vot-hb-val{ color:var(--text); font-family:"IBM Plex Mono",monospace; font-size:11.5px; white-space:nowrap; }',
    '.vot-svg{ display:block; width:100%; height:auto; overflow:visible; }',
    '.vot-svg text{ fill:var(--text-muted); font:11px "IBM Plex Sans",system-ui,sans-serif; }',
    '.vot-svg .vot-v{ fill:var(--text); font-family:"IBM Plex Mono",monospace; font-size:10.5px; }',
    '.vot-svg .vot-grid{ stroke:var(--border); stroke-width:1; }',
    '.vot-svg .vot-col-b{ fill:var(--accent); }',
    '.vot-svg .vot-col-b:hover, .vot-hb-piste:hover .vot-hb-barre{ opacity:.8; }',
    '.vot-svg .vot-ligne{ fill:none; stroke:var(--accent); stroke-width:2; stroke-linejoin:round; }',
    '.vot-svg .vot-pt{ fill:var(--accent); stroke:var(--surface); stroke-width:2; }',
    '.vot-rien{ color:var(--text-faint); font-size:12.5px; padding:18px 0; text-align:center; }',
    '.vot-chiffres{ margin-top:8px; font-size:12px; }',
    '.vot-chiffres summary{ cursor:pointer; color:var(--text-faint); }',
    '.vot-chiffres table{ border-collapse:collapse; margin-top:6px; width:100%; }',
    '.vot-chiffres td{ padding:3px 6px; border-bottom:1px solid var(--border); }',
    '.vot-chiffres td:last-child{ text-align:right; font-family:"IBM Plex Mono",monospace; }',
    '@media print{ .vot-carte-tete .vot-x, .vot-chiffres{ display:none !important; } .vot-carte{ break-inside:avoid; } }'
  ].join("\n");

  function injecter() {
    if (document.getElementById("vigie-options-tableau-style")) return;
    var s = document.createElement("style");
    s.id = "vigie-options-tableau-style";
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function lireTout() {
    try {
      var brut = window.VigieStore ? VigieStore.getItem(CLE) : null;
      var o = brut ? JSON.parse(brut) : null;
      return (o && typeof o === "object" && !Array.isArray(o)) ? o : {};
    } catch (e) { return {}; }
  }
  function ecrireTout(o) {
    try { if (window.VigieStore) VigieStore.setItem(CLE, JSON.stringify(o)); } catch (e) { /* stockage indisponible : réglage du moment seulement */ }
  }

  function nomCompte(c) {
    if (!c) return "anonyme";
    if (typeof c === "string") return c;
    return String(c.email || c.user || "anonyme");
  }

  // « 2026-03-12 » → « 2026-03 » (mois) ou « 2026 » (année) ; rien si ce n'est pas une date.
  function periodeDe(v, pas) {
    var m = /^(\d{4})-(\d{2})/.exec(String(v || ""));
    if (!m) return "";
    return pas === "annee" ? m[1] : m[1] + "-" + m[2];
  }
  function libellePeriode(p) {
    var m = /^(\d{4})-(\d{2})$/.exec(p);
    return m ? MOIS[Number(m[2]) - 1] + " " + m[1] : p;
  }
  // Toutes les périodes entre la première et la dernière (un mois sans événement compte 0).
  function suitePeriodes(min, max, pas) {
    var out = [];
    if (pas === "annee") { for (var a = Number(min); a <= Number(max); a++) out.push(String(a)); return out; }
    var y = Number(min.slice(0, 4)), mo = Number(min.slice(5, 7));
    var fy = Number(max.slice(0, 4)), fm = Number(max.slice(5, 7));
    while ((y < fy || (y === fy && mo <= fm)) && out.length < 240) {
      out.push(y + "-" + (mo < 10 ? "0" : "") + mo);
      mo++; if (mo > 12) { mo = 1; y++; }
    }
    return out;
  }

  function nombre(v) {
    var n = Math.round(v * 10) / 10;
    return n.toLocaleString("fr-FR");
  }

  function create(opts) {
    injecter();
    var id = String(opts.id || "tableau");
    var compte = nomCompte(opts.compte);
    var origine = (opts.colonnes || []).map(function (c) { return { key: c.key, label: c.label }; });
    var parCle = {};
    origine.forEach(function (c, i) { parCle[c.key] = { label: c.label, rang: i }; });
    var groupes = opts.groupes || [];
    var mesures = (opts.mesures && opts.mesures.length) ? opts.mesures : [{ key: "nombre", label: "Nombre de lignes", valeur: function () { return 1; } }];
    var onColonnes = typeof opts.onColonnes === "function" ? opts.onColonnes : function () {};
    var zone = opts.zone || null;
    var dernieresLignes = [];

    // ----- réglages du compte -----
    function reglages() {
      var tout = lireTout();
      var r = tout[compte] && tout[compte][id];
      return (r && typeof r === "object") ? r : {};
    }
    function enregistrer(r) {
      var tout = lireTout();
      if (!tout[compte] || typeof tout[compte] !== "object") tout[compte] = {};
      tout[compte][id] = r;
      ecrireTout(tout);
    }

    // Ordre et visibilité : les réglages gardés, recalés sur les colonnes du jour
    // (une colonne disparue est oubliée, une colonne nouvelle arrive, affichée, à la fin).
    var etat = (function () {
      var gardees = Array.isArray(reglages().colonnes) ? reglages().colonnes : null;
      if (!gardees) return origine.map(function (c) { return { key: c.key, visible: true }; });
      var vus = {}, out = [];
      gardees.forEach(function (g) {
        if (g && parCle[g.key] && !vus[g.key]) { vus[g.key] = 1; out.push({ key: g.key, visible: g.visible !== false }); }
      });
      origine.forEach(function (c) { if (!vus[c.key]) out.push({ key: c.key, visible: true }); });
      if (!out.some(function (c) { return c.visible; }) && out.length) out[0].visible = true;
      return out;
    })();

    var graphiques = (function () {
      var g = reglages().graphiques;
      if (!Array.isArray(g)) return [];
      return g.filter(function (x) { return x && groupeDe(x.groupe) && mesureDe(x.mesure); }).slice(0, MAX_GRAPHIQUES);
    })();

    function groupeDe(k) { for (var i = 0; i < groupes.length; i++) if (groupes[i].key === k) return groupes[i]; return null; }
    function mesureDe(k) { for (var i = 0; i < mesures.length; i++) if (mesures[i].key === k) return mesures[i]; return null; }

    function sauver() {
      enregistrer({ colonnes: etat.map(function (c) { return { key: c.key, visible: c.visible }; }), graphiques: graphiques });
    }

    function colonnes() { return etat.filter(function (c) { return c.visible; }).map(function (c) { return c.key; }); }
    function ordreOrigine() {
      var k = colonnes();
      for (var i = 1; i < k.length; i++) if (parCle[k[i]].rang < parCle[k[i - 1]].rang) return false;
      return true;
    }
    function colonnesChangees() { sauver(); onColonnes(colonnes()); }

    // ----- fenêtre -----
    var fond = null, onglet = "colonnes", tireIndex = -1;

    function ouvrir(quel) {
      fermer();
      if (quel) onglet = quel;
      fond = document.createElement("div");
      fond.className = "vot-fond no-print";
      fond.innerHTML =
        '<div class="vot-boite" role="dialog" aria-modal="true" aria-labelledby="vot-titre">' +
          '<div class="vot-tete"><h2 id="vot-titre">Options du tableau</h2>' +
          '<button type="button" class="vot-x" data-vot="fermer" aria-label="Fermer">×</button></div>' +
          '<div class="vot-onglets" role="tablist">' +
            '<button type="button" class="vot-onglet" role="tab" data-onglet="colonnes">Colonnes</button>' +
            '<button type="button" class="vot-onglet" role="tab" data-onglet="graphiques">Graphiques</button>' +
          '</div>' +
          '<div class="vot-corps" id="vot-corps"></div>' +
        '</div>';
      document.body.appendChild(fond);
      fond.addEventListener("click", function (e) {
        if (e.target === fond || (e.target.closest && e.target.closest('[data-vot="fermer"]'))) { fermer(); return; }
        var o = e.target.closest && e.target.closest("[data-onglet]");
        if (o) { onglet = o.getAttribute("data-onglet"); dessinerFenetre(); }
      });
      document.addEventListener("keydown", echap);
      dessinerFenetre();
      var premier = fond.querySelector('[data-onglet="' + onglet + '"]');
      if (premier) premier.focus();
    }
    function echap(e) { if (e.key === "Escape") fermer(); }
    function fermer() {
      if (fond && fond.parentNode) fond.parentNode.removeChild(fond);
      fond = null;
      document.removeEventListener("keydown", echap);
      if (opts.bouton && opts.bouton.focus && document.activeElement === document.body) opts.bouton.focus();
    }

    function dessinerFenetre() {
      if (!fond) return;
      var onglets = fond.querySelectorAll("[data-onglet]");
      for (var i = 0; i < onglets.length; i++) onglets[i].setAttribute("aria-selected", onglets[i].getAttribute("data-onglet") === onglet ? "true" : "false");
      var corps = fond.querySelector("#vot-corps");
      if (onglet === "colonnes") dessinerColonnes(corps); else dessinerGraphiques(corps);
    }

    function dessinerColonnes(corps) {
      corps.innerHTML =
        '<p class="vot-aide">Cochée = colonne affichée. Faites glisser une ligne, ou utilisez les flèches, pour changer l\'ordre.</p>' +
        '<ul class="vot-liste" id="vot-liste">' + etat.map(function (c, i) {
          var lib = parCle[c.key].label;
          return '<li class="vot-col' + (c.visible ? "" : " vot-masquee") + '" draggable="true" data-i="' + i + '">' +
            '<span class="vot-poignee" aria-hidden="true">⋮⋮</span>' +
            '<input type="checkbox" id="vot-c-' + i + '"' + (c.visible ? " checked" : "") + ' aria-label="Afficher la colonne ' + esc(lib) + '">' +
            '<label class="vot-nom" for="vot-c-' + i + '">' + esc(lib) + '</label>' +
            '<button type="button" class="vot-fl" data-fl="-1" aria-label="Monter ' + esc(lib) + '"' + (i === 0 ? " disabled" : "") + '>▲</button>' +
            '<button type="button" class="vot-fl" data-fl="1" aria-label="Descendre ' + esc(lib) + '"' + (i === etat.length - 1 ? " disabled" : "") + '>▼</button>' +
          '</li>';
        }).join("") + '</ul>' +
        '<div class="vot-msg" id="vot-msg" role="status"></div>' +
        '<div class="vot-pied">' +
          '<button type="button" class="vot-lien" data-act="tout">Tout afficher</button>' +
          '<button type="button" class="vot-lien" data-act="origine">Revenir à l\'affichage d\'origine</button>' +
        '</div>';

      var liste = corps.querySelector("#vot-liste");
      liste.addEventListener("change", function (e) {
        var li = e.target.closest("li"); if (!li) return;
        var i = Number(li.getAttribute("data-i"));
        if (!e.target.checked && colonnes().length <= 1) {
          e.target.checked = true;
          corps.querySelector("#vot-msg").textContent = "Gardez au moins une colonne affichée.";
          return;
        }
        etat[i].visible = e.target.checked;
        li.classList.toggle("vot-masquee", !etat[i].visible);
        corps.querySelector("#vot-msg").textContent = "";
        colonnesChangees();
      });
      liste.addEventListener("click", function (e) {
        var b = e.target.closest("[data-fl]"); if (!b) return;
        var i = Number(b.closest("li").getAttribute("data-i"));
        deplacer(i, i + Number(b.getAttribute("data-fl")), true);
      });
      // glisser-déposer
      liste.addEventListener("dragstart", function (e) {
        var li = e.target.closest("li"); if (!li) return;
        tireIndex = Number(li.getAttribute("data-i"));
        li.classList.add("vot-tire");
        try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(tireIndex)); } catch (x) {}
      });
      liste.addEventListener("dragover", function (e) {
        var li = e.target.closest("li"); if (!li || tireIndex < 0) return;
        e.preventDefault();
        var prev = liste.querySelector(".vot-survol"); if (prev && prev !== li) prev.classList.remove("vot-survol");
        li.classList.add("vot-survol");
      });
      liste.addEventListener("dragleave", function (e) {
        var li = e.target.closest("li"); if (li && !li.contains(e.relatedTarget)) li.classList.remove("vot-survol");
      });
      liste.addEventListener("drop", function (e) {
        var li = e.target.closest("li"); if (!li || tireIndex < 0) return;
        e.preventDefault();
        var vers = Number(li.getAttribute("data-i"));
        var de = tireIndex; tireIndex = -1;
        deplacer(de, vers, false);
      });
      liste.addEventListener("dragend", function () {
        tireIndex = -1;
        var t = liste.querySelectorAll(".vot-tire,.vot-survol");
        for (var k = 0; k < t.length; k++) t[k].classList.remove("vot-tire", "vot-survol");
      });

      corps.querySelector(".vot-pied").addEventListener("click", function (e) {
        var a = e.target.getAttribute("data-act");
        if (a === "tout") etat.forEach(function (c) { c.visible = true; });
        else if (a === "origine") etat = origine.map(function (c) { return { key: c.key, visible: true }; });
        else return;
        colonnesChangees();
        dessinerColonnes(corps);
      });
    }

    function deplacer(de, vers, garderFocus) {
      if (vers < 0 || vers >= etat.length || de === vers) return;
      var c = etat.splice(de, 1)[0];
      etat.splice(vers, 0, c);
      colonnesChangees();
      var corps = fond && fond.querySelector("#vot-corps");
      if (!corps) return;
      dessinerColonnes(corps);
      if (garderFocus) {
        var li = corps.querySelector('li[data-i="' + vers + '"]');
        var b = li && li.querySelector('[data-fl="' + (vers > de ? 1 : -1) + '"]');
        if (b && !b.disabled) b.focus(); else if (li) li.querySelector("input").focus();
      }
    }

    // ----- graphiques -----
    function titreDe(g) {
      var gr = groupeDe(g.groupe), me = mesureDe(g.mesure);
      var par = gr.date ? gr.label + (g.periode === "annee" ? " (par année)" : " (par mois)") : gr.label;
      return me.label + " — " + par;
    }

    function dessinerGraphiques(corps) {
      var choixGroupes = groupes.map(function (g) {
        if (g.date) return '<option value="' + esc(g.key) + '|mois">' + esc(g.label) + ' — par mois</option>' +
                           '<option value="' + esc(g.key) + '|annee">' + esc(g.label) + ' — par année</option>';
        return '<option value="' + esc(g.key) + '|">' + esc(g.label) + '</option>';
      }).join("");
      corps.innerHTML =
        '<p class="vot-aide">Les graphiques s\'affichent sous le tableau et suivent ses filtres.</p>' +
        (graphiques.length
          ? '<ul class="vot-faits">' + graphiques.map(function (g, i) {
              return '<li class="vot-fait"><span>' + esc(titreDe(g)) + '</span>' +
                '<button type="button" class="vot-fl" data-gfl="-1" data-i="' + i + '" aria-label="Monter"' + (i === 0 ? " disabled" : "") + '>▲</button>' +
                '<button type="button" class="vot-fl" data-gfl="1" data-i="' + i + '" aria-label="Descendre"' + (i === graphiques.length - 1 ? " disabled" : "") + '>▼</button>' +
                '<button type="button" class="vot-x" data-retirer="' + i + '" aria-label="Retirer ce graphique">×</button></li>';
            }).join("") + '</ul>'
          : '<p class="vot-vide">Aucun graphique pour l\'instant.</p>') +
        '<p class="vot-titre-form">Nouveau graphique</p>' +
        '<div class="vot-champ"><label for="vot-groupe">Regrouper par</label><select id="vot-groupe">' + choixGroupes + '</select></div>' +
        '<div class="vot-champ"><label for="vot-mesure">Mesure</label><select id="vot-mesure">' +
          mesures.map(function (m) { return '<option value="' + esc(m.key) + '">' + esc(m.label) + '</option>'; }).join("") + '</select></div>' +
        '<div class="vot-champ" id="vot-forme-champ"><label for="vot-forme">Forme</label><select id="vot-forme">' +
          '<option value="colonnes">Colonnes</option><option value="courbe">Courbe</option></select></div>' +
        '<div class="vot-msg" id="vot-msg" role="status"></div>' +
        '<button type="button" class="vot-btn" id="vot-ajouter"' + (graphiques.length >= MAX_GRAPHIQUES ? " disabled" : "") + '>Ajouter le graphique</button>';

      var selG = corps.querySelector("#vot-groupe"), champForme = corps.querySelector("#vot-forme-champ");
      function majForme() { champForme.style.display = /\|(mois|annee)$/.test(selG.value) ? "" : "none"; }
      selG.addEventListener("change", majForme); majForme();

      corps.querySelector("#vot-ajouter").addEventListener("click", function () {
        if (graphiques.length >= MAX_GRAPHIQUES) return;
        var p = selG.value.split("|");
        var g = { id: "g" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), groupe: p[0], periode: p[1] || "",
                  mesure: corps.querySelector("#vot-mesure").value,
                  forme: p[1] ? corps.querySelector("#vot-forme").value : "barres" };
        graphiques.push(g);
        sauver();
        dessinerZone();
        dessinerGraphiques(corps);
        corps.querySelector("#vot-msg").textContent = "Graphique ajouté sous le tableau.";
      });
      var faits = corps.querySelector(".vot-faits");
      if (faits) faits.addEventListener("click", function (e) {
        var r = e.target.closest("[data-retirer]");
        if (r) { graphiques.splice(Number(r.getAttribute("data-retirer")), 1); }
        else {
          var f = e.target.closest("[data-gfl]"); if (!f) return;
          var i = Number(f.getAttribute("data-i")), j = i + Number(f.getAttribute("data-gfl"));
          if (j < 0 || j >= graphiques.length) return;
          var x = graphiques.splice(i, 1)[0]; graphiques.splice(j, 0, x);
        }
        sauver(); dessinerZone(); dessinerGraphiques(corps);
      });
    }

    // Regroupe les lignes : [{ cle, libelle, valeur }] dans l'ordre d'affichage.
    function agreger(g, lignes) {
      var gr = groupeDe(g.groupe), me = mesureDe(g.mesure);
      var lire = typeof gr.valeur === "function" ? gr.valeur : function (r) { return r[gr.key]; };
      var somme = {}, n = 0;
      lignes.forEach(function (r) {
        var v = Number(me.valeur(r)) || 0;
        var k;
        if (gr.date) { k = periodeDe(lire(r), g.periode); if (!k) return; }
        else { k = String(lire(r) === null || lire(r) === undefined ? "" : lire(r)).trim() || "(vide)"; }
        somme[k] = (somme[k] || 0) + v; n++;
      });
      var cles = Object.keys(somme);
      if (!cles.length) return [];
      if (gr.date) {
        cles.sort();
        return suitePeriodes(cles[0], cles[cles.length - 1], g.periode).map(function (p) {
          return { cle: p, libelle: libellePeriode(p), valeur: somme[p] || 0 };
        });
      }
      var out = cles.map(function (k) { return { cle: k, libelle: k, valeur: somme[k] }; })
        .sort(function (a, b) { return b.valeur - a.valeur || a.libelle.localeCompare(b.libelle, "fr", { numeric: true }); });
      if (out.length > MAX_BARRES) {
        var reste = out.slice(MAX_BARRES - 1);
        out = out.slice(0, MAX_BARRES - 1);
        out.push({ cle: "", libelle: "Autres (" + reste.length + ")", valeur: reste.reduce(function (s, x) { return s + x.valeur; }, 0) });
      }
      return out;
    }

    function barres(pts, unite) {
      var max = Math.max.apply(null, pts.map(function (p) { return p.valeur; })) || 1;
      return '<div class="vot-hb">' + pts.map(function (p) {
        var t = esc(p.libelle) + " : " + nombre(p.valeur) + unite;
        return '<div class="vot-hb-lib" title="' + esc(p.libelle) + '">' + esc(p.libelle) + '</div>' +
          '<div class="vot-hb-piste" title="' + t + '"><div class="vot-hb-barre" style="width:' + (p.valeur / max * 88).toFixed(1) + '%"></div>' +
          '<span class="vot-hb-val">' + nombre(p.valeur) + '</span></div>';
      }).join("") + '</div>';
    }

    // Colonnes ou courbe dans le temps (SVG, une seule échelle, axe à zéro).
    function temps(pts, forme, unite) {
      var W = 560, H = 210, g = 34, d = 10, h = 14, b = 30;
      var lw = W - g - d, lh = H - h - b;
      var max = Math.max.apply(null, pts.map(function (p) { return p.valeur; }));
      var pas = max <= 5 ? 1 : Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
      if (max / pas > 5) pas *= 2;
      if (max / pas > 5) pas = pas / 2 * 5;
      var haut = Math.max(pas, Math.ceil(max / pas) * pas);
      var y = function (v) { return h + lh - v / haut * lh; };
      var n = pts.length, l = lw / n;
      var x = function (i) { return g + l * i + l / 2; };
      var s = '<svg class="vot-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(pts.length + " périodes") + '">';
      for (var v = 0; v <= haut + 1e-9; v += pas) {
        s += '<line class="vot-grid" x1="' + g + '" x2="' + (W - d) + '" y1="' + y(v).toFixed(1) + '" y2="' + y(v).toFixed(1) + '"/>' +
             '<text x="' + (g - 6) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end">' + nombre(v) + '</text>';
      }
      // Un libellé de période fait environ 64 unités (« sept. 2026 ») : on en montre autant que la
      // largeur en tient, comptés depuis la dernière période (toujours lisible).
      var saut = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(lw / 72))));
      pts.forEach(function (p, i) {
        if ((n - 1 - i) % saut === 0) s +='<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(p.libelle) + '</text>';
      });
      if (forme === "courbe") {
        s += '<polyline class="vot-ligne" points="' + pts.map(function (p, i) { return x(i).toFixed(1) + "," + y(p.valeur).toFixed(1); }).join(" ") + '"/>';
        pts.forEach(function (p, i) {
          s += '<circle class="vot-pt" cx="' + x(i).toFixed(1) + '" cy="' + y(p.valeur).toFixed(1) + '" r="' + (n > 36 ? 3 : 4) + '"><title>' + esc(p.libelle + " : " + nombre(p.valeur) + unite) + '</title></circle>';
        });
      } else {
        var bw = Math.max(2, Math.min(36, l - 2));
        pts.forEach(function (p, i) {
          var top = y(p.valeur), hh = (h + lh) - top;
          if (hh <= 0) return;
          var r = Math.min(4, bw / 2, hh);
          var x0 = x(i) - bw / 2, x1 = x(i) + bw / 2, base = h + lh;
          s += '<path class="vot-col-b" d="M' + x0.toFixed(1) + ',' + base + 'V' + (top + r).toFixed(1) + 'Q' + x0.toFixed(1) + ',' + top.toFixed(1) + ' ' + (x0 + r).toFixed(1) + ',' + top.toFixed(1) +
               'H' + (x1 - r).toFixed(1) + 'Q' + x1.toFixed(1) + ',' + top.toFixed(1) + ' ' + x1.toFixed(1) + ',' + (top + r).toFixed(1) + 'V' + base + 'Z"><title>' + esc(p.libelle + " : " + nombre(p.valeur) + unite) + '</title></path>';
          if (n <= 16) s += '<text class="vot-v" x="' + x(i).toFixed(1) + '" y="' + (top - 4).toFixed(1) + '" text-anchor="middle">' + nombre(p.valeur) + '</text>';
        });
      }
      return s + '</svg>';
    }

    function dessinerZone() {
      if (!zone) return;
      if (!graphiques.length) { zone.hidden = true; zone.innerHTML = ""; return; }
      zone.hidden = false;
      var cartes = graphiques.map(function (g, i) {
        var me = mesureDe(g.mesure), gr = groupeDe(g.groupe);
        var unite = me.unite ? " " + me.unite : "";
        var pts = agreger(g, dernieresLignes);
        var corps;
        if (!pts.length || pts.every(function (p) { return !p.valeur; })) corps = '<div class="vot-rien">Aucune donnée pour les filtres choisis.</div>';
        else corps = (gr.date ? temps(pts, g.forme, unite) : barres(pts, unite)) +
          '<details class="vot-chiffres"><summary>Voir les chiffres</summary><table>' +
          pts.map(function (p) { return '<tr><td>' + esc(p.libelle) + '</td><td>' + nombre(p.valeur) + '</td></tr>'; }).join("") + '</table></details>';
        return '<figure class="vot-carte" style="margin:0" data-graphique="' + esc(g.id) + '">' +
          '<div class="vot-carte-tete"><h3>' + esc(titreDe(g)) + '</h3>' +
          '<button type="button" class="vot-x" data-retirer-g="' + i + '" aria-label="Retirer ce graphique" title="Retirer ce graphique">×</button></div>' +
          corps + '</figure>';
      }).join("");
      zone.innerHTML = '<div class="vot-zone-tete"><div class="panel-title">Graphiques</div>' +
        '<small>' + dernieresLignes.length + ' ligne' + (dernieresLignes.length > 1 ? "s" : "") + ' — selon les filtres du tableau</small>' +
        '<button type="button" class="btn btn-ghost no-print" data-vot-ouvrir="graphiques">Ajouter un graphique</button></div>' +
        '<div class="vot-grille">' + cartes + '</div>';
    }

    if (zone) zone.addEventListener("click", function (e) {
      var r = e.target.closest && e.target.closest("[data-retirer-g]");
      if (r) { graphiques.splice(Number(r.getAttribute("data-retirer-g")), 1); sauver(); dessinerZone(); return; }
      if (e.target.closest && e.target.closest("[data-vot-ouvrir]")) ouvrir("graphiques");
    });
    if (opts.bouton) opts.bouton.addEventListener("click", function () { ouvrir(); });

    return {
      colonnes: colonnes,
      ordreOrigine: ordreOrigine,
      graphiques: function (lignes) { dernieresLignes = lignes || []; dessinerZone(); },
      ouvrir: ouvrir,
      fermer: fermer
    };
  }

  window.VigieOptionsTableau = { create: create, CLE: CLE };
})();
