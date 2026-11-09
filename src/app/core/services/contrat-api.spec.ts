import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { GrossesseService } from './grossesse.service';
import { UtilisateurService } from './utilisateur.service';
import { RendezVousService } from './rendez-vous.service';
import { AlerteService } from './alerte.service';
import { EtablissementService } from './etablissement.service';
import { FamilleService } from './famille.service';
import { NotificationService } from './notification.service';

/**
 * Contrat avec l'API backend : méthode, URL et corps de chaque appel.
 * Un écart ici signifie que le web et le backend ne sont plus alignés.
 */
describe('Contrat d’API (web ↔ backend)', () => {
  let http: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function attendre(methode: string, url: string, corps?: unknown): void {
    const req = http.expectOne((r) => r.urlWithParams === url);
    expect(req.request.method).toBe(methode);
    if (corps !== undefined) {
      expect(req.request.body).toEqual(corps);
    }
    req.flush({});
  }

  it('création d’un professionnel par l’admin (et non /auth/register)', () => {
    const requete = { nom: 'Sarr', prenom: 'Fatou', email: 'f@h.sn', telephone: '+221771234567', dateNaissance: '1985-01-01', role: 'MEDECIN' as const };
    TestBed.inject(UtilisateurService).creerProfessionnel(requete).subscribe();
    attendre('POST', `${api}/utilisateurs/professionnels`, requete);
  });

  it('grossesses : établissement, recherche, rattachement, plan CPN, évaluation, clôture', () => {
    const s = TestBed.inject(GrossesseService);
    s.choisirEtablissement({ etablissementId: 3 }).subscribe();
    attendre('PUT', `${api}/grossesses/ma-grossesse/etablissement`, { etablissementId: 3 });
    s.rechercher({ telephone: '+221771234567' }).subscribe();
    attendre('GET', `${api}/grossesses/recherche?telephone=%2B221771234567`);
    s.rattacher(5, { etablissementId: 3, telephonePatiente: '+221771234567' }).subscribe();
    attendre('PUT', `${api}/grossesses/5/rattacher`, { etablissementId: 3, telephonePatiente: '+221771234567' });
    s.monPlanCpn().subscribe();
    attendre('GET', `${api}/grossesses/mon-plan-cpn`);
    s.planCpn(5).subscribe();
    attendre('GET', `${api}/grossesses/5/plan-cpn`);
    s.evaluationRisque(5).subscribe();
    attendre('GET', `${api}/grossesses/5/evaluation-risque`);
    s.terminer(5, { issue: 'NAISSANCE_VIVANTE', dateFin: '2026-11-01' }).subscribe();
    attendre('PUT', `${api}/grossesses/5/terminer`, { issue: 'NAISSANCE_VIVANTE', dateFin: '2026-11-01' });
  });

  it('rendez-vous : planification par le soignant, report, statut', () => {
    const s = TestBed.inject(RendezVousService);
    s.planifier({ grossesseId: 5, dateHeure: '2027-01-15T10:00:00', type: 'ECHOGRAPHIE' }).subscribe();
    attendre('POST', `${api}/rendez-vous/planifier`, { grossesseId: 5, dateHeure: '2027-01-15T10:00:00', type: 'ECHOGRAPHIE' });
    s.reporter(7, { dateHeure: '2027-01-20T09:00:00' }).subscribe();
    attendre('PUT', `${api}/rendez-vous/7`, { dateHeure: '2027-01-20T09:00:00' });
    s.changerStatut(7, { statut: 'CONFIRME' }).subscribe();
    attendre('PUT', `${api}/rendez-vous/7/statut`, { statut: 'CONFIRME' });
  });

  it('alertes : la résolution transmet les observations obligatoires', () => {
    TestBed.inject(AlerteService).resoudre(9, { notesPriseEnCharge: 'Patiente vue, repos.' }).subscribe();
    attendre('PUT', `${api}/alertes/9/resoudre`, { notesPriseEnCharge: 'Patiente vue, repos.' });
  });

  it('établissements, famille et notifications', () => {
    TestBed.inject(EtablissementService).mesEtablissements().subscribe();
    attendre('GET', `${api}/etablissements/mes-etablissements`);
    TestBed.inject(EtablissementService).listerActifs().subscribe();
    attendre('GET', `${api}/etablissements`);
    TestBed.inject(FamilleService).inviterConjoint('mari@exemple.sn').subscribe();
    attendre('POST', `${api}/famille/inviter-conjoint`, { email: 'mari@exemple.sn' });
    TestBed.inject(NotificationService).compterNonLues().subscribe();
    attendre('GET', `${api}/notifications/non-lues/nombre`);
  });
});
