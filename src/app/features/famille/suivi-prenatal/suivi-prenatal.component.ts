import { DatePipe, LowerCasePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, HostListener, inject, signal } from '@angular/core';
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
import { ConsultationService } from '../../../core/services/consultation.service';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { RendezVousService } from '../../../core/services/rendez-vous.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'yay360-suivi-prenatal',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, TitleCasePipe, ReactiveFormsModule, IconComponent],
  templateUrl: './suivi-prenatal.component.html',
  styleUrl: './suivi-prenatal.component.scss',
})
export class SuiviPrenatalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly grossesseService = inject(GrossesseService);
  private readonly rendezVousService = inject(RendezVousService);
  private readonly consultationService = inject(ConsultationService);
  private readonly alerteService = inject(AlerteService);

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

  readonly grossesseActive = computed(
    () => this.grossesses().find((grossesse) => grossesse.statut === 'EN_COURS') ?? null
  );
  readonly formGrossesse = this.fb.group({
    dateDernieresRegles: ['', Validators.required],
    nombreGrossessesPrecedentes: [0, [Validators.required, Validators.min(0), Validators.max(20)]],
    antecedents: [''],
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
    description: [''],
  });

  constructor() {
    this.charger();
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
      })
      .subscribe({
        next: () => {
          this.envoiGrossesse.set(false);
          this.message.set('La grossesse a été déclarée dans le dossier familial.');
          this.formGrossesse.reset({ dateDernieresRegles: '', nombreGrossessesPrecedentes: 0, antecedents: '' });
          this.charger();
        },
        error: (error) => {
          this.envoiGrossesse.set(false);
          this.erreur.set(error?.error?.message ?? 'Impossible de déclarer cette grossesse. Vérifiez la date saisie.');
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
          this.erreur.set(error?.error?.message ?? 'Impossible de prendre ce rendez-vous. Vérifiez la date choisie.');
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
        next: () => {
          this.envoiAlerte.set(false);
          this.message.set('Le symptôme a été transmis à l’équipe de suivi.');
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
          this.erreur.set(error?.error?.message ?? 'Impossible de transmettre ce symptôme. Réessayez.');
        },
      });
  }

  private chargerCalendrierEtSuivi(): void {
    this.grossesseService.obtenirMonCalendrier().subscribe({
      next: (calendrier) => this.calendrier.set(calendrier),
      error: () => this.erreur.set('Impossible de charger le calendrier de grossesse.'),
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
