import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { SuiviPrenatalComponent } from './suivi-prenatal.component';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AlerteService } from '../../../core/services/alerte.service';
import { EtablissementService } from '../../../core/services/etablissement.service';
import { AlerteDto } from '../../../core/models/alerte.model';
import { GrossesseDto } from '../../../core/models/grossesse.model';
import { Role } from '../../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../../core/testing/session-de-test';
import { TYPES_SYMPTOME } from '../../../core/utils/libelles';

/** Données entièrement fictives. */
const GROSSESSE = {
  id: 3, femmeEnceinteId: 10, femmeEnceinteNomComplet: 'Awa Démo',
  dateDernieresRegles: '2026-05-20', datePrevueAccouchement: '2027-02-24', ageGestationnelJours: 168,
  semaineActuelle: 24, trimestre: 'DEUXIEME', joursRestants: 112, statut: 'EN_COURS', grossesseARisque: false,
  motifRisque: null, nombreGrossessesPrecedentes: 0, antecedents: null,
  etablissementSuiviId: 1, etablissementSuiviNom: 'Centre de santé Démo', dateFin: null, dateCreation: '2026-06-01T09:00:00',
} as GrossesseDto;

function reponseTriage(niveau: AlerteDto['niveauGravite']): AlerteDto {
  return {
    id: 50, grossesseId: 3, femmeEnceinteId: 10, femmeEnceinteNomComplet: 'Awa Démo', femmeEnceinteTelephone: null,
    typeSymptome: 'SAIGNEMENTS', description: null, niveauGravite: niveau, statut: 'NOUVELLE',
    professionnelNomComplet: null, notesPriseEnCharge: null, dateDeclaration: '2026-11-06T10:00:00', dateResolution: null,
    recommandation: 'Consigne fictive renvoyée par les règles.',
    avertissement: 'Ce classement ne remplace pas l’avis d’un professionnel de santé.',
    origine: 'PATIENTE', justificationTriage: ['Règle fictive appliquée'],
  };
}

describe('SuiviPrenatalComponent (patiente et conjoint)', () => {
  let fixture: ComponentFixture<SuiviPrenatalComponent>;
  let el: HTMLElement;
  let alerteService: { mesAlertes: ReturnType<typeof vi.fn>; declarer: ReturnType<typeof vi.fn> };

  function afficher(
    role: Role,
    options: { grossesses?: GrossesseDto[]; action?: string; triage?: () => ReturnType<AlerteService['declarer']> } = {},
  ): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    alerteService = {
      mesAlertes: vi.fn(() => of([])),
      declarer: vi.fn(options.triage ?? (() => of(reponseTriage('URGENT')))),
    };
    TestBed.configureTestingModule({
      imports: [SuiviPrenatalComponent],
      providers: [
        provideRouter([]),
        {
          provide: GrossesseService,
          useValue: {
            obtenirMonHistorique: vi.fn(() => of(options.grossesses ?? [GROSSESSE])),
            obtenirMonCalendrier: vi.fn(() => EMPTY),
            monPlanCpn: vi.fn(() => EMPTY),
            obtenirMonSuivi: vi.fn(() => EMPTY),
          },
        },
        { provide: RendezVousService, useValue: { mesRendezVous: vi.fn(() => of([])) } },
        { provide: ConsultationService, useValue: { mesConsultations: vi.fn(() => of([])) } },
        { provide: AlerteService, useValue: alerteService },
        { provide: EtablissementService, useValue: { listerActifs: vi.fn(() => of([{ id: 1, nom: 'Centre de santé Démo', ville: 'Dakar' }])) } },
      ],
    });
    fixture = TestBed.createComponent(SuiviPrenatalComponent);
    if (options.action) fixture.componentRef.setInput('action', options.action);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const bouton = (texte: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent!.includes(texte));

  function ouvrirSignalement(): void {
    bouton('Signaler un symptôme')!.click();
    fixture.detectChanges();
  }

  function choisirSymptome(valeur: string): void {
    // Les cases suivent l'ordre de TYPES_SYMPTOME (la valeur n'est pas reportée dans le DOM)
    const index = TYPES_SYMPTOME.findIndex((t) => t.valeur === valeur);
    el.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index].click();
  }

  function transmettre(): void {
    el.querySelector('.pro-modal form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('la patiente peut choisir son établissement de suivi', () => {
    afficher('FEMME_ENCEINTE');

    expect(el.querySelector('.section-title')?.textContent).toContain('Mon suivi prénatal');
    expect(el.querySelector('#etab-choix')).not.toBeNull();
    expect(bouton('Signaler un symptôme')).toBeDefined();
    expect(bouton('Demander un rendez-vous')).toBeDefined();
  });

  it('le conjoint suit la grossesse mais ne choisit pas l’établissement', () => {
    afficher('CONJOINT');

    expect(el.querySelector('.section-title')?.textContent).toContain('Suivi prénatal');
    expect(el.querySelector('#etab-choix')).toBeNull();
    expect(el.textContent).toContain('Centre de santé Démo');
    expect(bouton('Signaler un symptôme')).toBeDefined();
  });

  it('sans grossesse en cours, le conjoint attend la déclaration de la future maman', () => {
    afficher('CONJOINT', { grossesses: [] });

    expect(el.textContent).toContain('En attente de la déclaration');
    expect(el.querySelector('#titre-declarer')).toBeNull();
  });

  it('sans grossesse en cours, la patiente voit le formulaire de déclaration', () => {
    afficher('FEMME_ENCEINTE', { grossesses: [] });

    expect(el.querySelector('#titre-declarer')?.textContent).toContain('Déclarer ma grossesse');
  });

  it('refuse un signalement sans symptôme choisi', () => {
    afficher('FEMME_ENCEINTE');
    ouvrirSignalement();

    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
    transmettre();

    expect(el.textContent).toContain('Choisissez un symptôme.');
    expect(alerteService.declarer).not.toHaveBeenCalled();
  });

  it('transmet le symptôme et affiche la consigne d’urgence renvoyée par les règles', () => {
    afficher('FEMME_ENCEINTE');
    ouvrirSignalement();
    choisirSymptome('SAIGNEMENTS');
    transmettre();

    expect(alerteService.declarer).toHaveBeenCalledWith({ grossesseId: 3, typeSymptome: 'SAIGNEMENTS', description: undefined });
    expect(el.querySelector('[role="dialog"]')).toBeNull();

    const consigne = el.querySelector('.consigne')!;
    expect(consigne.classList).toContain('consigne--urgente');
    expect(consigne.getAttribute('role')).toBe('alert');
    expect(consigne.textContent).toContain('Urgence : Consigne fictive renvoyée par les règles.');
    expect(consigne.textContent).toContain('Règle fictive appliquée');
    expect(consigne.textContent).toContain('ne remplace pas l’avis d’un professionnel de santé');
  });

  it('pour un niveau non urgent, confirme la transmission sans afficher d’urgence', () => {
    afficher('CONJOINT', { triage: () => of(reponseTriage('MODERE')) });
    ouvrirSignalement();
    choisirSymptome('AUTRE');
    transmettre();

    const consigne = el.querySelector('.consigne')!;
    expect(consigne.classList).not.toContain('consigne--urgente');
    expect(consigne.textContent).toContain('Signalement transmis');
    expect(consigne.textContent).not.toContain('Urgence :');
  });

  it('en cas d’échec, rappelle de se rendre dans un établissement de santé', () => {
    afficher('FEMME_ENCEINTE', { triage: () => throwError(() => new HttpErrorResponse({ status: 500, error: {} })) });
    ouvrirSignalement();
    choisirSymptome('FIEVRE_ELEVEE');
    transmettre();

    expect(el.querySelector('.pro-notice--error')?.textContent)
      .toContain('En cas d’urgence, rendez-vous immédiatement dans un établissement de santé.');
  });

  it('s’ouvre directement sur le signalement depuis l’accueil (?action=alerte)', () => {
    afficher('FEMME_ENCEINTE', { action: 'alerte' });

    expect(el.querySelector('#modal-title-alerte')?.textContent).toContain('Signaler un symptôme');
    expect(el.querySelector('.sp__urg')?.textContent).toContain('En cas d’urgence');
  });
});
