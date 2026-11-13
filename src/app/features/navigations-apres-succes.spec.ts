import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { GrossesseService } from '../core/services/grossesse.service';
import { EtablissementService } from '../core/services/etablissement.service';
import { ChangerMotDePasseComponent } from './auth/changer-mot-de-passe/changer-mot-de-passe.component';
import { RegisterComponent } from './auth/register/register.component';
import { AccepterInvitationComponent } from './famille/accepter-invitation/accepter-invitation.component';
import { RecherchePatienteComponent } from './grossesses/recherche/recherche-patiente.component';

/** Après une action réussie, chaque écran redirige vers la bonne page (données fictives). */
describe('Redirections après une action réussie', () => {
  let navigate: ReturnType<typeof vi.fn>;
  const authService = {
    changerMotDePasse: vi.fn(() => of(void 0)),
    inscrire: vi.fn(() => of(void 0)),
    accepterInvitationConjoint: vi.fn(() => of(void 0)),
    logout: vi.fn(),
    marquerMotDePasseTemporaire: vi.fn(),
  };
  const grossesseService = {
    rattacher: vi.fn(() => of({ id: 42 })),
    rechercher: vi.fn(() => of([])),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: GrossesseService, useValue: grossesseService },
        { provide: EtablissementService, useValue: { mesEtablissements: () => of([{ id: 3, nom: 'Centre de santé fictif' }]) } },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) as unknown as ReturnType<typeof vi.fn>;
  });

  const identite = {
    prenom: 'Awa',
    nom: 'Diop',
    email: 'awa.diop@exemple.sn',
    telephone: '+221771234567',
    dateNaissance: '1995-04-12',
  };

  it('changement du mot de passe temporaire : vers l’accueil ; déconnexion : vers la connexion', () => {
    const ecran = TestBed.createComponent(ChangerMotDePasseComponent).componentInstance;
    ecran.form.setValue({ ancienMotDePasse: 'Temporaire1', nouveauMotDePasse: 'Nouveau2026', confirmation: 'Nouveau2026' });

    ecran.soumettre();
    expect(navigate).toHaveBeenCalledWith(['/accueil']);

    ecran.seDeconnecter();
    expect(authService.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/connexion']);
  });

  it('inscription réussie : vers l’accueil', () => {
    const ecran = TestBed.createComponent(RegisterComponent).componentInstance;
    ecran.form.setValue({ ...identite, password: 'Secret2026', confirmation: 'Secret2026' });

    ecran.soumettre();

    expect(navigate).toHaveBeenCalledWith(['/accueil']);
  });

  it('invitation du conjoint acceptée : vers l’accueil', () => {
    const ecran = TestBed.createComponent(AccepterInvitationComponent).componentInstance;
    ecran.form.setValue({ ...identite, prenom: 'Moussa', token: 'jeton-fictif', password: 'Secret2026' });

    ecran.soumettre();

    expect(navigate).toHaveBeenCalledWith(['/accueil']);
  });

  it('patiente déjà suivie : ouverture directe ; rattachement réussi : vers la grossesse', () => {
    const ecran = TestBed.createComponent(RecherchePatienteComponent).componentInstance;

    ecran.choisir({ grossesseId: 7, dejaSuivie: true } as never);
    expect(navigate).toHaveBeenCalledWith(['/grossesses', 7]);

    ecran.choisir({ grossesseId: 8, dejaSuivie: false } as never);
    ecran.formRattacher.patchValue({ etablissementId: 3, telephonePatiente: '+221771234567' });
    ecran.rattacher();
    expect(navigate).toHaveBeenCalledWith(['/grossesses', 42]);
  });
});
