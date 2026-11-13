import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { environment } from '../../../../environments/environment';
import { expDans, jetonDeTest } from '../../../core/testing/jeton-de-test';

/** Après connexion, retour à la page demandée seulement si c'est un chemin interne (pas de redirection ouverte). */
describe('LoginComponent : retour après connexion', () => {
  afterEach(() => localStorage.clear());

  function seConnecterAvec(returnUrl: string | null): ReturnType<typeof vi.fn> {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(returnUrl === null ? {} : { returnUrl }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({ email: 'awa.demo@exemple.sn', password: 'Secret@2026' });
    fixture.componentInstance.soumettre();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: jetonDeTest({ sub: 'awa.demo@exemple.sn', role: 'FEMME_ENCEINTE', exp: expDans(3600) }),
      id: 1, email: 'awa.demo@exemple.sn', nom: 'Démo', prenom: 'Awa', role: 'FEMME_ENCEINTE', motDePasseTemporaire: false,
    });
    return navigation as unknown as ReturnType<typeof vi.fn>;
  }

  it('revient à la page interne demandée', () => {
    expect(seConnecterAvec('/grossesses/7')).toHaveBeenCalledWith('/grossesses/7');
  });

  it('refuse une adresse externe ou protocolaire et renvoie vers l’accueil', () => {
    expect(seConnecterAvec('//site-malveillant.example')).toHaveBeenCalledWith('/accueil');
  });

  it('refuse une adresse qui ne commence pas par « / »', () => {
    expect(seConnecterAvec('https://site-malveillant.example')).toHaveBeenCalledWith('/accueil');
  });
});
