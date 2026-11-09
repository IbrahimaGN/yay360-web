import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatutPipe } from '../../../shared/pipes/statut.pipe';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { StateComponent } from '../../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConsultationService } from '../../../core/services/consultation.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import {
  CalendrierGrossesseDto,
  EvaluationRisqueDto,
  GrossesseDto,
  PlanCpnDto,
  SuiviHebdomadaireDto,
  IssueGrossesse,
} from '../../../core/models/grossesse.model';
import { ConsultationDto } from '../../../core/models/consultation.model';
import { RendezVousDto } from '../../../core/models/rendez-vous.model';
import { RingChartComponent, RingSegment } from '../../../shared/components/ring-chart/ring-chart.component';
import { PlanCpnComponent } from '../../../shared/components/plan-cpn/plan-cpn.component';
import { PlanifierRendezVousComponent } from '../../rendez-vous/planifier-rendez-vous/planifier-rendez-vous.component';
import { DUREE_GROSSESSE_SEMAINES } from '../../../core/models/etape-grossesse.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { nomDossierPdf, telechargerFichier } from '../../../core/utils/telechargement';
import { ISSUES_GROSSESSE, libelleIssue, libelleTypeRendezVous } from '../../../core/utils/libelles';

@Component({
  selector: 'yay360-grossesse-detail',
  standalone: true,
  imports: [StatutPipe, IconComponent, StateComponent, DatePipe, RouterLink, RingChartComponent, PlanCpnComponent, PlanifierRendezVousComponent],
  templateUrl: './grossesse-detail.component.html',
  styleUrl: './grossesse-detail.component.scss',
})
export class GrossesseDetailComponent implements OnInit {
  private readonly grossesseService = inject(GrossesseService);
  private readonly authService = inject(AuthService);
  private readonly consultationService = inject(ConsultationService);
  private readonly rendezVousService = inject(RendezVousService);

  readonly id = input.required<string>();
  readonly libelleTypeRendezVous = libelleTypeRendezVous;
  readonly dureeGrossesseSemaines = DUREE_GROSSESSE_SEMAINES;
  readonly aujourdhui = new Date().toISOString().slice(0, 10);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly grossesse = signal<GrossesseDto | null>(null);
  readonly suivi = signal<SuiviHebdomadaireDto | null>(null);
  readonly calendrier = signal<CalendrierGrossesseDto | null>(null);
  readonly planCpn = signal<PlanCpnDto | null>(null);
  readonly evaluation = signal<EvaluationRisqueDto | null>(null);
  readonly consultations = signal<ConsultationDto[]>([]);
  readonly rendezVous = signal<RendezVousDto[]>([]);
  /** Erreur propre à chaque bloc secondaire (le reste de la fiche reste affiché). */
  readonly erreursBlocs = signal<Record<string, string>>({});

  // Les droits reflètent ceux du serveur ; ils ne servent qu'à adapter l'interface
  readonly estSoignant = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));
  readonly estMedecin = computed(() => this.authService.hasRole('MEDECIN'));
  readonly estAdmin = computed(() => this.authService.hasRole('ADMIN'));

  readonly actionEnCours = signal(false);
  readonly formulaireRisqueOuvert = signal(false);
  readonly formulaireTerminerOuvert = signal(false);
  readonly formulairePlanifierOuvert = signal(false);
  readonly motifRisque = signal('');
  readonly issuesGrossesse = ISSUES_GROSSESSE;
  readonly libelleIssue = libelleIssue;
  readonly issueFinale = signal<IssueGrossesse>('NAISSANCE_VIVANTE');
  readonly estAccouchement = computed(() => ['NAISSANCE_VIVANTE', 'MORT_NE'].includes(this.issueFinale()));
  readonly dateFin = signal<string>(new Date().toISOString().slice(0, 10));
  readonly succesAction = signal<string | null>(null);
  readonly erreurAction = signal<string | null>(null);

  readonly segmentsProgression = computed<RingSegment[]>(() => {
    const g = this.grossesse();
    if (!g) return [];
    const restantes = Math.max(this.dureeGrossesseSemaines - g.semaineActuelle, 0);
    return [
      { label: 'Semaines écoulées', value: g.semaineActuelle, color: g.grossesseARisque ? 'var(--viz-2)' : 'var(--viz-1)' },
      { label: 'Semaines restantes', value: restantes, color: 'transparent' },
    ];
  });

  /** Rendez-vous triés : les prochains d'abord, puis les passés. */
  readonly rendezVousTries = computed(() => {
    const maintenant = Date.now();
    const liste = [...this.rendezVous()];
    const futurs = liste.filter((r) => new Date(r.dateHeure).getTime() >= maintenant).sort((a, b) => +new Date(a.dateHeure) - +new Date(b.dateHeure));
    const passes = liste.filter((r) => new Date(r.dateHeure).getTime() < maintenant).sort((a, b) => +new Date(b.dateHeure) - +new Date(a.dateHeure));
    return [...futurs, ...passes];
  });

  initiales(nom: string): string {
    return nom.replace(/\(.*\)/, '').trim().split(/\s+/).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('');
  }

  estPasse(dateHeure: string): boolean {
    return new Date(dateHeure).getTime() < Date.now();
  }

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    const id = Number(this.id());
    this.chargement.set(true);
    this.erreur.set(null);
    this.erreursBlocs.set({});

    this.grossesseService.obtenirParId(id).subscribe({
      next: (g) => {
        this.grossesse.set(g);
        this.chargement.set(false);
        this.chargerBlocs(g);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Impossible de charger cette grossesse.'));
        this.chargement.set(false);
      },
    });
  }

  /** Blocs secondaires chargés indépendamment : l'échec de l'un n'empêche pas les autres. */
  private chargerBlocs(g: GrossesseDto): void {
    const id = g.id;
    if (g.statut === 'EN_COURS') {
      this.grossesseService.obtenirSuivi(id).subscribe({
        next: (s) => this.suivi.set(s),
        error: (err) => this.erreurBloc('suivi', err),
      });
      this.grossesseService.obtenirCalendrier(id).subscribe({
        next: (c) => this.calendrier.set(c),
        error: (err) => this.erreurBloc('calendrier', err),
      });
      this.grossesseService.planCpn(id).subscribe({
        next: (p) => this.planCpn.set(p),
        error: (err) => this.erreurBloc('planCpn', err),
      });
    }
    this.rendezVousService.listerParGrossesse(id).subscribe({
      next: (liste) => this.rendezVous.set(liste),
      error: (err) => this.erreurBloc('rendezVous', err),
    });
    // Contenu clinique : réservé aux soignants qui suivent la patiente (jamais l'admin)
    if (this.estSoignant()) {
      this.consultationService.parGrossesse(id).subscribe({
        next: (liste) => this.consultations.set(liste),
        error: (err) => this.erreurBloc('consultations', err),
      });
      this.grossesseService.evaluationRisque(id).subscribe({
        next: (e) => this.evaluation.set(e),
        error: (err) => this.erreurBloc('evaluation', err),
      });
    }
  }

  private erreurBloc(bloc: string, err: unknown): void {
    this.erreursBlocs.update((e) => ({ ...e, [bloc]: messageErreur(err, 'Données indisponibles.') }));
  }

  /** Télécharge le dossier complet au format PDF (remplace le carnet papier). */
  exporterPdf(): void {
    const g = this.grossesse();
    if (!g) return;
    this.debutAction();
    this.grossesseService.exporterDossierPdf(g.id).subscribe({
      next: (pdf) => {
        telechargerFichier(pdf, nomDossierPdf(String(g.id)));
        this.finAction('Dossier PDF téléchargé.');
      },
      error: (err) => this.finAction(null, err),
    });
  }

  private debutAction(): void {
    this.actionEnCours.set(true);
    this.succesAction.set(null);
    this.erreurAction.set(null);
  }

  private finAction(succes: string | null, err?: unknown): void {
    this.actionEnCours.set(false);
    if (err !== undefined) {
      this.erreurAction.set(messageErreur(err, "L'opération a échoué."));
    } else {
      this.succesAction.set(succes);
    }
  }

  ouvrirFormulaireRisque(): void {
    // Pré-remplit le motif avec les facteurs détectés par le moteur de règles
    const facteurs = this.evaluation()?.facteurs ?? [];
    if (!this.motifRisque().trim() && facteurs.length > 0) {
      this.motifRisque.set(facteurs.join(' ; '));
    }
    this.formulaireRisqueOuvert.set(true);
  }

  confirmerRisque(): void {
    const g = this.grossesse();
    if (!g || !this.motifRisque().trim()) return;
    this.debutAction();
    this.grossesseService.declarerARisque(g.id, { motif: this.motifRisque().trim() }).subscribe({
      next: (maj) => {
        this.grossesse.set(maj);
        this.formulaireRisqueOuvert.set(false);
        this.motifRisque.set('');
        this.finAction('Grossesse déclarée à risque. La patiente a été informée du suivi renforcé.');
        this.chargerBlocs(maj);
      },
      error: (err) => this.finAction(null, err),
    });
  }

  retirerRisque(): void {
    const g = this.grossesse();
    if (!g) return;
    this.debutAction();
    this.grossesseService.retirerRisque(g.id).subscribe({
      next: (maj) => {
        this.grossesse.set(maj);
        this.finAction('Statut à risque retiré.');
        this.chargerBlocs(maj);
      },
      error: (err) => this.finAction(null, err),
    });
  }

  confirmerTerminer(): void {
    const g = this.grossesse();
    if (!g) return;
    this.debutAction();
    this.grossesseService.terminer(g.id, { issue: this.issueFinale(), dateFin: this.dateFin() }).subscribe({
      next: () => {
        this.formulaireTerminerOuvert.set(false);
        this.finAction('Grossesse clôturée. Les rendez-vous encore prévus ont été annulés.');
        this.charger();
      },
      error: (err) => this.finAction(null, err),
    });
  }

  rendezVousPlanifie(): void {
    this.formulairePlanifierOuvert.set(false);
    this.succesAction.set('Rendez-vous planifié. La patiente a été notifiée.');
    this.erreurAction.set(null);
    const g = this.grossesse();
    if (g) {
      this.chargerBlocs(g);
    }
  }
}
