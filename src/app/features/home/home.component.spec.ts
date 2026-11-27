import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NEVER } from 'rxjs';
import { HomeComponent } from './home.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/dashboard.model';
import { Role } from '../../core/models/utilisateur.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

/** Accès protégés du composant (indicateurs et liens), lus sans passer par le gabarit. */
interface VueAccueil {
  stats: { set(s: DashboardDto): void };
  aTraiter(): { lien: string }[];
  accesRapides(): { label: string }[];
}

describe('HomeComponent (accueil des administrateurs)', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let el: HTMLElement;
  let dashboard: Record<string, ReturnType<typeof vi.fn>>;

  function creer(role: Role): VueAccueil {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    dashboard = { obtenir: vi.fn(() => NEVER) };
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideHttpClient(), { provide: DashboardService, useValue: dashboard }],
    });
    fixture = TestBed.createComponent(HomeComponent);
    el = fixture.nativeElement;
    return fixture.componentInstance as unknown as VueAccueil;
  }

  afterEach(() => localStorage.clear());

  it('l’administrateur d’établissement accède à son établissement et à ses soignants, sans écran de suivi', () => {
    const accueil = creer('ADMIN_ETABLISSEMENT');
    fixture.detectChanges();

    expect(dashboard['obtenir']).not.toHaveBeenCalled();
    expect(el.querySelector('.welcome__lead')?.textContent).toContain('Gérez les soignants');
    expect(accueil.accesRapides().map((l) => l.label)).toEqual(['Mon établissement', 'Soignants']);
  });

  it('les indicateurs de l’administrateur de la plateforme renvoient au tableau de bord, jamais aux dossiers', () => {
    const accueil = creer('ADMIN');
    accueil.stats.set({ nombreAlertesUrgentes: 2, nombreAlertesNouvelles: 3, nombreGrossessesARisque: 1 } as DashboardDto);

    expect(dashboard['obtenir']).toHaveBeenCalled();
    expect(accueil.aTraiter().map((t) => t.lien)).toEqual(['/tableau-de-bord', '/tableau-de-bord', '/tableau-de-bord']);
    expect(accueil.accesRapides().map((l) => l.label)).not.toContain('Grossesses');
    expect(accueil.accesRapides().map((l) => l.label)).not.toContain('Alertes');
  });
});
