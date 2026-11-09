/** Déclenche le téléchargement d'un fichier reçu de l'API (ex. dossier PDF), sans le conserver en mémoire. */
export function telechargerFichier(contenu: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(contenu);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.rel = 'noopener';
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

/** Nom du fichier PDF du dossier, daté du jour. */
export function nomDossierPdf(suffixe: string): string {
  return `yay360-dossier-grossesse-${suffixe}-${new Date().toISOString().slice(0, 10)}.pdf`;
}
