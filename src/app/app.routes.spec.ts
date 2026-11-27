import { routes } from './app.routes';

describe('Routes', () => {
  it('l’application s’ouvre directement sur la connexion, sans page vitrine', () => {
    const racine = routes.find((r) => r.path === '' && r.pathMatch === 'full');
    expect(racine?.redirectTo).toBe('connexion');
    expect(racine?.loadComponent).toBeUndefined();
  });
});
