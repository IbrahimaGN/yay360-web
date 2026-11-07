import { StatutPipe } from '../../shared/pipes/statut.pipe';
import { Component, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RendezVousService } from '../../core/services/rendez-vous.service';
import { AuthService } from '../../core/services/auth.service';
import { RendezVousDto, StatutCibleRendezVous, StatutRendezVous } from '../../core/models/rendez-vous.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { libelleTypeRendezVous, TYPES_RENDEZ_VOUS } from '../../core/utils/libelles';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';
import { PlanifierRendezVousComponent } from './planifier-rendez-vous/planifier-rendez-vous.component';

type CleOnglet = 'MON_PLANNING' | StatutRendezVous;

interface Onglet {
  cle: CleOnglet;
  label: string;
  icone: IconName;
}

interface Jour { cle: string; date: string; items: RendezVousDto[] }

@Component({
  selector: 'yay360-rendez-vous-liste',
  standalone: true,
  imports: [StatutPipe, StateComponent, DatePipe, RouterLink, IconComponent, PlanifierRendezVousComponent],
  templateUrl: './rendez-vous-liste.component.html',
  styleUrl: './rendez-vous-liste.component.scss',
})
export class RendezVousListeComponent {
  private readonly rendezVousService = inject(RendezVousService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly libelleType = libelleTypeRendezVous;
  /** Les actions sont réservées aux soignants (l'admin a une vue de supervision). */
  readonly estProfessionnel = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly onglets = computed<Onglet[]>(() => [
    ...(this.estProfessionnel() ? [{ cle: 'MON_PLANNING' as CleOnglet, label: 'Mon planning', icone: 'user' as IconName }] : []),
    { cle: 'PLANIFIE', label: 'À confirmer', icone: 'calendar' },
    { cle: 'CONFIRME', label: 'Confirmés', icone: 'check' },
    { cle: 'TERMINE', label: 'Terminés', icone: 'clipboard' },
    { cle: 'ANNULE', label: 'Annulés', icone: 'x' },
    { cle: 'ABSENT', label: 'Absences', icone: 'alert-triangle' },
  ]);

  readonly ongletActif = signal<CleOnglet>(this.estProfessionnel() ? 'MON_PLANNING' : 'PLANIFIE');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly erreurAction = signal<string | null>(null);
  readonly rendezVous = signal<RendezVousDto[]>([]);
  readonly idEnAction = signal<number | null>(null);

  /** Report ou annulation en cours de saisie. */
  readonly edition = signal<{ id: number; mode: 'reporter' | 'annuler' } | null>(null);
  readonly nouvelleDate = signal('');
  readonly motifAnnulation = signal('');

  readonly typesRendezVous = TYPES_RENDEZ_VOUS;
  readonly recherche = signal('');
  readonly filtreType = signal('');

  /** Rendez-vous filtrés puis regroupés par jour (ordre chronologique, ou inverse pour l'historique). */
  readonly jours = computed<Jour[]>(() => {
    const terme = this.recherche().trim().toLowerCase();
    const type = this.filtreType();
    const historique = ['TERMINE', 'ANNULE', 'ABSENT'].includes(this.ongletActif());
    const jour = this.jourChoisi();
    const aCloturer = this.seulementACloturer();
    const liste = this.rendezVous()
      .filter((r) => (!aCloturer || (this.estActif(r) && this.estPasse(r))) && (!jour || this.cleJour(new Date(r.dateHeure)) === jour) && (!type || r.type === type) && (!terme ||
        r.femmeEnceinteNomComplet.toLowerCase().includes(terme) ||
        (r.etablissementNom ?? '').toLowerCase().includes(terme) ||
        (r.professionnelNomComplet ?? '').toLowerCase().includes(terme)))
      .sort((a, b) => (historique ? -1 : 1) * (+new Date(a.dateHeure) - +new Date(b.dateHeure)));
    const jours = new Map<string, Jour>();
    for (const r of liste) {
      const d = new Date(r.dateHeure);
      const cle = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!jours.has(cle)) jours.set(cle, { cle, date: r.dateHeure, items: [] });
      jours.get(cle)!.items.push(r);
    }
    return [...jours.values()];
  });
  readonly nombreAffiches = computed(() => this.jours().reduce((n, j) => n + j.items.length, 0));
  readonly filtresActifs = computed(() => !!this.recherche().trim() || !!this.filtreType() || !!this.jourChoisi() || this.seulementACloturer());

  // ─── Planning du soignant ────────────────────────────────────────────
  /** Jour sélectionné dans la bande des 7 jours (clé aaaa-m-j), ou null pour tous. */
  readonly jourChoisi = signal<string | null>(null);
  /** N'afficher que les rendez-vous passés encore ouverts. */
  readonly seulementACloturer = signal(false);
  readonly planificationOuverte = signal(false);
  readonly succes = signal<string | null>(null);

  cleJour(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private estActifStatut(r: RendezVousDto): boolean {
    return r.statut === 'PLANIFIE' || r.statut === 'CONFIRME';
  }

  /** Les 7 prochains jours avec le nombre de rendez-vous actifs de chacun. */
  readonly semaine = computed(() => {
    const actifs = this.rendezVous().filter((r) => this.estActifStatut(r));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      const cle = this.cleJour(d);
      return { cle, date: d, nombre: actifs.filter((r) => this.cleJour(new Date(r.dateHeure)) === cle).length };
    });
  });

  /** Indicateurs du planning. */
  readonly indicateurs = computed(() => {
    const l = this.rendezVous();
    const aujourdhui = this.cleJour(new Date());
    const dans7j = Date.now() + 7 * 864e5;
    return {
      aujourdhui: l.filter((r) => this.estActifStatut(r) && this.cleJour(new Date(r.dateHeure)) === aujourdhui).length,
      semaine: l.filter((r) => this.estActifStatut(r) && +new Date(r.dateHeure) <= dans7j && +new Date(r.dateHeure) >= Date.now() - 864e5).length,
      aConfirmer: l.filter((r) => r.statut === 'PLANIFIE').length,
      aCloturer: l.filter((r) => this.estActifStatut(r) && this.estPasse(r)).length,
    };
  });

  basculerJour(cle: string): void {
    this.jourChoisi.update((j) => (j === cle ? null : cle));
  }

  rendezVousPlanifie(): void {
    this.planificationOuverte.set(false);
    this.succes.set('Rendez-vous planifié. La patiente a été notifiée.');
    this.charger();
  }

  /** Libellé relatif du jour : Aujourd'hui, Demain, Hier, ou vide (date complète affichée). */
  libelleJour(date: string): string {
    const debut = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const ecart = Math.round((debut(new Date(date)) - debut(new Date())) / 864e5);
    return ecart === 0 ? 'Aujourd’hui' : ecart === 1 ? 'Demain' : ecart === -1 ? 'Hier' : '';
  }

  iconeType(type: string): IconName {
    return ({ CONSULTATION_PRENATALE: 'clipboard', ECHOGRAPHIE: 'activity', VACCINATION: 'shield', EXAMEN_LABORATOIRE: 'search' } as Record<string, IconName>)[type] ?? 'calendar';
  }

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.filtreType.set('');
    this.jourChoisi.set(null);
    this.seulementACloturer.set(false);
  }

  private readonly rechargement$ = new Subject<CleOnglet>();

  constructor() {
    this.rechargement$
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap((cle) =>
          (cle === 'MON_PLANNING'
            ? this.rendezVousService.monPlanning()
            : this.rendezVousService.listerParStatut(cle)
          ).pipe(
            catchError((err) => {
              this.erreur.set(messageErreur(err, 'Impossible de charger les rendez-vous.'));
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((liste) => {
        if (liste) {
          this.rendezVous.set(liste);
        }
        this.chargement.set(false);
      });
    this.charger();
  }

  changerOnglet(cle: CleOnglet): void {
    if (cle === this.ongletActif()) return;
    this.ongletActif.set(cle);
    this.jourChoisi.set(null);
    this.seulementACloturer.set(false);
    this.charger();
  }

  charger(): void {
    this.rechargement$.next(this.ongletActif());
  }

  estActif(rdv: RendezVousDto): boolean {
    return rdv.statut === 'PLANIFIE' || rdv.statut === 'CONFIRME';
  }

  /** TERMINE et ABSENT ne s'appliquent qu'à un rendez-vous dont l'heure est passée. */
  estPasse(rdv: RendezVousDto): boolean {
    return new Date(rdv.dateHeure).getTime() <= Date.now();
  }

  confirmer(rdv: RendezVousDto): void {
    this.appliquerStatut(rdv, 'CONFIRME');
  }

  marquerTermine(rdv: RendezVousDto): void {
    this.appliquerStatut(rdv, 'TERMINE');
  }

  marquerAbsent(rdv: RendezVousDto): void {
    this.appliquerStatut(rdv, 'ABSENT');
  }

  ouvrirEdition(rdv: RendezVousDto, mode: 'reporter' | 'annuler'): void {
    this.edition.set({ id: rdv.id, mode });
    this.nouvelleDate.set(rdv.dateHeure.slice(0, 16));
    this.motifAnnulation.set('');
    this.erreurAction.set(null);
  }

  confirmerAnnulation(rdv: RendezVousDto): void {
    this.executer(rdv, this.rendezVousService.annuler(rdv.id, {
      notesAnnulation: this.motifAnnulation().trim() || undefined,
    }), "Impossible d'annuler ce rendez-vous.");
  }

  confirmerReport(rdv: RendezVousDto): void {
    const date = this.nouvelleDate();
    if (!date || new Date(date).getTime() <= Date.now()) {
      this.erreurAction.set('Choisissez une nouvelle date dans le futur.');
      return;
    }
    this.executer(rdv, this.rendezVousService.reporter(rdv.id, { dateHeure: `${date}:00`.slice(0, 19) }),
      'Impossible de reporter ce rendez-vous.');
  }

  enregistrerConsultation(rdv: RendezVousDto): void {
    this.router.navigate(['/consultations/nouvelle'], {
      queryParams: { grossesseId: rdv.grossesseId, rendezVousId: rdv.id },
    });
  }

  private appliquerStatut(rdv: RendezVousDto, statut: StatutCibleRendezVous): void {
    this.executer(rdv, this.rendezVousService.changerStatut(rdv.id, { statut }), 'Impossible de modifier ce rendez-vous.');
  }

  private executer(rdv: RendezVousDto, action: Observable<unknown>, parDefaut: string): void {
    this.idEnAction.set(rdv.id);
    this.erreurAction.set(null);
    action.subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.edition.set(null);
        this.charger();
      },
      error: (err) => {
        this.idEnAction.set(null);
        this.erreurAction.set(messageErreur(err, parDefaut));
      },
    });
  }
}
