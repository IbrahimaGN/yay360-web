/**
 * Production : l'API est appelée sur le même domaine que le web, via le proxy Nginx
 * (/api → backend). Aucune URL codée en dur, pas de CORS, fonctionne sur tout domaine.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
