import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EtablissementsListeComponent } from './etablissements-liste.component';
import { EtablissementService } from '../../core/services/etablissement.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { EtablissementDto } from '../../core/models/etablissement.model';
import { Role } from '../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

function etablissement(partiel: Partial<EtablissementDto>): EtablissementDto {
  return {
    id: 1, nom: 'Centre de santé Démo', type: 'CENTRE_DE_SANTE', adresse: 'Dakar', ville: 'Dakar',
    telephone: '+221338000000', email: null, latitude: null, longitude: null, actif: true,
    professionnels: ['Mamadou Diallo'], ...partiel,
  };
}

const MON_ETABLISSEMENT = etablissement({ id: 1 });
const AUTRE = etablissement({ id: 2, nom: 'Poste de santé Exemple', professionnels: [] });

describe('EtablissementsListeComponent (deux niveaux d’administration)', () => {
  let fixture: ComponentFixture<EtablissementsListeComponent>;
  let composant: EtablissementsListeComponent;
  let el: HTMLElement;
  let etablissements: Record<string, ReturnType<typeof vi.fn>>;
  let utilisateurs: Record<string, ReturnType<typeof vi.fn>>;

  function afficher(role: Role): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    etablissements = {
      listerTous: vi.fn(() => of([MON_ETABLISSEMENT, AUTRE])),
      monEtablissement: vi.fn(() => of(MON_ETABLISSEMENT)),
      affecterProfessionnel: vi.fn(() => of(MON_ETABLISSEMENT)),
      mettreAJour: vi.fn(() => of(MON_ETABLISSEMENT)),
    };
    utilisateurs = { listerTous: vi.fn(() => of([])) };
    TestBed.configureTestingModule({
      imports: [EtablissementsListeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: EtablissementService, useValue: etablissements },
        { provide: UtilisateurService, useValue: utilisateurs },
      ],
    });
    fixture = TestBed.createComponent(EtablissementsListeComponent);
    composant = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const boutons = () => Array.from(el.querySelectorAll('button')).map((b) => b.textContent!.trim());

  it('l’administrateur de la plateforme gère tous les établissements, sans affecter de soignant', () => {
    afficher('ADMIN');

    expect(etablissements['listerTous']).toHaveBeenCalled();
    expect(etablissements['monEtablissement']).not.toHaveBeenCalled();
    expect(composant.etablissements().length).toBe(2);
    expect(boutons()).toContain('Nouvel établissement');
    expect(boutons()).toContain('Désactiver');
    expect(el.querySelector('.etab__add')).toBeNull();
  });

  it('l’administrateur d’établissement ne voit que le sien, sans création ni suppression', () => {
    afficher('ADMIN_ETABLISSEMENT');

    expect(etablissements['monEtablissement']).toHaveBeenCalled();
    expect(etablissements['listerTous']).not.toHaveBeenCalled();
    expect(el.querySelector('.etab__add')).not.toBeNull();
    expect(el.querySelector('.section-title')?.textContent).toContain('Mon établissement');
    expect(composant.etablissements().map((e) => e.id)).toEqual([1]);
    expect(boutons()).not.toContain('Nouvel établissement');
    expect(boutons()).not.toContain('Désactiver');
    expect(el.querySelector('.etab__delete')).toBeNull();
    expect(el.querySelector('.tools')).toBeNull();
  });

  it('il affecte un soignant déjà inscrit par son e-mail', () => {
    afficher('ADMIN_ETABLISSEMENT');
    composant.affectationOuverte.set(1);
    fixture.detectChanges();

    expect(el.querySelector('#pro-1')?.getAttribute('type')).toBe('email');
    composant.mettreAJourIdProfessionnel(1, ' aissatou@exemple.sn ');
    composant.affecterProfessionnel(MON_ETABLISSEMENT);

    expect(etablissements['affecterProfessionnel']).toHaveBeenCalledWith(1, { email: 'aissatou@exemple.sn' });
  });

  it('une saisie vide n’envoie rien', () => {
    afficher('ADMIN_ETABLISSEMENT');

    composant.mettreAJourIdProfessionnel(1, '   ');
    composant.affecterProfessionnel(MON_ETABLISSEMENT);

    expect(etablissements['affecterProfessionnel']).not.toHaveBeenCalled();
  });
});
