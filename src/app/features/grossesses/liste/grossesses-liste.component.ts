import { Component, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { AuthService } from '../../../core/services/auth.service';
import { GrossesseDto } from '../../../core/models/grossesse.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PlanifierRendezVousComponent } from '../../rendez-vous/planifier-rendez-vous/planifier-rendez-vous.component';
import { initiales } from '../../../core/utils/affichage';

type Onglet = 'TOUTES' | 'A_RISQUE';
type Trimestre = 'TOUS' | 'T1' | 'T2' | 'T3';
type Tri = 'TERME' | 'SEMAINE' | 'NOM';
type Vue = 'CARTES' | 'LISTE';

const CLE_VUE = 'yay360.grossesses.vue';

@Component({
  selector: 'yay360-grossesses-liste',
  standalone: true,
  imports: [StateComponent, RouterLink, DatePipe, IconComponent, PlanifierRendezVousComponent],
  templateUrl: './grossesses-liste.component.html',
  styleUrl: './grossesses-liste.component.scss',
})
export class GrossessesListeComponent {
  private readonly grossesseService = inject(GrossesseService);
  private readonly authService = inject(AuthService);

  /** Un soignant ne voit que les patientes qu'il suit ; l'admin a une vue d'ensemble. */
  readonly estSoignant = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly onglet = signal<Onglet>('TOUTES');
  readonly compteEnCours = signal<number | null>(null);
  readonly compteARisque = signal<number | null>(null);
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly grossesses = signal<GrossesseDto[]>([]);
  readonly recherche = signal('');
  readonly trimestres: Trimestre[] = ['TOUS', 'T1', 'T2', 'T3'];
  readonly trimestre = signal<Trimestre>('TOUS');
  readonly tri = signal<Tri>('TERME');
  readonly vue = signal<Vue>(this.lireVue());

  readonly compteTrimestres = computed(() => {
    const liste = this.grossesses();
    return {
      TOUS: liste.length,
      T1: liste.filter((g) => g.trimestre === 'T1').length,
      T2: liste.filter((g) => g.trimestre === 'T2').length,
      T3: liste.filter((g) => g.trimestre === 'T3').length,
    } as Record<Trimestre, number>;
  });
  readonly nombreARisque = computed(() => this.grossesses().filter((g) => g.grossesseARisque).length);

  readonly grossessesFiltrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const t = this.trimestre();
    const liste = this.grossesses().filter(
      (g) =>
        (t === 'TOUS' || g.trimestre === t) &&
        (!terme ||
          g.femmeEnceinteNomComplet.toLowerCase().includes(terme) ||
          (g.etablissementSuiviNom ?? '').toLowerCase().includes(terme) ||
          String(g.id) === terme.replace('#', ''))
    );
    const tri = this.tri();
    return [...liste].sort((a, b) => {
      if (tri === 'NOM') return a.femmeEnceinteNomComplet.localeCompare(b.femmeEnceinteNomComplet, 'fr');
      if (tri === 'SEMAINE') return b.semaineActuelle - a.semaineActuelle;
      return a.joursRestants - b.joursRestants;
    });
  });

  /** Termes proches (≤ 4 semaines), du plus proche au plus lointain. */
  readonly termesProches = computed(() =>
    this.grossesses()
      .filter((g) => g.joursRestants <= 28)
      .sort((a, b) => a.joursRestants - b.joursRestants)
      .slice(0, 6)
  );

  /** Planification rapide depuis la liste. */
  readonly planification = signal<GrossesseDto | null>(null);
  readonly succes = signal<string | null>(null);

  rendezVousPlanifie(): void {
    const g = this.planification();
    this.planification.set(null);
    this.succes.set(g ? `Rendez-vous planifié pour ${g.femmeEnceinteNomComplet}. La patiente a été notifiée.` : 'Rendez-vous planifié.');
  }

  readonly filtresActifs = computed(() => !!this.recherche().trim() || this.trimestre() !== 'TOUS');

  private readonly rechargement$ = new Subject<Onglet>();

  constructor() {
    this.rechargement$
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap((o) =>
          (o === 'A_RISQUE' ? this.grossesseService.listerARisque() : this.grossesseService.listerActives()).pipe(
            catchError((err) => {
              this.erreur.set(messageErreur(err, 'Impossible de charger la liste des grossesses.'));
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((liste) => {
        if (liste) {
          this.grossesses.set(liste);
          // Compteurs des onglets, conservés d'un onglet à l'autre
          if (this.onglet() === 'TOUTES') {
            this.compteEnCours.set(liste.length);
            this.compteARisque.set(liste.filter((g) => g.grossesseARisque).length);
          } else {
            this.compteARisque.set(liste.length);
          }
        }
        this.chargement.set(false);
      });
    this.charger();
  }

  changerOnglet(o: Onglet): void {
    if (o === this.onglet()) return;
    this.onglet.set(o);
    this.charger();
  }

  charger(): void {
    this.rechargement$.next(this.onglet());
  }

  changerVue(v: Vue): void {
    this.vue.set(v);
    try { localStorage.setItem(CLE_VUE, v); } catch { /* stockage indisponible */ }
  }

  private lireVue(): Vue {
    try { return localStorage.getItem(CLE_VUE) === 'LISTE' ? 'LISTE' : 'CARTES'; } catch { return 'CARTES'; }
  }

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.trimestre.set('TOUS');
  }

  readonly initiales = initiales;

  /** Avancement sur 40 semaines, borné à 100 %. */
  progression(g: GrossesseDto): number {
    return Math.min(100, Math.round((g.semaineActuelle / 40) * 100));
  }
}
