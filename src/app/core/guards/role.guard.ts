import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/utilisateur.model';

/**
 * Utilisation : { path: 'dashboard', canActivate: [roleGuard], data: { roles: ['ADMIN'] } }
 * Confort d'interface uniquement : le serveur vérifie toujours les droits (@PreAuthorize).
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rolesAutorises = (route.data['roles'] as Role[] | undefined) ?? [];

  if (rolesAutorises.length === 0 || authService.hasRole(...rolesAutorises)) {
    return true;
  }
  return router.createUrlTree(['/acces-refuse']);
};
