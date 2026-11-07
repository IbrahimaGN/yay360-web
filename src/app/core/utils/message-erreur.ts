import { HttpErrorResponse } from '@angular/common/http';
import { ErreurApi } from '../models/erreur-api.model';

/**
 * Message lisible à partir d'une erreur HTTP : détail des champs invalides (400 de validation),
 * sinon message de l'API, sinon message par défaut. Gère aussi l'absence de réseau.
 */
export function messageErreur(err: unknown, parDefaut = 'Une erreur est survenue. Réessayez.'): string {
  if (!(err instanceof HttpErrorResponse)) {
    return parDefaut;
  }
  if (err.status === 0) {
    return 'Serveur injoignable. Vérifiez votre connexion et réessayez.';
  }
  const corps = err.error as Partial<ErreurApi> | null;
  const champs = corps?.champsInvalides;
  if (champs && Object.keys(champs).length > 0) {
    return Object.values(champs).join(' · ');
  }
  return corps?.message || parDefaut;
}

/** Champs invalides renvoyés par l'API, pour les afficher sous chaque contrôle. */
export function champsInvalides(err: unknown): Record<string, string> {
  if (err instanceof HttpErrorResponse) {
    return (err.error as Partial<ErreurApi> | null)?.champsInvalides ?? {};
  }
  return {};
}
