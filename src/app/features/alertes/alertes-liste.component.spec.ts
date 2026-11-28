import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlertesListeComponent } from './alertes-liste.component';
import { AlerteService } from '../../core/services/alerte.service';
import { AlerteDto } from '../../core/models/alerte.model';
import { Role } from '../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

/** Alertes fictives : textes de démonstration, aucune donnée médicale réelle. */
function alerte(partiel: Partial<AlerteDto>): AlerteDto {
  return {
    id: 1,
    grossesseId: 3,
    femmeEnceinteId: 10,
    femmeEnceinteNomComplet: 'Awa Démo',
    femmeEnceinteTelephone: null,
    typeSymptome: 'AUTRE',
    description: null,
    niveauGravite: 'MODERE',
    statut: 'NOUVELLE',
    professionnelNomComplet: null, resoluParNomComplet: null,
    notesPriseEnCharge: null,
    dateDeclaration: '2026-11-06T08:00:00',
    dateResolution: null,
    recommandation: 'Recommandation fictive des règles.',
    avertissement: 'Classement par règles : ce n’est pas un diagnostic.',
    origine: 'PATIENTE',
    justificationTriage: [],
    ...partiel,
  };
}

const ALERTES: AlerteDto[] = [
  alerte({ id: 1, femmeEnceinteNomComplet: 'Awa Démo', typeSymptome: 'AUTRE', niveauGravite: 'MODERE', dateDeclaration: '2026-11-06T10:00:00' }),
  alerte({
    id: 2, femmeEnceinteNomComplet: 'Fatou Exemple', typeSymptome: 'SAIGNEMENTS', niveauGravite: 'URGENT',
    dateDeclaration: '2026-11-05T10:00:00', justificationTriage: ['Règle fictive n° 1 appliquée', 'Règle fictive n° 2 appliquée'],
  }),
  alerte({ id: 3, femmeEnceinteNomComplet: 'Mariama Test', typeSymptome: 'CONSTANTES_ANORMALES', niveauGravite: 'ELEVE', origine: 'ANALYSE_AUTOMATIQUE' }),
];

describe('AlertesListeComponent (alertes)', () => {
  let fixture: ComponentFixture<AlertesListeComponent>;
  let el: HTMLElement;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  function afficher(role: Role, reponse: () => ReturnType<AlerteService['listerParStatut']> = () => of(ALERTES)): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    service = {
      listerParStatut: vi.fn(reponse),
      listerUrgentes: vi.fn(() => of([ALERTES[1]])),
      prendreEnCharge: vi.fn(() => of(ALERTES[0])),
      resoudre: vi.fn(() => of(ALERTES[0])),
    };
    TestBed.configureTestingModule({
      imports: [AlertesListeComponent],
      providers: [provideRouter([]), { provide: AlerteService, useValue: service }],
    });
    fixture = TestBed.createComponent(AlertesListeComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const titres = () => Array.from(el.querySelectorAll('.alert h3')).map((h) => h.textContent!.trim());
  const rafraichir = () => fixture.detectChanges();

  it('trie les alertes par gravité : urgente, élevée, modérée', () => {
    afficher('SAGE_FEMME');

    expect(service['listerParStatut']).toHaveBeenCalledWith('NOUVELLE');
    expect(titres()).toEqual(['Saignements', 'Constantes anormales (consultation)', 'Autre symptôme']);
  });

  it('explique le niveau de gravité par les règles appliquées', () => {
    afficher('SAGE_FEMME');

    const pourquoi = el.querySelector<HTMLButtonElement>('.alert__why')!;
    expect(pourquoi.textContent).toContain('Pourquoi le niveau « Urgent » ?');
    expect(pourquoi.getAttribute('aria-expanded')).toBe('false');

    pourquoi.click();
    rafraichir();

    expect(pourquoi.getAttribute('aria-expanded')).toBe('true');
    const regles = Array.from(el.querySelectorAll('.alert__rules li')).map((li) => li.textContent!.trim());
    expect(regles).toEqual(['Règle fictive n° 1 appliquée', 'Règle fictive n° 2 appliquée']);
  });

  it('distingue le soignant qui a pris en charge de celui qui a résolu', () => {
    afficher('MEDECIN', () => of([alerte({
      id: 7, statut: 'RESOLUE', professionnelNomComplet: 'Soignante Fictive', resoluParNomComplet: 'Médecin Fictif',
      dateResolution: '2026-11-06T12:00:00', notesPriseEnCharge: 'Observations fictives.',
    })]));

    const etapes = Array.from(el.querySelectorAll('.steps li')).map((li) => li.textContent!.trim());
    expect(etapes[1]).toContain('Prise en charge · Soignante Fictive');
    expect(etapes[2]).toContain('Résolue · Médecin Fictif');
  });

  it('rappelle sur chaque alerte que le classement n’est pas un diagnostic', () => {
    afficher('SAGE_FEMME');

    const avertissements = el.querySelectorAll('.alert .pro-disclaimer');
    expect(avertissements.length).toBe(3);
    expect(avertissements[0].textContent).toContain('ce n’est pas un diagnostic');
  });

  it('filtre par gravité et propose d’effacer les filtres', () => {
    afficher('SAGE_FEMME');

    const puce = Array.from(el.querySelectorAll<HTMLButtonElement>('.chip')).find((c) => c.dataset['g'] === 'URGENT')!;
    expect(puce.querySelector('.chip__count')?.textContent).toBe('1');
    puce.click();
    rafraichir();

    expect(titres()).toEqual(['Saignements']);
    expect(el.querySelector('.filters__count')?.textContent).toContain('1 sur 3');

    el.querySelector<HTMLButtonElement>('.filters__reset')!.click();
    rafraichir();
    expect(titres().length).toBe(3);
    expect(el.querySelector('.filters__count')).toBeNull();
  });

  it('recherche par nom de patiente et filtre par origine', () => {
    afficher('SAGE_FEMME');

    const recherche = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    recherche.value = 'fatou';
    recherche.dispatchEvent(new Event('input'));
    rafraichir();
    expect(titres()).toEqual(['Saignements']);

    recherche.value = '';
    recherche.dispatchEvent(new Event('input'));
    const origine = el.querySelector<HTMLSelectElement>('select')!;
    origine.value = 'ANALYSE_AUTOMATIQUE';
    origine.dispatchEvent(new Event('change'));
    rafraichir();
    expect(titres()).toEqual(['Constantes anormales (consultation)']);
  });

  it('affiche un état vide adapté quand aucun filtre ne correspond', () => {
    afficher('SAGE_FEMME');

    const recherche = el.querySelector<HTMLInputElement>('input[type="search"]')!;
    recherche.value = 'aucune patiente';
    recherche.dispatchEvent(new Event('input'));
    rafraichir();

    expect(el.textContent).toContain('Aucune alerte ne correspond à ces filtres.');
  });

  it('affiche un état vide quand la catégorie ne contient aucune alerte', () => {
    afficher('SAGE_FEMME', () => of([]));

    expect(el.textContent).toContain('Aucun signalement dans cette catégorie pour le moment.');
  });

  it('affiche une erreur lisible si le chargement échoue', () => {
    afficher('SAGE_FEMME', () => throwError(() => new HttpErrorResponse({ status: 0 })));

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Serveur injoignable');
  });

  it('l’onglet « Urgentes non résolues » interroge la liste des urgences', () => {
    afficher('MEDECIN');

    const onglet = Array.from(el.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((t) => t.textContent!.includes('Urgentes'))!;
    onglet.click();
    rafraichir();

    expect(service['listerUrgentes']).toHaveBeenCalled();
    expect(onglet.getAttribute('aria-selected')).toBe('true');
    expect(titres()).toEqual(['Saignements']);
  });

  it('un soignant peut prendre en charge une nouvelle alerte', () => {
    afficher('SAGE_FEMME');

    const bouton = Array.from(el.querySelectorAll<HTMLButtonElement>('.alert__actions button'))
      .find((b) => b.textContent!.includes('Prendre en charge'))!;
    bouton.click();

    expect(service['prendreEnCharge']).toHaveBeenCalledWith(2);
  });

  it('l’administrateur consulte les alertes sans pouvoir agir', () => {
    afficher('ADMIN');

    expect(el.textContent).toContain('Vue de supervision des signalements');
    expect(el.querySelector('.alert__actions')).toBeNull();
  });
});
