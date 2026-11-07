import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { expDans, jetonDeTest } from '../testing/jeton-de-test';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  function creer(): void {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  }

  function connecter(role = 'MEDECIN', motDePasseTemporaire = false): string {
    const token = jetonDeTest({ sub: 'dr@yay360.sn', role, exp: expDans(3600) });
    service.login({ email: 'dr@yay360.sn', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token, id: 1, email: 'dr@yay360.sn', nom: 'Sarr', prenom: 'Fatou', role, motDePasseTemporaire,
    });
    return token;
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => http.verify());

  it('ouvre une session et lit le rôle dans le jeton', () => {
    creer();
    connecter('SAGE_FEMME');

    expect(service.estConnecte()).toBe(true);
    expect(service.role()).toBe('SAGE_FEMME');
    expect(service.doitChangerMotDePasse()).toBe(false);
  });

  it('signale un mot de passe temporaire à changer', () => {
    creer();
    connecter('MEDECIN', true);

    expect(service.doitChangerMotDePasse()).toBe(true);
  });

  it('remplace le jeton après un changement de mot de passe (l’ancien est révoqué)', () => {
    creer();
    connecter('MEDECIN', true);
    const nouveau = jetonDeTest({ sub: 'dr@yay360.sn', role: 'MEDECIN', exp: expDans(3600), ver: 1 });

    service.changerMotDePasse('Temp1234', 'Nouveau123').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/change-password`).flush({ message: 'ok', token: nouveau });

    expect(service.token).toBe(nouveau);
    expect(service.doitChangerMotDePasse()).toBe(false);
    expect(JSON.parse(localStorage.getItem('yay360.session')!).token).toBe(nouveau);
  });

  it('ignore une session stockée dont le jeton est expiré', () => {
    localStorage.setItem('yay360.session', JSON.stringify({
      token: jetonDeTest({ role: 'ADMIN', exp: expDans(-60) }), id: 1, email: 'a', nom: 'A', prenom: 'B', role: 'ADMIN',
    }));
    creer();

    expect(service.estConnecte()).toBe(false);
    expect(localStorage.getItem('yay360.session')).toBeNull();
  });

  it('le rôle provient du jeton signé, pas du JSON stocké modifiable', () => {
    localStorage.setItem('yay360.session', JSON.stringify({
      token: jetonDeTest({ role: 'FEMME_ENCEINTE', exp: expDans(3600) }),
      id: 1, email: 'a', nom: 'A', prenom: 'B', role: 'ADMIN', // rôle falsifié à la main
    }));
    creer();

    expect(service.role()).toBe('FEMME_ENCEINTE');
  });
});
