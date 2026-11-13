import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Évite plusieurs déconnexions et redirections quand des appels parallèles reçoivent un 401. */
let redirectionEnCours = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Le jeton n'est envoyé qu'à l'API YAY360, jamais à un domaine tiers
  const versApi = req.url.startsWith(environment.apiUrl);
  const token = versApi ? authService.token : null;
  const requete = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requete).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (!versApi) {
        return throwError(() => erreur);
      }
      const cheminAuth = req.url.startsWith(`${environment.apiUrl}/auth/`);

      // 401 sur /auth/* = identifiants refusés (connexion, ancien mot de passe…) : pas une fin de session
      if (erreur.status === 401 && !cheminAuth && !redirectionEnCours) {
        redirectionEnCours = true;
        const retour = router.url.startsWith('/connexion') ? undefined : router.url;
        authService.logout();
        void router
          .navigate(['/connexion'], { queryParams: retour ? { returnUrl: retour, expiree: 1 } : {} })
          .finally(() => (redirectionEnCours = false));
      }

      // Compte créé par l'admin dont le mot de passe temporaire n'a pas été changé
      if (erreur.status === 403 && erreur.error?.erreur === 'Mot de passe temporaire') {
        authService.marquerMotDePasseTemporaire();
        void router.navigate(['/changer-mot-de-passe']);
      }
      return throwError(() => erreur);
    })
  );
};
