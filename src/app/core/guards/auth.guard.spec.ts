import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, inviteGuard, motDePasseTemporaireGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { expDans, jetonDeTest } from '../testing/jeton-de-test';

describe('Guards', () => {
  const etat = { url: '/grossesses/3' } as RouterStateSnapshot;
  const route = (roles?: string[]) => ({ data: roles ? { roles } : {} }) as unknown as ActivatedRouteSnapshot;

  function sessionEnCours(role: string, motDePasseTemporaire = false): void {
    localStorage.setItem('yay360.session', JSON.stringify({
      token: jetonDeTest({ role, exp: expDans(3600) }), id: 1, email: 'x@yay360.sn', nom: 'N', prenom: 'P',
      role, motDePasseTemporaire,
    }));
  }

  function executer(guard: typeof authGuard, r = route()): boolean | UrlTree {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
    return TestBed.runInInjectionContext(() => guard(r, etat)) as boolean | UrlTree;
  }

  const url = (resultat: boolean | UrlTree) =>
    resultat instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultat) : resultat;

  afterEach(() => localStorage.clear());

  it('authGuard redirige vers la connexion en mémorisant la page demandée', () => {
    expect(url(executer(authGuard))).toBe('/connexion?returnUrl=%2Fgrossesses%2F3');
  });

  it('authGuard laisse passer une session valide', () => {
    sessionEnCours('MEDECIN');
    expect(executer(authGuard)).toBe(true);
  });

  it('un mot de passe temporaire bloque l’accès à l’application', () => {
    sessionEnCours('SAGE_FEMME', true);
    expect(url(executer(motDePasseTemporaireGuard))).toBe('/changer-mot-de-passe');
  });

  it('un utilisateur connecté qui ouvre la connexion va à l’accueil', () => {
    sessionEnCours('ADMIN');
    expect(url(executer(inviteGuard))).toBe('/accueil');
  });

  it('roleGuard refuse un rôle non autorisé', () => {
    sessionEnCours('FEMME_ENCEINTE');
    expect(url(executer(roleGuard, route(['ADMIN'])))).toBe('/acces-refuse');
  });

  it('roleGuard autorise un rôle prévu', () => {
    sessionEnCours('MEDECIN');
    expect(executer(roleGuard, route(['MEDECIN', 'SAGE_FEMME']))).toBe(true);
  });
});
