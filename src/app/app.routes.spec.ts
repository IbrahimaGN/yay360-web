import { Route } from '@angular/router';
import { routes } from './app.routes';

/** Rôles autorisés par chaque écran de l'espace connecté (garde roleGuard). */
function roles(chemin: string): string[] {
  const espace = routes.find((r) => r.path === '' && r.children) as Route;
  const route = espace.children!.find((r) => r.path === chemin);
  return (route?.data?.['roles'] as string[]) ?? [];
}

describe('Routes : rôles autorisés par écran', () => {
  it.each(['grossesses', 'rendez-vous', 'alertes', 'consultations'])('%s est réservé aux soignants', (chemin) => {
    expect(roles(chemin)).toEqual(['MEDECIN', 'SAGE_FEMME']);
  });

  it.each(['etablissements', 'utilisateurs'])('%s est ouvert aux deux niveaux d’administration', (chemin) => {
    expect(roles(chemin)).toEqual(['ADMIN', 'ADMIN_ETABLISSEMENT']);
  });

  it('le tableau de bord est ouvert aux deux niveaux d’administration', () => {
    expect(roles('tableau-de-bord')).toEqual(['ADMIN', 'ADMIN_ETABLISSEMENT']);
  });

  it('les conseils et étapes sont réservés aux administrateurs d’établissement et aux soignants', () => {
    expect(roles('conseils')).toEqual(['ADMIN_ETABLISSEMENT', 'MEDECIN', 'SAGE_FEMME']);
  });
});
