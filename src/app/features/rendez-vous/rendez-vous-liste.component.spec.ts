import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RendezVousListeComponent } from './rendez-vous-liste.component';
import { RendezVousService } from '../../core/services/rendez-vous.service';
import { RendezVousDto } from '../../core/models/rendez-vous.model';
import { Role } from '../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

/** Date locale « aaaa-mm-jjThh:mm:00 » à `jours` jours d'aujourd'hui. */
function dansJours(jours: number, heure: number): string {
  const d = new Date();
  d.setDate(d.getDate() + jours);
  d.setHours(heure, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00:00`;
}

/** Rendez-vous fictifs. */
function rdv(partiel: Partial<RendezVousDto>): RendezVousDto {
  return {
    id: 1, grossesseId: 3, femmeEnceinteId: 10, femmeEnceinteNomComplet: 'Awa Démo',
    professionnelId: 2, professionnelNomComplet: 'Fatou Soignante', etablissementId: 1, etablissementNom: 'Centre de santé Démo',
    dateHeure: dansJours(1, 10), type: 'CONSULTATION_PRENATALE', statut: 'PLANIFIE', motif: null, notesAnnulation: null,
    dateCreation: '2026-10-01T09:00:00', ...partiel,
  };
}

const RENDEZ_VOUS: RendezVousDto[] = [
  rdv({ id: 1, femmeEnceinteNomComplet: 'Awa Démo', dateHeure: dansJours(1, 10), type: 'CONSULTATION_PRENATALE' }),
  rdv({ id: 2, femmeEnceinteNomComplet: 'Fatou Exemple', dateHeure: dansJours(2, 14), type: 'ECHOGRAPHIE', statut: 'CONFIRME' }),
  // Passé et encore ouvert : à clôturer
  rdv({ id: 3, femmeEnceinteNomComplet: 'Mariama Test', dateHeure: dansJours(-1, 9), type: 'CONSULTATION_PRENATALE', statut: 'CONFIRME' }),
];

describe('RendezVousListeComponent (planning et filtres)', () => {
  let fixture: ComponentFixture<RendezVousListeComponent>;
  let el: HTMLElement;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  function afficher(role: Role, liste: () => ReturnType<RendezVousService['monPlanning']> = () => of(RENDEZ_VOUS)): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    service = {
      monPlanning: vi.fn(liste),
      listerParStatut: vi.fn(liste),
    };
    TestBed.configureTestingModule({
      imports: [RendezVousListeComponent],
      providers: [provideRouter([]), provideHttpClient(), { provide: RendezVousService, useValue: service }],
    });
    fixture = TestBed.createComponent(RendezVousListeComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const noms = () => Array.from(el.querySelectorAll('.item__name')).map((a) => a.textContent!.trim());
  const rafraichir = () => fixture.detectChanges();
  const onglets = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

  it('le soignant arrive sur « Mon planning » avec la bande des 7 prochains jours', () => {
    afficher('SAGE_FEMME');

    expect(service['monPlanning']).toHaveBeenCalled();
    expect(onglets()[0].textContent).toContain('Mon planning');
    expect(onglets()[0].getAttribute('aria-selected')).toBe('true');
    expect(el.querySelector('.rdv__head .pro-btn')?.textContent).toContain('Nouveau rendez-vous');
    expect(el.querySelectorAll('.day-btn').length).toBe(7);
  });

  it('l’administrateur a une vue de supervision sans planning ni création', () => {
    afficher('ADMIN');

    expect(service['listerParStatut']).toHaveBeenCalledWith('PLANIFIE');
    expect(onglets().some((o) => o.textContent!.includes('Mon planning'))).toBe(false);
    expect(el.querySelector('.rdv__head .pro-btn')).toBeNull();
    expect(el.querySelector('.filters__week')).toBeNull();
    expect(el.textContent).toContain('Vue de supervision');
  });

  it('regroupe les rendez-vous par jour, dans l’ordre chronologique', () => {
    afficher('MEDECIN');

    expect(el.querySelectorAll('section.day').length).toBe(3);
    expect(noms()).toEqual(['Mariama Test', 'Awa Démo', 'Fatou Exemple']);
  });

  it('filtre par type et affiche le compteur « x sur y »', () => {
    afficher('MEDECIN');

    const select = el.querySelector<HTMLSelectElement>('.tools__type select')!;
    select.value = 'ECHOGRAPHIE';
    select.dispatchEvent(new Event('change'));
    rafraichir();

    expect(noms()).toEqual(['Fatou Exemple']);
    expect(el.querySelector('.filters__count')?.textContent).toContain('1 sur 3');

    el.querySelector<HTMLButtonElement>('.filters__reset')!.click();
    rafraichir();
    expect(noms().length).toBe(3);
    expect(el.querySelector('.filters__count')).toBeNull();
  });

  it('recherche par nom de patiente', () => {
    afficher('MEDECIN');

    const recherche = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    recherche.value = 'awa';
    recherche.dispatchEvent(new Event('input'));
    rafraichir();

    expect(noms()).toEqual(['Awa Démo']);
  });

  it('la bande des jours compte les rendez-vous et filtre sur le jour choisi', () => {
    afficher('SAGE_FEMME');

    const demain = el.querySelectorAll<HTMLButtonElement>('.day-btn')[1];
    expect(demain.querySelector('.day-btn__count')?.textContent).toBe('1');

    demain.click();
    rafraichir();

    expect(demain.getAttribute('aria-pressed')).toBe('true');
    expect(noms()).toEqual(['Awa Démo']);
  });

  it('signale les rendez-vous passés encore ouverts et permet de n’afficher qu’eux', () => {
    afficher('SAGE_FEMME');

    const avis = el.querySelector('.cloture')!;
    expect(avis.textContent).toContain('1 rendez-vous passé encore ouvert');

    avis.querySelector<HTMLButtonElement>('button')!.click();
    rafraichir();

    expect(noms()).toEqual(['Mariama Test']);
  });

  it('change de liste quand on choisit un autre onglet', () => {
    afficher('MEDECIN');

    onglets().find((o) => o.textContent!.includes('Terminés'))!.click();
    rafraichir();

    expect(service['listerParStatut']).toHaveBeenCalledWith('TERMINE');
  });

  it('affiche un état vide quand il n’y a aucun rendez-vous', () => {
    afficher('MEDECIN', () => of([]));

    expect(el.textContent).toContain('Aucun rendez-vous dans cette catégorie.');
  });

  it('affiche l’erreur de l’API si le chargement échoue', () => {
    afficher('MEDECIN', () => throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'Accès refusé.' } })));

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Accès refusé.');
  });
});
