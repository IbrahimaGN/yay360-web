import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Exige une session valide ; mémorise la page demandée pour y revenir après connexion. */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estConnecte() && authService.token) {
    return true;
  }
  return router.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
};

/** Pages publiques d'authentification : un utilisateur déjà connecté va directement à l'accueil. */
export const inviteGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.estConnecte() && authService.token ? router.createUrlTree(['/accueil']) : true;
};

/** Tant que le mot de passe temporaire n'est pas changé, seul l'écran de changement est accessible. */
export const motDePasseTemporaireGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.doitChangerMotDePasse() ? router.createUrlTree(['/changer-mot-de-passe']) : true;
};
