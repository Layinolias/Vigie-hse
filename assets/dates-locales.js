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
};
