import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { environment } from '../../../../environments/environment';
import { expDans, jetonDeTest } from '../../../core/testing/jeton-de-test';

describe('LoginComponent (page de connexion)', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;
  const urlLogin = `${environment.apiUrl}/auth/login`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function saisir(id: string, valeur: string): void {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
  }

  function soumettre(): void {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  const bouton = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!;

  it('affiche les erreurs des champs obligatoires sans appeler l’API', () => {
    soumettre();

    expect(el.querySelector('#email-erreur')?.textContent).toContain('adresse e-mail valide');
    expect(el.querySelector('#password-erreur')?.textContent).toContain('mot de passe');
    expect(el.querySelector('#email')?.getAttribute('aria-invalid')).toBe('true');
    http.expectNone(urlLogin);
  });

  it('refuse une adresse e-mail mal formée', () => {
    saisir('email', 'pas-un-email');
    saisir('password', 'Secret@2026');
    soumettre();

    expect(el.querySelector('#email-erreur')).not.toBeNull();
    expect(el.querySelector('#password-erreur')).toBeNull();
    http.expectNone(urlLogin);
  });

  it('désactive le bouton pendant l’envoi puis redirige vers l’accueil', () => {
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    saisir('email', 'awa.demo@exemple.sn');
    saisir('password', 'Secret@2026');
    soumettre();

    expect(bouton().disabled).toBe(true);
    expect(bouton().textContent).toContain('Connexion…');

    const requete = http.expectOne(urlLogin);
    expect(requete.request.body).toEqual({ email: 'awa.demo@exemple.sn', password: 'Secret@2026' });
    requete.flush({
      token: jetonDeTest({ sub: 'awa.demo@exemple.sn', role: 'FEMME_ENCEINTE', exp: expDans(3600) }),
      id: 1, email: 'awa.demo@exemple.sn', nom: 'Démo', prenom: 'Awa', role: 'FEMME_ENCEINTE', motDePasseTemporaire: false,
    });
    fixture.detectChanges();

    expect(bouton().disabled).toBe(false);
    expect(navigation).toHaveBeenCalledWith('/accueil');
  });

  it('affiche le message d’erreur renvoyé par l’API', () => {
    saisir('email', 'awa.demo@exemple.sn');
    saisir('password', 'mauvais');
    soumettre();

    http.expectOne(urlLogin).flush(
      { message: 'Email ou mot de passe incorrect.' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    const alerte = el.querySelector('[role="alert"]');
    expect(alerte?.textContent).toContain('Email ou mot de passe incorrect.');
    expect(bouton().disabled).toBe(false);
  });

  it('signale un serveur injoignable', () => {
    saisir('email', 'awa.demo@exemple.sn');
    saisir('password', 'Secret@2026');
    soumettre();

    http.expectOne(urlLogin).error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Serveur injoignable');
  });

  it('envoie vers le changement de mot de passe si le mot de passe est temporaire', () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    saisir('email', 'sf.demo@exemple.sn');
    saisir('password', 'Temp@2026');
    soumettre();

    http.expectOne(urlLogin).flush({
      token: jetonDeTest({ sub: 'sf.demo@exemple.sn', role: 'SAGE_FEMME', exp: expDans(3600) }),
      id: 2, email: 'sf.demo@exemple.sn', nom: 'Démo', prenom: 'Fatou', role: 'SAGE_FEMME', motDePasseTemporaire: true,
    });

    expect(navigation).toHaveBeenCalledWith(['/changer-mot-de-passe']);
  });

  it('permet d’afficher et de masquer le mot de passe', () => {
    const oeil = el.querySelector<HTMLButtonElement>('.pwd button')!;
    expect(el.querySelector('#password')?.getAttribute('type')).toBe('password');

    oeil.click();
    fixture.detectChanges();

    expect(el.querySelector('#password')?.getAttribute('type')).toBe('text');
    expect(oeil.getAttribute('aria-pressed')).toBe('true');
    expect(oeil.getAttribute('aria-label')).toBe('Masquer le mot de passe');
  });
});
