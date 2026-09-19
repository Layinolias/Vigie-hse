// Calcul de prochaine échéance (date de base + périodicité en mois) et classement par rapport
// à aujourd'hui, partagé entre urgences-exercices.html, verifications-periodiques.html,
// formation-habilitation.html et sante-visites.html. Chaque page garde son propre libellé de
// statut (À jour/En retard/À programmer ou Expirée/À renouveler) et sa propre logique de
// périodicité par défaut (12, 24, ou plafonnée par une surveillance renforcée) — seuls le calcul
// de date et le seuil des 60 jours, identiques dans les 4 copies, sont mutualisés ici.
window.VigieEcheance = {
  SEUIL_JOURS_DEFAUT: 60,
  classify(dateBaseStr, periodiciteMois, seuilJours){
    if (seuilJours == null) seuilJours = this.SEUIL_JOURS_DEFAUT;
    const d = new Date(dateBaseStr);
    const prochaine = new Date(d);
    prochaine.setMonth(prochaine.getMonth() + periodiciteMois);
    const today = new Date();
    const seuil = new Date(today);
    seuil.setDate(seuil.getDate() + seuilJours);
    let cls = "ok";
    if (prochaine < today) cls = "late";
    else if (prochaine <= seuil) cls = "soon";
    return { prochaine: prochaine.toISOString().slice(0,10), cls };
  },
};
