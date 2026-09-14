/* ============================================================================
   VIGIE HSE — Tri & filtres de colonnes façon tableur
   ----------------------------------------------------------------------------
   Composant autonome et réutilisable : aucune dépendance, aucune étape de build,
   aucun framework. Il s'ajoute à une page avec :

       <script src="assets/tri-filtres.js"></script>

   puis, dans le script de la page :

       const tri = VigieTri.create({
         columns: VISIBLE_COLUMNS,          // [{ key, label, value?, noFilter? }]
         onChange: () => render(),          // rappelé quand tri/filtre change
       });
       tri.decorate($("theadFields"));      // après (re)construction de l'en-tête
       rows = tri.apply(rows);              // dans render(), avant l'affichage

   - `value(row)` est optionnel : par défaut on lit `row[key]`. À fournir quand la
     valeur affichée est calculée (badge, champ dérivé) — on trie et on filtre sur
     la valeur métier, jamais sur le HTML rendu.
   - `noFilter: true` neutralise une colonne (ex. la colonne Actions).

   Le composant injecte lui-même sa feuille de style, construite sur les variables
   CSS déjà définies par chaque page (--surface-el, --border, --accent…), pour
   suivre automatiquement le thème clair/sombre sans fichier CSS partagé.
   ========================================================================== */
(function () {
  "use strict";
  if (window.VigieTri) return;

  var STYLE_ID = "vigie-tri-style";
  var CSS = [
    '.vt-th{ display:flex; align-items:center; gap:6px; }',
    '.vt-label{ cursor:pointer; user-select:none; display:inline-flex; align-items:center; gap:4px; }',
    '.vt-label:hover{ color:var(--text); }',
    '.vt-arrow{ font-size:9px; line-height:1; color:var(--accent); }',
    '.vt-btn{ margin-left:auto; background:none; border:none; cursor:pointer; color:var(--text-faint); padding:2px; border-radius:5px; line-height:0; flex-shrink:0; }',
    '.vt-btn:hover{ background:var(--bg-2); color:var(--text-muted); }',
    '.vt-btn.on{ color:var(--accent); background:rgba(var(--accent-rgb),.14); }',
    '.vt-btn svg{ width:13px; height:13px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }',
    '.vt-pop{ position:fixed; z-index:9999; width:252px; background:var(--surface-el); border:1px solid var(--border);',
    '  border-radius:10px; box-shadow:0 12px 36px rgba(0,0,0,.22); padding:10px;',
    '  font:500 12.5px "IBM Plex Sans",system-ui,-apple-system,Segoe UI,sans-serif; color:var(--text); }',
    '.vt-pop .vt-search{ width:100%; box-sizing:border-box; background:var(--surface); border:1px solid var(--border);',
    '  color:var(--text); font:500 12.5px inherit; padding:7px 9px; border-radius:8px; }',
    '.vt-pop .vt-search:focus{ outline:none; border-color:var(--accent); }',
    '.vt-list{ max-height:208px; overflow:auto; margin:8px 0; display:flex; flex-direction:column; gap:1px; scrollbar-width:thin; }',
    '.vt-item{ display:flex; align-items:center; gap:7px; padding:4px 5px; border-radius:6px; cursor:pointer; white-space:nowrap; }',
    '.vt-item:hover{ background:var(--bg-2); }',
    '.vt-item input{ width:14px; height:14px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }',
    '.vt-item span.vt-txt{ overflow:hidden; text-overflow:ellipsis; }',
    '.vt-count{ margin-left:auto; color:var(--text-faint); font-size:11px; font-family:"IBM Plex Mono",monospace; }',
    '.vt-sep{ border-top:1px solid var(--border); margin:6px 0; }',
    '.vt-actions{ display:flex; gap:12px; border-top:1px solid var(--border); padding-top:8px; }',
    '.vt-a{ background:none; border:none; cursor:pointer; color:var(--accent); font:600 11.5px inherit; padding:0; }',
    '.vt-a:hover{ text-decoration:underline; }',
    '.vt-a.vt-mute{ color:var(--text-faint); margin-left:auto; }',
    '.vt-empty{ color:var(--text-faint); font-size:11.5px; padding:8px 4px; }',
    '@media print{ .vt-btn{ display:none !important; } }'
  ].join('\n');

  var FUNNEL = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>';
  var VIDE = "(vide)";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function txt(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
  }

  /* Comparaison type-consciente : numérique si les deux valeurs sont des nombres,
     sinon comparaison texte française (numeric:true gère "Service 2" < "Service 10"). */
  function compare(a, b) {
    var sa = txt(a), sb = txt(b);
    if (sa === "" && sb === "") return 0;
    if (sa === "") return 1;   // les valeurs vides toujours en fin de tri
    if (sb === "") return -1;
    var na = Number(sa.replace(",", ".")), nb = Number(sb.replace(",", "."));
    if (sa !== "" && sb !== "" && !isNaN(na) && !isNaN(nb)) return na - nb;
    return sa.localeCompare(sb, "fr", { numeric: true, sensitivity: "base" });
  }

  function create(opts) {
    injectStyles();

    var cols = (opts.columns || []).map(function (c) {
      return {
        key: c.key,
        label: c.label,
        noFilter: !!c.noFilter,
        value: typeof c.value === "function" ? c.value : (function (k) {
          return function (row) { return row[k]; };
        })(c.key)
      };
    });
    var byKey = {};
    cols.forEach(function (c) { byKey[c.key] = c; });

    var onChange = typeof opts.onChange === "function" ? opts.onChange : function () {};
    var state = { sortKey: null, sortDir: 0, filters: {} }; // filters[key] = Set de valeurs retenues
    var lastRows = [];
    var pop = null, popKey = null, headRowEl = null;

    function valOf(col, row) { var v = txt(col.value(row)); return v === "" ? VIDE : v; }

    function passes(row, exceptKey) {
      for (var k in state.filters) {
        if (!state.filters.hasOwnProperty(k) || k === exceptKey) continue;
        var set = state.filters[k];
        if (!set) continue;
        var col = byKey[k];
        if (!col) continue;
        if (!set.has(valOf(col, row))) return false;
      }
      return true;
    }

    /* Options d'une colonne : calculées sur les lignes filtrées par les AUTRES
       colonnes (comportement d'un tableur — la liste d'une colonne ne se vide pas
       elle-même quand on la filtre). */
    function optionsFor(col) {
      var counts = Object.create(null);
      lastRows.forEach(function (row) {
        if (!passes(row, col.key)) return;
        var v = valOf(col, row);
        counts[v] = (counts[v] || 0) + 1;
      });
      return Object.keys(counts)
        .sort(function (a, b) {
          if (a === VIDE) return 1;
          if (b === VIDE) return -1;
          return compare(a, b);
        })
        .map(function (v) { return { value: v, count: counts[v] }; });
    }

    function isFiltered(key) { return !!state.filters[key]; }

    function closePop() {
      if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
      pop = null; popKey = null;
    }

    function onDocDown(e) {
      if (!pop) return;
      if (pop.contains(e.target)) return;
      if (e.target.closest && e.target.closest(".vt-btn")) return;
      closePop();
    }
    function onKey(e) { if (e.key === "Escape") closePop(); }
    document.addEventListener("mousedown", onDocDown, true);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", closePop);
    window.addEventListener("scroll", closePop, true);

    function openPop(col, anchor) {
      if (popKey === col.key) { closePop(); return; }
      closePop();
      popKey = col.key;

      var options = optionsFor(col);
      var retained = state.filters[col.key]; // Set ou undefined (= tout)

      pop = document.createElement("div");
      pop.className = "vt-pop";

      var search = document.createElement("input");
      search.type = "search";
      search.className = "vt-search";
      search.placeholder = "Rechercher…";
      search.setAttribute("aria-label", "Rechercher une valeur");
      pop.appendChild(search);

      var list = document.createElement("div");
      list.className = "vt-list";
      pop.appendChild(list);

      // état de travail : on applique au fil des clics
      var checked = Object.create(null);
      options.forEach(function (o) {
        checked[o.value] = retained ? retained.has(o.value) : true;
      });

      function commit() {
        var all = options.every(function (o) { return checked[o.value]; });
        if (all) {
          delete state.filters[col.key];
        } else {
          var set = new Set();
          options.forEach(function (o) { if (checked[o.value]) set.add(o.value); });
          state.filters[col.key] = set;
        }
        refreshBtns();
        onChange();
      }

      function renderList() {
        var q = search.value.trim().toLowerCase();
        var shown = options.filter(function (o) {
          return !q || o.value.toLowerCase().indexOf(q) !== -1;
        });
        list.innerHTML = "";
        if (shown.length === 0) {
          var e = document.createElement("div");
          e.className = "vt-empty";
          e.textContent = "Aucune valeur ne correspond.";
          list.appendChild(e);
          return;
        }
        shown.forEach(function (o) {
          var lab = document.createElement("label");
          lab.className = "vt-item";
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = !!checked[o.value];
          cb.addEventListener("change", function () {
            checked[o.value] = cb.checked;
            commit();
          });
          var t = document.createElement("span");
          t.className = "vt-txt";
          t.textContent = o.value;
          var c = document.createElement("span");
          c.className = "vt-count";
          c.textContent = o.count;
          lab.appendChild(cb); lab.appendChild(t); lab.appendChild(c);
          list.appendChild(lab);
        });
      }
      search.addEventListener("input", renderList);
      renderList();

      var actions = document.createElement("div");
      actions.className = "vt-actions";

      var bAll = document.createElement("button");
      bAll.type = "button"; bAll.className = "vt-a"; bAll.textContent = "Tout cocher";
      bAll.addEventListener("click", function () {
        options.forEach(function (o) { checked[o.value] = true; });
        renderList(); commit();
      });

      var bNone = document.createElement("button");
      bNone.type = "button"; bNone.className = "vt-a"; bNone.textContent = "Tout décocher";
      bNone.addEventListener("click", function () {
        options.forEach(function (o) { checked[o.value] = false; });
        renderList(); commit();
      });

      var bClear = document.createElement("button");
      bClear.type = "button"; bClear.className = "vt-a vt-mute"; bClear.textContent = "Effacer";
      bClear.addEventListener("click", function () {
        delete state.filters[col.key];
        closePop(); refreshBtns(); onChange();
      });

      actions.appendChild(bAll); actions.appendChild(bNone); actions.appendChild(bClear);
      pop.appendChild(actions);

      document.body.appendChild(pop);

      // positionnement sous l'en-tête, recadré dans la fenêtre
      var r = anchor.getBoundingClientRect();
      var w = pop.offsetWidth, h = pop.offsetHeight;
      var left = Math.min(Math.max(8, r.left - w + r.width), window.innerWidth - w - 8);
      var top = r.bottom + 6;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
      pop.style.left = left + "px";
      pop.style.top = top + "px";
      search.focus();
    }

    function refreshBtns() {
      if (!headRowEl) return;
      var btns = headRowEl.querySelectorAll(".vt-btn");
      for (var i = 0; i < btns.length; i++) {
        var k = btns[i].getAttribute("data-key");
        btns[i].classList.toggle("on", isFiltered(k));
        btns[i].title = isFiltered(k) ? "Filtre actif sur cette colonne" : "Filtrer cette colonne";
      }
      var labs = headRowEl.querySelectorAll(".vt-label");
      for (var j = 0; j < labs.length; j++) {
        var kk = labs[j].getAttribute("data-key");
        var ar = labs[j].querySelector(".vt-arrow");
        if (ar) ar.textContent = (state.sortKey === kk) ? (state.sortDir === 1 ? "▲" : "▼") : "";
      }
    }

    function decorate(headRow) {
      if (!headRow) return;
      headRowEl = headRow;
      var ths = headRow.children;
      for (var i = 0; i < ths.length && i < cols.length; i++) {
        (function (col, th) {
          if (col.noFilter) return;
          th.innerHTML = "";
          var wrap = document.createElement("div");
          wrap.className = "vt-th";

          var lab = document.createElement("span");
          lab.className = "vt-label";
          lab.setAttribute("data-key", col.key);
          lab.title = "Trier sur « " + col.label + " »";
          lab.appendChild(document.createTextNode(col.label));
          var arrow = document.createElement("span");
          arrow.className = "vt-arrow";
          lab.appendChild(arrow);
          lab.addEventListener("click", function () {
            if (state.sortKey !== col.key) { state.sortKey = col.key; state.sortDir = 1; }
            else if (state.sortDir === 1) { state.sortDir = -1; }
            else { state.sortKey = null; state.sortDir = 0; }
            closePop(); refreshBtns(); onChange();
          });

          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "vt-btn";
          btn.setAttribute("data-key", col.key);
          btn.innerHTML = FUNNEL;
          btn.addEventListener("click", function (e) {
            e.stopPropagation();
            openPop(col, btn);
          });

          wrap.appendChild(lab);
          wrap.appendChild(btn);
          th.appendChild(wrap);
        })(cols[i], ths[i]);
      }
      refreshBtns();
    }

    function apply(rows) {
      lastRows = rows || [];
      var out = lastRows.filter(function (r) { return passes(r, null); });
      if (state.sortKey && byKey[state.sortKey]) {
        var col = byKey[state.sortKey];
        var dir = state.sortDir;
        out = out.slice().sort(function (a, b) {
          // Les valeurs vides restent toujours en fin de liste, y compris en tri
          // décroissant : le sens ne s'applique qu'aux valeurs renseignées (comme
          // le fait un tableur avec les cellules vides).
          var va = txt(col.value(a)), vb = txt(col.value(b));
          if (va === "" && vb === "") return 0;
          if (va === "") return 1;
          if (vb === "") return -1;
          return dir * compare(va, vb);
        });
      }
      return out;
    }

    function reset() {
      state.sortKey = null; state.sortDir = 0; state.filters = {};
      closePop(); refreshBtns();
    }

    function activeFilterCount() { return Object.keys(state.filters).length; }

    return {
      decorate: decorate,
      apply: apply,
      reset: reset,
      activeFilterCount: activeFilterCount,
      close: closePop
    };
  }

  window.VigieTri = { create: create };
})();
