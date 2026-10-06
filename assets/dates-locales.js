// Dates au format "AAAA-MM-JJ" lues et écrites à l'heure LOCALE du navigateur.
// new Date("AAAA-MM-JJ") vaut minuit UTC et toISOString() repasse en UTC : en France, cela donne
// la veille entre minuit et 2 h du matin, et, après un calcul de mois franchissant le passage à
// l'heure d'été, la veille à toute heure (2026-01-20 + 6 mois affichait 2026-07-19).
// Utilisé par assets/echeance.js (à charger après ce fichier) et par les exports Excel.
window.VigieDates = {
  // "AAAA-MM-JJ" (éventuellement suivi d'une heure) → minuit local ; autre format → lecture native
  lire(s){
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(s);
  },
  // Date → "AAAA-MM-JJ" local ; une date illisible lève la même RangeError que toISOString()
  iso(d){
    if (isNaN(d)) return d.toISOString();
    const p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  },
  aujourdhui(){ return this.iso(new Date()); },
  // Date d'une cellule importée (Excel, LibreOffice, CSV) → "AAAA-MM-JJ", ou "" si ce n'est pas une date
  // valide. Une vraie date de tableur arrive en objet Date ; un texte se lit à la FRANÇAISE : JJ/MM/AAAA
  // (séparateur « / », « . » ou « - » ; année sur deux chiffres : 00-29 → 20xx, 30-99 → 19xx, comme Excel),
  // ou AAAA-MM-JJ (« / » accepté). Jamais dans l'ordre américain : « 01/09/2026 » lu mois/jour devenait le
  // 9 janvier, et « 25/09/2026 » s'enregistrait « 2026-25-09 » (BUGS-CONNUS, 2026-10-06). Une date
  // impossible (31/02, 13e mois) donne "" plutôt qu'une date décalée.
  depuisImport(v){
    // objet Date reconnu par son type, pas par instanceof : une date venue d'un autre contexte (cadre,
    // fenêtre) n'est pas une « instance » du Date de cette page
    if (Object.prototype.toString.call(v) === "[object Date]") return isNaN(v) ? "" : this.iso(v);
    const s = String(v == null ? "" : v).trim();
    let a, mo, j, m;
    if ((m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?!\d)/.exec(s))){ a = +m[1]; mo = +m[2]; j = +m[3]; }
    else if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4}|\d{2})(?!\d)/.exec(s))){
      j = +m[1]; mo = +m[2]; a = +m[3];
      if (m[3].length === 2) a += a < 30 ? 2000 : 1900;
    }
    // texte d'un objet Date (« Fri Sep 25 2026 00:00:00 GMT+0200… ») : ce qu'enregistraient certains imports
    // avant le 2026-10-06 ; sans ambiguïté, donc relu tel quel
    else if (/^[A-Za-z]{3} [A-Za-z]{3} \d{1,2} \d{4}\b/.test(s)){
      const d = new Date(s);
      return isNaN(d) ? "" : this.iso(d);
    }
    else return "";
    const d = new Date(a, mo - 1, j);
    return (d.getFullYear() === a && d.getMonth() === mo - 1 && d.getDate() === j) ? this.iso(d) : "";
  },
};
