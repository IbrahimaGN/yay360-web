import { Component, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { AlerteDto, StatutAlerte } from '../../core/models/alerte.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { libelleGravite, libelleStatutAlerte, libelleSymptome } from '../../core/utils/libelles';
import { NiveauGraviteComponent } from '../../shared/components/niveau-gravite/niveau-gravite.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';
import { NiveauGravite } from '../../core/models/alerte.model';

type CleOnglet = 'URGENTES' | StatutAlerte;

@Component({
  selector: 'yay360-alertes-liste',
  standalone: true,
  imports: [StateComponent, NiveauGraviteComponent, IconComponent, DatePipe, RouterLink],
  templateUrl: './alertes-liste.component.html',
  styleUrl: './alertes-liste.component.scss',
})
export class AlertesListeComponent {
  private readonly alerteService = inject(AlerteService);
  private readonly authService = inject(AuthService);

  readonly libelleSymptome = libelleSymptome;
  readonly libelleGravite = libelleGravite;
  readonly libelleStatutAlerte = libelleStatutAlerte;
  readonly peutAgir = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly onglets: { cle: CleOnglet; label: string; icone: IconName }[] = [
    { cle: 'NOUVELLE', label: 'Nouvelles', icone: 'bell' },
    { cle: 'URGENTES', label: 'Urgentes non résolues', icone: 'alert-triangle' },
    { cle: 'PRISE_EN_CHARGE', label: 'Prises en charge', icone: 'activity' },
    { cle: 'RESOLUE', label: 'Résolues', icone: 'check' },
  ];

  readonly recherche = signal('');
  readonly filtreGravite = signal<'TOUTES' | NiveauGravite>('TOUTES');
  readonly filtreOrigine = signal<'' | 'PATIENTE' | 'ANALYSE_AUTOMATIQUE'>('');

  private static readonly RANG: Record<NiveauGravite, number> = { URGENT: 0, ELEVE: 1, MODERE: 2 };

  readonly compteGravite = computed(() => {
    const l = this.alertes();
    return {
      TOUTES: l.length,
      URGENT: l.filter((a) => a.niveauGravite === 'URGENT').length,
      ELEVE: l.filter((a) => a.niveauGravite === 'ELEVE').length,
      MODERE: l.filter((a) => a.niveauGravite === 'MODERE').length,
    } as Record<'TOUTES' | NiveauGravite, number>;
  });
  readonly gravites: ('TOUTES' | NiveauGravite)[] = ['TOUTES', 'URGENT', 'ELEVE', 'MODERE'];

  /** Alertes filtrées, triées par gravité puis de la plus récente à la plus ancienne. */
  readonly alertesFiltrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const g = this.filtreGravite();
    const o = this.filtreOrigine();
    return this.alertes()
      .filter((a) => (g === 'TOUTES' || a.niveauGravite === g) && (!o || a.origine === o) &&
        (!terme || a.femmeEnceinteNomComplet.toLowerCase().includes(terme) || this.libelleSymptome(a.typeSymptome).toLowerCase().includes(terme)))
      .sort((a, b) => AlertesListeComponent.RANG[a.niveauGravite] - AlertesListeComponent.RANG[b.niveauGravite]
        || +new Date(b.dateDeclaration) - +new Date(a.dateDeclaration));
  });
  readonly filtresActifs = computed(() => !!this.recherche().trim() || this.filtreGravite() !== 'TOUTES' || !!this.filtreOrigine());

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.filtreGravite.set('TOUTES');
    this.filtreOrigine.set('');
  }

  initiales(nom: string): string {
    return nom.replace(/\([^)]*\)/, '').trim().split(/\s+/).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('');
  }

  /** Durée écoulée depuis la déclaration, lisible. */
  depuis(date: string): string {
    const min = Math.max(0, Math.round((Date.now() - +new Date(date)) / 60000));
    if (min < 60) return `il y a ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const j = Math.round(h / 24);
    return `il y a ${j} jour${j > 1 ? 's' : ''}`;
  }

  etape(statut: StatutAlerte): number {
    return statut === 'NOUVELLE' ? 1 : statut === 'PRISE_EN_CHARGE' ? 2 : 3;
  }

  readonly ongletActif = signal<CleOnglet>('NOUVELLE');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly erreurAction = signal<string | null>(null);
  readonly alertes = signal<AlerteDto[]>([]);
  readonly idEnAction = signal<number | null>(null);
  readonly notesParAlerte = signal<Record<number, string>>({});
  readonly formulaireResolutionOuvert = signal<number | null>(null);
  readonly justificationOuverte = signal<number | null>(null);

  private readonly rechargement$ = new Subject<CleOnglet>();

  constructor() {
    this.rechargement$
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap((cle) =>
          (cle === 'URGENTES' ? this.alerteService.listerUrgentes() : this.alerteService.listerParStatut(cle)).pipe(
            catchError((err) => {
              this.erreur.set(messageErreur(err, 'Impossible de charger les alertes.'));
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((liste) => {
        if (liste) {
          this.alertes.set(liste);
        }
        this.chargement.set(false);
      });
    this.charger();
  }

  changerOnglet(cle: CleOnglet): void {
    if (cle === this.ongletActif()) return;
    this.ongletActif.set(cle);
    this.charger();
  }

  charger(): void {
    this.rechargement$.next(this.ongletActif());
  }

  basculerJustification(id: number): void {
    this.justificationOuverte.update((actuel) => (actuel === id ? null : id));
  }

  prendreEnCharge(alerte: AlerteDto): void {
    this.executer(alerte, this.alerteService.prendreEnCharge(alerte.id), 'Impossible de prendre en charge cette alerte.');
  }

  ouvrirResolution(alerte: AlerteDto): void {
    this.formulaireResolutionOuvert.set(alerte.id);
    this.erreurAction.set(null);
  }

  mettreAJourNote(alerteId: number, valeur: string): void {
    this.notesParAlerte.update((notes) => ({ ...notes, [alerteId]: valeur }));
  }

  note(alerteId: number): string {
    return (this.notesParAlerte()[alerteId] ?? '').trim();
  }

  confirmerResolution(alerte: AlerteDto): void {
    const notes = this.note(alerte.id);
    if (!notes) {
      this.erreurAction.set('Les observations de résolution sont obligatoires.');
      return;
    }
    this.executer(alerte, this.alerteService.resoudre(alerte.id, { notesPriseEnCharge: notes }),
      'Impossible de résoudre cette alerte.');
  }

  private executer(alerte: AlerteDto, action: Observable<unknown>, parDefaut: string): void {
    this.idEnAction.set(alerte.id);
    this.erreurAction.set(null);
    action.subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.formulaireResolutionOuvert.set(null);
        this.charger();
      },
      error: (err) => {
        this.idEnAction.set(null);
        this.erreurAction.set(messageErreur(err, parDefaut));
      },
    });
  }
}
