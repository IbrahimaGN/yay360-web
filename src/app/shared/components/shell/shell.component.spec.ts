import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { ShellComponent } from './shell.component';
import { NotificationService } from '../../../core/services/notification.service';
import { Role } from '../../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../../core/testing/session-de-test';

describe('ShellComponent (menu latéral par rôle)', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let el: HTMLElement;

  function afficher(role: Role, nonLues = 0): void {
    localStorage.clear();
    ouvrirSessionDeTest(role, 'Awa', 'Démo');
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        {
          provide: NotificationService,
          useValue: { compterNonLues: vi.fn(() => of({ nombre: nonLues })), changement$: new Subject<void>() },
        },
      ],
    });
    fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const entrees = () => Array.from(el.querySelectorAll('.side__label')).map((l) => l.textContent!.trim());
  const sections = () => Array.from(el.querySelectorAll('.side__section-title')).map((t) => t.textContent!.trim());

  it('l’administrateur voit la gestion de la plateforme, sans les consultations', () => {
    afficher('ADMIN');

    expect(entrees()).toEqual([
      'Accueil', 'Tableau de bord', 'Grossesses', 'Rendez-vous', 'Alertes',
      'Établissements', 'Conseils & étapes', 'Utilisateurs',
    ]);
    expect(sections()).toEqual(['Général', 'Suivi', 'Administration']);
  });

  it('le médecin voit le suivi clinique, sans les menus d’administration', () => {
    afficher('MEDECIN');

    expect(entrees()).toEqual(['Accueil', 'Grossesses', 'Rendez-vous', 'Consultations', 'Alertes', 'Conseils & étapes']);
    expect(entrees()).not.toContain('Utilisateurs');
    expect(entrees()).not.toContain('Tableau de bord');
    expect(sections()).toEqual(['Général', 'Suivi', 'Ressources']);
  });

  it('la sage-femme a les mêmes entrées que le médecin', () => {
    afficher('SAGE_FEMME');

    expect(entrees()).toEqual(['Accueil', 'Grossesses', 'Rendez-vous', 'Consultations', 'Alertes', 'Conseils & étapes']);
  });

  it('la patiente voit uniquement son suivi et son dossier familial', () => {
    afficher('FEMME_ENCEINTE');

    expect(entrees()).toEqual(['Accueil', 'Suivi prénatal', 'Dossier familial']);
    expect(sections()).toEqual(['Général', 'Ma grossesse']);
  });

  it('le conjoint voit les mêmes entrées que la patiente, sous « Grossesse »', () => {
    afficher('CONJOINT');

    expect(entrees()).toEqual(['Accueil', 'Suivi prénatal', 'Dossier familial']);
    expect(sections()).toEqual(['Général', 'Grossesse']);
    expect(entrees()).not.toContain('Grossesses');
    expect(entrees()).not.toContain('Alertes');
  });

  it('replie la barre latérale et mémorise ce choix', () => {
    afficher('MEDECIN');

    const bouton = el.querySelector<HTMLButtonElement>('.side__toggle')!;
    expect(bouton.getAttribute('aria-expanded')).toBe('true');

    bouton.click();
    fixture.detectChanges();

    expect(el.querySelector('.side')?.classList).toContain('side--repliee');
    expect(bouton.getAttribute('aria-label')).toBe('Déplier la barre latérale');
    expect(localStorage.getItem('yay360.sidebar.repliee')).toBe('true');
  });

  it('annonce le nombre de notifications non lues', () => {
    afficher('FEMME_ENCEINTE', 3);

    expect(el.querySelector('.topbar__count')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('[aria-label^="Notifications"]')?.getAttribute('aria-label')).toBe('Notifications : 3 non lues');
  });

  it('la déconnexion ferme la session et renvoie vers la connexion', () => {
    afficher('MEDECIN');
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    el.querySelector<HTMLButtonElement>('.side__logout')!.click();

    expect(localStorage.getItem('yay360.session')).toBeNull();
    expect(navigation).toHaveBeenCalledWith(['/connexion']);
  });
});
