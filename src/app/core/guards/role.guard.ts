import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/utilisateur.model';

/**
 * Utilisation : { path: 'dashboard', canActivate: [roleGuard], data: { roles: ['ADMIN'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rolesAutorises = (route.data['roles'] as Role[] | undefined) ?? [];

  if (rolesAutorises.length === 0 || authService.hasRole(...rolesAutorises)) {
    return true;
  }

  router.navigate(['/acces-refuse']);
  return false;
};
