/** Fonctions d'affichage partagées par les écrans (une seule implémentation, testée une fois). */

/** Initiales d'un nom (deux premiers mots), sans ce qui est entre parenthèses : « Awa Diop (patiente) » → « AD ». */
export function initiales(nom: string): string {
  return nom
    .replace(/\([^)]*\)/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m.charAt(0).toUpperCase())
    .join('');
}

/** Durée écoulée depuis une date, lisible : « il y a 5 min », « il y a 2 h », « il y a 3 jours » (ou « 3 j » en court). */
export function dureeEcoulee(date: string, court = false, maintenant: number = Date.now()): string {
  const min = Math.max(0, Math.round((maintenant - +new Date(date)) / 60000));
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return court ? `il y a ${j} j` : `il y a ${j} jour${j > 1 ? 's' : ''}`;
}
