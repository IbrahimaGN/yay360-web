import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import {
  CalendrierGrossesseDto,
  GrossesseDto,
  SuiviHebdomadaireDto,
} from '../../../core/models/grossesse.model';
import { ConsultationDto } from '../../../core/models/consultation.model';
import { RendezVousDto } from '../../../core/models/rendez-vous.model';
import { RingChartComponent, RingSegment } from '../../../shared/components/ring-chart/ring-chart.component';
import { DUREE_GROSSESSE_SEMAINES } from '../../../core/models/etape-grossesse.model';

@Component({
  selector: 'yay360-grossesse-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, RingChartComponent],
  templateUrl: './grossesse-detail.component.html',
  styleUrl: './grossesse-detail.component.scss',
})
export class GrossesseDetailComponent implements OnInit {
  private readonly grossesseService = inject(GrossesseService);
  private readonly authService = inject(AuthService);
  private readonly consultationService = inject(ConsultationService);
  private readonly rendezVousService = inject(RendezVousService);

  readonly id = input.required<string>();

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly grossesse = signal<GrossesseDto | null>(null);
  readonly suivi = signal<SuiviHebdomadaireDto | null>(null);
  readonly calendrier = signal<CalendrierGrossesseDto | null>(null);
  readonly consultations = signal<ConsultationDto[]>([]);
  readonly rendezVous = signal<RendezVousDto[]>([]);
  readonly dureeGrossesseSemaines = DUREE_GROSSESSE_SEMAINES;

  readonly peutEnregistrerConsultation = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly actionEnCours = signal(false);
  readonly formulaireRisqueOuvert = signal(false);
  readonly formulaireTerminerOuvert = signal(false);
  readonly motifRisque = signal('');
  readonly statutFinal = signal<'TERMINEE' | 'INTERROMPUE'>('TERMINEE');
  readonly dateAccouchementReelle = signal<string>(new Date().toISOString().slice(0, 10));
  readonly messageAction = signal<string | null>(null);

  readonly peutGererRisque = computed(() => this.authService.hasRole('MEDECIN'));
  readonly peutTerminer = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly segmentsProgression = computed<RingSegment[]>(() => {
    const g = this.grossesse();
    if (!g) return [];
    const restantes = Math.max(this.dureeGrossesseSemaines - g.semaineActuelle, 0);
    return [
      { label: 'Écoulées', value: g.semaineActuelle, color: 'var(--color-corail-aurore)' },
      { label: 'Restantes', value: restantes, color: 'var(--surface-muted)' },
    ];
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    const id = Number(this.id());
    this.chargement.set(true);
    this.erreur.set(null);

    this.grossesseService.obtenirParId(id).subscribe({
      next: (g) => {
        this.grossesse.set(g);
        if (g.statut === 'EN_COURS') {
          this.grossesseService.obtenirSuivi(id).subscribe({
            next: (suivi) => this.suivi.set(suivi),
          });
          this.grossesseService.obtenirCalendrier(id).subscribe({
            next: (calendrier) => {
              this.calendrier.set(calendrier);
              this.chargement.set(false);
            },
            error: () => this.chargement.set(false),
          });
        } else {
          this.chargement.set(false);
        }
      },
      error: () => {
        this.erreur.set('Impossible de charger cette grossesse.');
        this.chargement.set(false);
      },
    });

    this.consultationService.parGrossesse(id).subscribe({
      next: (liste) => this.consultations.set(liste),
    });

    this.rendezVousService.listerParGrossesse(id).subscribe({
      next: (liste) => this.rendezVous.set(liste),
    });
  }

  ouvrirFormulaireRisque(): void {
    this.formulaireRisqueOuvert.set(true);
    this.messageAction.set(null);
  }

  confirmerRisque(): void {
    const g = this.grossesse();
    if (!g || !this.motifRisque().trim()) return;

    this.actionEnCours.set(true);
    this.grossesseService.declarerARisque(g.id, { motif: this.motifRisque() }).subscribe({
      next: (miseAJour) => {
        this.grossesse.set(miseAJour);
        this.formulaireRisqueOuvert.set(false);
        this.motifRisque.set('');
        this.actionEnCours.set(false);
        this.messageAction.set('Grossesse déclarée à risque.');
      },
      error: () => {
        this.actionEnCours.set(false);
        this.messageAction.set("Erreur lors de l'opération.");
      },
    });
  }

  retirerRisque(): void {
    const g = this.grossesse();
    if (!g) return;

    this.actionEnCours.set(true);
    this.grossesseService.retirerRisque(g.id).subscribe({
      next: (miseAJour) => {
        this.grossesse.set(miseAJour);
        this.actionEnCours.set(false);
        this.messageAction.set('Statut à risque retiré.');
      },
      error: () => {
        this.actionEnCours.set(false);
        this.messageAction.set("Erreur lors de l'opération.");
      },
    });
  }

  ouvrirFormulaireTerminer(): void {
    this.formulaireTerminerOuvert.set(true);
    this.messageAction.set(null);
  }

  confirmerTerminer(): void {
    const g = this.grossesse();
    if (!g) return;

    const dateAccouchement = this.statutFinal() === 'TERMINEE' ? this.dateAccouchementReelle() : undefined;
    this.actionEnCours.set(true);
    this.grossesseService.terminer(g.id, {
      statut: this.statutFinal(),
      dateAccouchementReelle: dateAccouchement,
    }).subscribe({
      next: (miseAJour) => {
        this.grossesse.set(miseAJour);
        this.formulaireTerminerOuvert.set(false);
        this.actionEnCours.set(false);
        this.messageAction.set(
          this.statutFinal() === 'TERMINEE'
            ? 'La grossesse a été clôturée.'
            : 'Grossesse clôturée.'
        );
        this.charger();
      },
      error: (err) => {
        this.actionEnCours.set(false);
        this.messageAction.set(err?.error?.message ?? "Erreur lors de l'opération.");
      },
    });
  }
}
