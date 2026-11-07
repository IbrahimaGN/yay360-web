/** Fabrique un JWT non signé pour les tests (seule la charge utile est lue par le front). */
export function jetonDeTest(charge: Record<string, unknown>): string {
  const base64Url = (objet: unknown) =>
    btoa(JSON.stringify(objet)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${base64Url({ alg: 'HS256' })}.${base64Url(charge)}.signature`;
}

/** Expiration dans `secondes` secondes (négatif = déjà expiré). */
export function expDans(secondes: number): number {
  return Math.floor(Date.now() / 1000) + secondes;
}
