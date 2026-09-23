// Lecture d'un fichier importé (2026-09-23) : tous les imports passent par VigieImport.lireClasseur.
// Réponse du préventeur à la question 13 : « tout type de fichier est à prévoir ». Un tableur
// (.xlsx, .xls, .ods) est lu tel quel ; un fichier texte (.csv) est d'abord DÉCODÉ correctement,
// car SheetJS le lisait octet par octet :
//   - CSV UTF-8 sans BOM (LibreOffice, la plupart des logiciels) : accents cassés (« PropretÃ© »),
//     et une valeur comme « Agglomération » devenait méconnaissable, donc remplacée par « Ville » ;
//   - CSV Windows-1252 (Excel français, « CSV séparateur point-virgule ») : « — », « ’ », « œ », « € »
//     perdus.
// Règle : BOM UTF-8 → UTF-8 ; sinon, UTF-8 s'il est valide, Windows-1252 dans tous les autres cas.
// Séparateur « ; » ou « , » : reconnu par SheetJS.
(function(){
  if (window.VigieImport) return;
  function estTableur(o){
    // .xlsx / .ods (archive ZIP « PK\3\4 ») ou .xls (conteneur OLE D0 CF 11 E0)
    return (o[0] === 0x50 && o[1] === 0x4B && o[2] === 0x03 && o[3] === 0x04) ||
           (o[0] === 0xD0 && o[1] === 0xCF && o[2] === 0x11 && o[3] === 0xE0);
  }
  function decoder(o){
    if (o[0] === 0xEF && o[1] === 0xBB && o[2] === 0xBF) return new TextDecoder("utf-8").decode(o.subarray(3));
    try { return new TextDecoder("utf-8", { fatal: true }).decode(o); }
    catch(e){ return new TextDecoder("windows-1252").decode(o); }
  }
  window.VigieImport = {
    // buf : l'ArrayBuffer du fichier (file.arrayBuffer()). Mêmes options de lecture qu'avant pour les tableurs.
    lireClasseur: function(buf){
      var o = new Uint8Array(buf);
      if (estTableur(o) || typeof TextDecoder === "undefined") return XLSX.read(buf, { type: "array", cellDates: true });
      return XLSX.read(decoder(o), { type: "string", cellDates: true });
    },
  };
})();
