import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { expDans, jetonDeTest } from '../testing/jeton-de-test';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };
  const token = jetonDeTest({ role: 'MEDECIN', exp: expDans(3600) });

  beforeEach(() => {
    localStorage.setItem('yay360.session', JSON.stringify({
      token, id: 1, email: 'dr@yay360.sn', nom: 'Sarr', prenom: 'Fatou', role: 'MEDECIN', motDePasseTemporaire: false,
    }));
    router = { url: '/grossesses', navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('ajoute le jeton aux appels de l’API', () => {
    http.get(`${environment.apiUrl}/grossesses`).subscribe();
    expect(backend.expectOne(`${environment.apiUrl}/grossesses`).request.headers.get('Authorization')).toBe(`Bearer ${token}`);
  });

  it('n’envoie jamais le jeton à un domaine tiers', () => {
    http.get('https://fonts.googleapis.com/css').subscribe();
    expect(backend.expectOne('https://fonts.googleapis.com/css').request.headers.has('Authorization')).toBe(false);
  });

  it('un 401 sur une ressource ferme la session et mémorise la page', () => {
    http.get(`${environment.apiUrl}/grossesses`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/grossesses`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estConnecte()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/connexion'], { queryParams: { returnUrl: '/grossesses', expiree: 1 } });
  });

  it('un 401 sur /auth (ancien mot de passe faux) ne déconnecte pas', () => {
    http.put(`${environment.apiUrl}/auth/change-password`, {}).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/auth/change-password`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.estConnecte()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('un 403 « Mot de passe temporaire » redirige vers le changement de mot de passe', () => {
    http.get(`${environment.apiUrl}/grossesses`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/grossesses`).flush(
      { status: 403, erreur: 'Mot de passe temporaire', message: 'Changez votre mot de passe' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(auth.doitChangerMotDePasse()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/changer-mot-de-passe']);
  });

  it('un 403 ordinaire ne redirige pas', () => {
    http.get(`${environment.apiUrl}/grossesses/2`).subscribe({ error: () => undefined });
    backend.expectOne(`${environment.apiUrl}/grossesses/2`).flush(
      { status: 403, erreur: 'Opération non autorisée', message: 'Vous ne suivez pas cette patiente' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.estConnecte()).toBe(true);
  });
});
