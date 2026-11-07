import { DatePipe, TitleCasePipe } from '@angular/common';
import { StatutPipe } from '../../../shared/pipes/statut.pipe';
import { Component, computed, HostListener, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlerteDto } from '../../../core/models/alerte.model';
import {
  CalendrierGrossesseDto,
  GrossesseDto,
  SuiviHebdomadaireDto,
} from '../../../core/models/grossesse.model';
import { RendezVousDto } from '../../../core/models/rendez-vous.model';
import { ConsultationDto } from '../../../core/models/consultation.model';
import { AlerteService } from '../../../core/services/alerte.service';
import { AuthService } from '../../../core/services/auth.service';
import { EtablissementService } from '../../../core/services/etablissement.service';
import { EtablissementDto } from '../../../core/models/etablissement.model';
import { PlanCpnDto } from '../../../core/models/grossesse.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { TYPES_RENDEZ_VOUS, TYPES_SYMPTOME, libelleSymptome, libelleTypeRendezVous } from '../../../core/utils/libelles';
import { PlanCpnComponent } from '../../../shared/components/plan-cpn/plan-cpn.component';
import { ConsultationService } from '../../../core/services/consultation.service';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { RingChartComponent, RingSegment } from '../../../shared/components/ring-chart/ring-chart.component';

@Component({
  selector: 'yay360-suivi-prenatal',
  standalone: true,
  imports: [StatutPipe, DatePipe, TitleCasePipe, ReactiveFormsModule, IconComponent, PlanCpnComponent, RingChartComponent],
  templateUrl: './suivi-prenatal.component.html',
  styleUrl: './suivi-prenatal.component.scss',
})
export class SuiviPrenatalComponent implements OnInit {
  /** Ouverture directe d'une action depuis l'accueil : ?action=alerte | rendez-vous. */
  readonly action = input<string>();

  ngOnInit(): void {
    const a = this.action();
    if (a === 'alerte' || a === 'rendez-vous') this.ouvrirAction(a);
  }

  private readonly fb = inject(FormBuilder);
  private readonly grossesseService = inject(GrossesseService);
  private readonly rendezVousService = inject(RendezVousService);
  private readonly consultationService = inject(ConsultationService);
  private readonly alerteService = inject(AlerteService);
  private readonly authService = inject(AuthService);
  private readonly etablissementService = inject(EtablissementService);

  readonly typesSymptome = TYPES_SYMPTOME;
  readonly typesRendezVous = TYPES_RENDEZ_VOUS;
  readonly libelleSymptome = libelleSymptome;
  readonly libelleType = libelleTypeRendezVous;
  /** Seule la femme enceinte déclare la grossesse et choisit son établissement (le conjoint suit). */
  readonly estFemme = computed(() => this.authService.hasRole('FEMME_ENCEINTE'));
  readonly etablissements = signal<EtablissementDto[]>([]);
  readonly planCpn = signal<PlanCpnDto | null>(null);
  /** Réponse du triage au dernier signalement : consigne immédiate à afficher (§4.7). */
  readonly derniereAlerte = signal<AlerteDto | null>(null);
  readonly etablissementChoisi = signal<number | null>(null);
  readonly envoiEtablissement = signal(false);

  readonly chargement = signal(true);
  readonly envoiGrossesse = signal(false);
  readonly envoiRendezVous = signal(false);
  readonly envoiAlerte = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly grossesses = signal<GrossesseDto[]>([]);
  readonly calendrier = signal<CalendrierGrossesseDto | null>(null);
  readonly suivi = signal<SuiviHebdomadaireDto | null>(null);
  readonly rendezVous = signal<RendezVousDto[]>([]);
  readonly consultations = signal<ConsultationDto[]>([]);
  readonly alertes = signal<AlerteDto[]>([]);
  readonly actionOuverte = signal<'rendez-vous' | 'alerte' | 'dossier-medical' | null>(null);
  readonly joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  readonly moisCalendrier = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  readonly titreMoisCalendrier = computed(() =>
    this.moisCalendrier().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  );
  readonly joursCalendrier = computed(() => {
    const mois = this.moisCalendrier();
    const premierJour = new Date(mois.getFullYear(), mois.getMonth(), 1);
    const decalage = (premierJour.getDay() + 6) % 7;
    const debut = new Date(mois.getFullYear(), mois.getMonth(), 1 - decalage);
    const aujourdHui = this.cleDate(new Date());
    const rendezVousActifs = this.rendezVous().filter(
      (rendezVous) => rendezVous.statut === 'PLANIFIE' || rendezVous.statut === 'CONFIRME'
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(debut.getFullYear(), debut.getMonth(), debut.getDate() + index);
      const cle = this.cleDate(date);
      return {
        date,
        dansMois: date.getMonth() === mois.getMonth(),
        estAujourdhui: cle === aujourdHui,
        rendezVous: rendezVousActifs.filter(
          (rendezVous) => this.cleDate(new Date(rendezVous.dateHeure)) === cle
        ),
      };
    });
  });
  readonly prochainsRendezVous = computed(() => {
    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);
    return this.rendezVous()
      .filter((rendezVous) => {
        const date = new Date(rendezVous.dateHeure);
        return date >= aujourdHui && (rendezVous.statut === 'PLANIFIE' || rendezVous.statut === 'CONFIRME');
      })
      .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime())
      .slice(0, 3);
  });

  /** Anneau d'avancement sur 40 semaines. */
  readonly anneau = computed<RingSegment[]>(() => {
    const g = this.grossesseActive();
    if (!g) return [];
    const s = Math.min(g.semaineActuelle, 40);
    return [
      { label: 'Semaines écoulées', value: s, color: g.grossesseARisque ? 'var(--viz-2)' : 'var(--viz-1)' },
      { label: 'Semaines restantes', value: 40 - s, color: 'transparent' },
    ];
  });

  readonly grossesseActive = computed(
    () => this.grossesses().find((grossesse) => grossesse.statut === 'EN_COURS') ?? null
  );
  readonly formGrossesse = this.fb.group({
    dateDernieresRegles: ['', Validators.required],
    nombreGrossessesPrecedentes: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
    antecedents: ['', [Validators.maxLength(2000)]],
    etablissementId: [null as number | null],
  });

  readonly formRendezVous = this.fb.group({
    grossesseId: [null as number | null, Validators.required],
    dateHeure: ['', Validators.required],
    type: ['CONSULTATION_PRENATALE', Validators.required],
    motif: [''],
  });

  readonly formAlerte = this.fb.group({
    grossesseId: [null as number | null, Validators.required],
    typeSymptome: ['', Validators.required],
    description: ['', [Validators.maxLength(1000)]],
  });

  constructor() {
    this.charger();
    this.etablissementService.listerActifs().subscribe({
      next: (liste) => this.etablissements.set(liste),
    });
  }

  choisirEtablissement(): void {
    const id = this.etablissementChoisi();
    if (!id) return;
    this.envoiEtablissement.set(true);
    this.erreur.set(null);
    this.message.set(null);
    this.grossesseService.choisirEtablissement({ etablissementId: id }).subscribe({
      next: () => {
        this.envoiEtablissement.set(false);
        this.message.set('Votre établissement de suivi a été enregistré : ses soignants peuvent désormais vous suivre.');
        this.charger();
      },
      error: (err) => {
        this.envoiEtablissement.set(false);
        this.erreur.set(messageErreur(err, "Impossible d'enregistrer cet établissement."));
      },
    });
  }

  ouvrirAction(action: 'rendez-vous' | 'alerte' | 'dossier-medical'): void {
    this.actionOuverte.set(action);
  }

  fermerAction(): void {
    this.actionOuverte.set(null);
  }

  @HostListener('document:keydown.escape')
  fermerActionAvecEchap(): void {
    this.fermerAction();
  }

  changerMois(decalage: number): void {
    this.moisCalendrier.update(
      (mois) => new Date(mois.getFullYear(), mois.getMonth() + decalage, 1)
    );
  }

  semaineGrossesseAuRendezVous(dateHeure: string): number | null {
    const grossesse = this.grossesseActive();
    const dateRegles = new Date(`${grossesse?.dateDernieresRegles}T00:00:00`);
    const dateRendezVous = new Date(dateHeure);
    if (!grossesse || Number.isNaN(dateRegles.getTime()) || Number.isNaN(dateRendezVous.getTime())) {
      return null;
    }

    const debutGrossesse = Date.UTC(
      dateRegles.getFullYear(),
      dateRegles.getMonth(),
      dateRegles.getDate()
    );
    const jourRendezVous = Date.UTC(
      dateRendezVous.getFullYear(),
      dateRendezVous.getMonth(),
      dateRendezVous.getDate()
    );
    const joursEcoules = Math.floor((jourRendezVous - debutGrossesse) / 86_400_000);
    return joursEcoules < 0 ? null : Math.floor(joursEcoules / 7) + 1;
  }

  private cleDate(date: Date): string {
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.grossesseService.obtenirMonHistorique().subscribe({
      next: (grossesses) => {
        this.grossesses.set(grossesses);
        const grossesse = grossesses.find((dossier) => dossier.statut === 'EN_COURS');
        if (grossesse) {
          this.formRendezVous.patchValue({ grossesseId: grossesse.id });
          this.formAlerte.patchValue({ grossesseId: grossesse.id });
        }
        this.chargement.set(false);
        const active = grossesses.find((grossesse) => grossesse.statut === 'EN_COURS');
        if (active) {
          this.chargerCalendrierEtSuivi();
        } else {
          this.calendrier.set(null);
          this.suivi.set(null);
        }
      },
      error: () => {
        this.chargement.set(false);
        this.erreur.set("Impossible de charger l'historique du dossier familial.");
      },
    });
    this.chargerRendezVous();
    this.chargerConsultations();
    this.chargerAlertes();
  }

  declarerGrossesse(): void {
    if (this.formGrossesse.invalid) {
      this.formGrossesse.markAllAsTouched();
      return;
    }
    const value = this.formGrossesse.getRawValue();
    this.envoiGrossesse.set(true);
    this.erreur.set(null);
    this.message.set(null);
    this.grossesseService
      .declarer({
        dateDernieresRegles: value.dateDernieresRegles!,
        nombreGrossessesPrecedentes: value.nombreGrossessesPrecedentes ?? 0,
        antecedents: value.antecedents?.trim() || undefined,
        etablissementId: value.etablissementId,
      })
      .subscribe({
        next: () => {
          this.envoiGrossesse.set(false);
          this.message.set('La grossesse a été déclarée dans le dossier familial.');
          this.formGrossesse.reset({ dateDernieresRegles: '', nombreGrossessesPrecedentes: 0, antecedents: '', etablissementId: null });
          this.charger();
        },
        error: (error) => {
          this.envoiGrossesse.set(false);
          this.erreur.set(messageErreur(error, 'Impossible de déclarer cette grossesse. Vérifiez la date saisie.'));
        },
      });
  }

  prendreRendezVous(): void {
    if (this.formRendezVous.invalid) {
      this.formRendezVous.markAllAsTouched();
      return;
    }
    const value = this.formRendezVous.getRawValue();
    this.envoiRendezVous.set(true);
    this.erreur.set(null);
    this.message.set(null);
    this.rendezVousService
      .prendre({
        dateHeure: value.dateHeure!,
        grossesseId: value.grossesseId ?? undefined,
        type: value.type!,
        motif: value.motif?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.envoiRendezVous.set(false);
          this.message.set('Votre demande de rendez-vous a été enregistrée.');
          this.fermerAction();
          this.formRendezVous.reset({
            grossesseId: this.grossesseActive()?.id ?? null,
            dateHeure: '',
            type: 'CONSULTATION_PRENATALE',
            motif: '',
          });
          this.chargerRendezVous();
        },
        error: (error) => {
          this.envoiRendezVous.set(false);
          this.erreur.set(messageErreur(error, 'Impossible de prendre ce rendez-vous. Vérifiez la date choisie.'));
        },
      });
  }

  declarerSymptome(): void {
    if (this.formAlerte.invalid) {
      this.formAlerte.markAllAsTouched();
      return;
    }

    const value = this.formAlerte.getRawValue();
    this.envoiAlerte.set(true);
    this.erreur.set(null);
    this.message.set(null);
    this.alerteService
      .declarer({
        grossesseId: value.grossesseId!,
        typeSymptome: value.typeSymptome!,
        description: value.description?.trim() || undefined,
      })
      .subscribe({
        next: (alerte) => {
          this.envoiAlerte.set(false);
          this.derniereAlerte.set(alerte);
          this.fermerAction();
          this.formAlerte.reset({
            grossesseId: this.grossesseActive()?.id ?? null,
            typeSymptome: '',
            description: '',
          });
          this.chargerAlertes();
        },
        error: (error) => {
          this.envoiAlerte.set(false);
          this.erreur.set(messageErreur(error, 'Impossible de transmettre ce symptôme. En cas d’urgence, rendez-vous immédiatement dans un établissement de santé.'));
        },
      });
  }

  private chargerCalendrierEtSuivi(): void {
    this.grossesseService.obtenirMonCalendrier().subscribe({
      next: (calendrier) => this.calendrier.set(calendrier),
      error: () => this.erreur.set('Impossible de charger le calendrier de grossesse.'),
    });
    this.grossesseService.monPlanCpn().subscribe({
      next: (plan) => this.planCpn.set(plan),
    });
    this.grossesseService.obtenirMonSuivi().subscribe({
      next: (suivi) => this.suivi.set(suivi),
      error: () => this.erreur.set('Impossible de charger les conseils de la semaine.'),
    });
  }

  private chargerRendezVous(): void {
    this.rendezVousService.mesRendezVous().subscribe({
      next: (rendezVous) => this.rendezVous.set(rendezVous),
      error: () => this.erreur.set('Impossible de charger les rendez-vous du dossier familial.'),
    });
  }

  private chargerConsultations(): void {
    this.consultationService.mesConsultations().subscribe({
      next: (consultations) => this.consultations.set(consultations),
      error: () => this.erreur.set('Impossible de charger les consultations du dossier familial.'),
    });
  }

  private chargerAlertes(): void {
    this.alerteService.mesAlertes().subscribe({
      next: (alertes) => this.alertes.set(alertes),
      error: () => this.erreur.set('Impossible de charger les alertes du dossier familial.'),
    });
  }
}
