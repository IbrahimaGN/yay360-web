import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { GrossesseDetailComponent } from './grossesse-detail.component';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { EvaluationRisqueDto, GrossesseDto } from '../../../core/models/grossesse.model';
import { Role } from '../../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../../core/testing/session-de-test';

/** Données entièrement fictives. */
const GROSSESSE: GrossesseDto = {
  id: 3,
  femmeEnceinteId: 10,
  femmeEnceinteNomComplet: 'Awa Démo',
  dateDernieresRegles: '2026-05-20',
  datePrevueAccouchement: '2027-02-24', debutPeriodeTerme: '2027-02-03', finPeriodeTerme: '2027-03-09',
  ageGestationnelJours: 168,
  semaineActuelle: 24,
  trimestre: 'DEUXIEME',
  joursRestants: 112,
  statut: 'EN_COURS',
  grossesseARisque: false,
  motifRisque: null,
  nombreGrossessesPrecedentes: 1,
  antecedents: null,
  etablissementSuiviId: 1,
  etablissementSuiviNom: 'Centre de santé Démo',
  dateFin: null,
  issue: null,
  dateCreation: '2026-06-01T09:00:00',
};

const EVALUATION: EvaluationRisqueDto = {
  grossesseId: 3,
  grossesseARisque: false,
  facteurs: ['Facteur fictif A', 'Facteur fictif B'],
  suggestionDeclarerARisque: true,
  avertissement: 'Aide à la décision fondée sur des règles. Ce n’est pas un diagnostic.',
};

describe('GrossesseDetailComponent (droits par rôle)', () => {
  let fixture: ComponentFixture<GrossesseDetailComponent>;
  let el: HTMLElement;
  let grossesseService: Record<string, ReturnType<typeof vi.fn>>;
  let consultationService: { parGrossesse: ReturnType<typeof vi.fn> };

  function afficher(role: Role, grossesse: Partial<GrossesseDto> = {}, erreurChargement = false): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    const g = { ...GROSSESSE, ...grossesse };
    grossesseService = {
      obtenirParId: vi.fn(() => erreurChargement
        ? throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Grossesse introuvable.' } }))
        : of(g)),
      obtenirSuivi: vi.fn(() => EMPTY),
      obtenirCalendrier: vi.fn(() => EMPTY),
      planCpn: vi.fn(() => EMPTY),
      evaluationRisque: vi.fn(() => of(EVALUATION)),
      declarerARisque: vi.fn((_id: number, req: { motif: string }) => of({ ...g, grossesseARisque: true, motifRisque: req.motif })),
      retirerRisque: vi.fn(() => of({ ...g, grossesseARisque: false })),
      terminer: vi.fn(() => of({ ...g, statut: 'TERMINEE' })),
      exporterDossierPdf: vi.fn(() => of(new Blob(['%PDF-fictif'], { type: 'application/pdf' }))),
    };
    consultationService = { parGrossesse: vi.fn(() => of([])) };

    TestBed.configureTestingModule({
      imports: [GrossesseDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: GrossesseService, useValue: grossesseService },
        { provide: ConsultationService, useValue: consultationService },
        { provide: RendezVousService, useValue: { listerParGrossesse: vi.fn(() => of([])) } },
      ],
    });
    fixture = TestBed.createComponent(GrossesseDetailComponent);
    fixture.componentRef.setInput('id', '3');
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const boutons = () => Array.from(el.querySelectorAll('button, a.pro-btn')).map((b) => b.textContent!.trim());
  const contientBouton = (texte: string) => boutons().some((b) => b.includes(texte));

  it('le médecin peut déclarer à risque et clôturer la grossesse', () => {
    afficher('MEDECIN');

    expect(contientBouton('Nouvelle consultation')).toBe(true);
    expect(contientBouton('Planifier un rendez-vous')).toBe(true);
    expect(contientBouton('Déclarer à risque')).toBe(true);
    expect(contientBouton('Clôturer la grossesse')).toBe(true);
    expect(el.textContent).not.toContain('réservé au médecin');
  });

  it('la sage-femme ne voit ni « Déclarer à risque » ni « Clôturer » et lit la note', () => {
    afficher('SAGE_FEMME');

    expect(contientBouton('Nouvelle consultation')).toBe(true);
    expect(contientBouton('Planifier un rendez-vous')).toBe(true);
    expect(contientBouton('Déclarer à risque')).toBe(false);
    expect(contientBouton('Clôturer la grossesse')).toBe(false);
    expect(el.querySelector('.actions__note')?.textContent).toContain('réservé au médecin');
    expect(el.querySelector('.suggestion')?.textContent).toContain('Signalez-la au médecin qui suit la patiente.');
  });

  it('pour une grossesse déjà à risque, le médecin peut retirer le statut', () => {
    afficher('MEDECIN', { grossesseARisque: true, motifRisque: 'Motif fictif' });

    expect(contientBouton('Retirer le statut à risque')).toBe(true);
    expect(contientBouton('Déclarer à risque')).toBe(false);
  });

  it('l’administrateur voit une vue de supervision, sans contenu médical', () => {
    afficher('ADMIN');

    expect(el.textContent).toContain('Vue de supervision');
    expect(el.querySelector('#titre-actions')).toBeNull();
    expect(el.querySelector('#titre-eval')).toBeNull();
    expect(consultationService.parGrossesse).not.toHaveBeenCalled();
    expect(grossesseService['evaluationRisque']).not.toHaveBeenCalled();
  });

  it('l’évaluation affiche les facteurs, une suggestion (pas un diagnostic) et l’avertissement', () => {
    afficher('MEDECIN');

    const facteurs = Array.from(el.querySelectorAll('.factors li')).map((li) => li.textContent!.trim());
    expect(facteurs).toEqual(['Facteur fictif A', 'Facteur fictif B']);
    expect(el.querySelector('.suggestion')?.textContent).toContain('La décision revient au médecin');
    expect(el.querySelector('.pro-disclaimer')?.textContent).toContain('Ce n’est pas un diagnostic.');
  });

  it('le médecin déclare à risque avec un motif pré-rempli par les facteurs', () => {
    afficher('MEDECIN');

    const declarer = Array.from(el.querySelectorAll<HTMLButtonElement>('.actions__buttons button'))
      .find((b) => b.textContent!.includes('Déclarer à risque'))!;
    declarer.click();
    fixture.detectChanges();

    const motif = el.querySelector<HTMLTextAreaElement>('#motif')!;
    expect(motif.value).toBe('Facteur fictif A ; Facteur fictif B');

    const confirmer = Array.from(el.querySelectorAll<HTMLButtonElement>('.inline-form button'))
      .find((b) => b.textContent!.includes('Confirmer'))!;
    confirmer.click();
    fixture.detectChanges();

    expect(grossesseService['declarerARisque']).toHaveBeenCalledWith(3, { motif: 'Facteur fictif A ; Facteur fictif B' });
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Grossesse déclarée à risque');
    expect(contientBouton('Retirer le statut à risque')).toBe(true);
  });

  it('le médecin clôture en choisissant une issue précise, sans option « avortement provoqué »', () => {
    afficher('MEDECIN');

    Array.from(el.querySelectorAll<HTMLButtonElement>('.actions__buttons button'))
      .find((b) => b.textContent!.includes('Clôturer la grossesse'))!.click();
    fixture.detectChanges();

    const select = el.querySelector<HTMLSelectElement>('#issueFinale')!;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toEqual(['NAISSANCE_VIVANTE', 'MORT_NE', 'FAUSSE_COUCHE', 'GROSSESSE_EXTRA_UTERINE',
      'MORT_FOETALE_IN_UTERO', 'INTERRUPTION_THERAPEUTIQUE']);
    expect(el.querySelector('.inline-form')?.textContent).toContain('pas par le conjoint');

    select.value = 'FAUSSE_COUCHE';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelector('label[for="dateFin"]')?.textContent).toContain('Date de fin de grossesse');

    Array.from(el.querySelectorAll<HTMLButtonElement>('.inline-form button'))
      .find((b) => b.textContent!.includes('Valider la clôture'))!.click();

    expect(grossesseService['terminer']).toHaveBeenCalledWith(3, expect.objectContaining({ issue: 'FAUSSE_COUCHE' }));
  });

  it('affiche l’issue d’une grossesse close dans l’en-tête', () => {
    afficher('MEDECIN', { statut: 'INTERROMPUE', issue: 'GROSSESSE_EXTRA_UTERINE', dateFin: '2026-08-01' });

    expect(el.querySelector('.hero__sub')?.textContent).toMatch(/Grossesse extra-utérine le 1 \S+ 2026/);
  });

  it('le soignant télécharge le dossier PDF de la patiente', () => {
    afficher('SAGE_FEMME');
    const creer = vi.fn(() => 'blob:fictif');
    const revoquer = vi.fn();
    Object.assign(URL, { createObjectURL: creer, revokeObjectURL: revoquer });
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    Array.from(el.querySelectorAll<HTMLButtonElement>('.actions__buttons button'))
      .find((b) => b.textContent!.includes('Exporter en PDF'))!.click();
    fixture.detectChanges();

    expect(grossesseService['exporterDossierPdf']).toHaveBeenCalledWith(3);
    expect(clic).toHaveBeenCalled();
    expect(revoquer).toHaveBeenCalledWith('blob:fictif');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Dossier PDF téléchargé');
    clic.mockRestore();
  });

  it('affiche un état d’erreur si la grossesse ne peut pas être chargée', () => {
    afficher('MEDECIN', {}, true);

    expect(el.textContent).toContain('Grossesse introuvable.');
    expect(el.querySelector('#titre-actions')).toBeNull();
  });
});
