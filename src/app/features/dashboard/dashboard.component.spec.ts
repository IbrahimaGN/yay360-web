import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/dashboard.model';
import { Role } from '../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

/** Indicateurs fictifs : des nombres agrégés, aucune donnée nominative. */
const INDICATEURS = {
  nombreFemmesEnceintes: 4, nombreMedecins: 1, nombreSagesFemmes: 2, nombreAdmins: 1,
  nombreGrossessesActives: 4, nombreGrossessesTerminees: 1, nombreGrossessesInterrompues: 0,
  nombreGrossessesARisque: 1, ratioGrossessesARisque: 25,
  repartitionGrossessesParTrimestre: { T1: 1, T2: 2, T3: 1 },
  nombreConsultations: 9, nombreRendezVous: 3,
  repartitionRendezVousParStatut: { PLANIFIE: 3, CONFIRME: 0, TERMINE: 0, ANNULE: 0, ABSENT: 0 },
  nombreAlertesNouvelles: 1, nombreAlertesPrisesEnCharge: 0, nombreAlertesResolues: 1, nombreAlertesUrgentes: 1,
  repartitionAlertesNonResoluesParGravite: { URGENT: 1, ELEVE: 0, MODERE: 0 },
  tauxResolutionAlertes: 50, delaiMoyenPriseEnChargeMinutes: 12,
  nombreEtablissementsActifs: 1,
  activiteEtablissements: [{ etablissementId: 1, nom: 'Centre de santé Démo', ville: 'Dakar', nombreRendezVous: 3 }],
  dateGeneration: '2026-11-27T20:00:00',
} as unknown as DashboardDto;

describe('DashboardComponent (indicateurs des administrateurs)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let el: HTMLElement;

  function afficher(role: Role): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(),
        { provide: DashboardService, useValue: { obtenir: vi.fn(() => of(INDICATEURS)) } }],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  it('le tableau de bord ne renvoie vers aucun écran de suivi des patientes', () => {
    afficher('ADMIN');

    expect(el.querySelector('.section-title')?.textContent).toContain('Indicateurs de la plateforme');
    expect(el.textContent).not.toContain('Suivi des grossesses');
    expect(el.querySelector('a[href*="grossesses"], a[href*="rendez-vous"], a[href*="alertes"]')).toBeNull();
  });

  it('l’administrateur d’établissement voit les indicateurs de son établissement', () => {
    afficher('ADMIN_ETABLISSEMENT');

    expect(el.querySelector('.section-title')?.textContent).toContain('Indicateurs de mon établissement');
    expect(el.textContent).toContain('Centre de santé Démo');
  });
});
