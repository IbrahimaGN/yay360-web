import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RendezVousService } from '../../core/services/rendez-vous.service';
import { AuthService } from '../../core/services/auth.service';
import { RendezVousDto, StatutRendezVous } from '../../core/models/rendez-vous.model';

type CleOnglet = 'MON_PLANNING' | StatutRendezVous;

interface Onglet {
  cle: CleOnglet;
  label: string;
}

@Component({
  selector: 'yay360-rendez-vous-liste',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './rendez-vous-liste.component.html',
  styleUrl: './rendez-vous-liste.component.scss',
})
export class RendezVousListeComponent {
  private readonly rendezVousService = inject(RendezVousService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly estProfessionnel = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly onglets = computed<Onglet[]>(() => [
    ...(this.estProfessionnel() ? [{ cle: 'MON_PLANNING' as CleOnglet, label: 'Mon planning' }] : []),
    { cle: 'PLANIFIE', label: 'Planifiés' },
    { cle: 'CONFIRME', label: 'Confirmés' },
    { cle: 'TERMINE', label: 'Terminés' },
    { cle: 'ANNULE', label: 'Annulés' },
    { cle: 'ABSENT', label: 'Absences' },
  ]);

  readonly ongletActif = signal<CleOnglet>('PLANIFIE');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly rendezVous = signal<RendezVousDto[]>([]);
  readonly idEnAction = signal<number | null>(null);
  readonly rendezVousGrossesse = computed(() => this.rendezVous());

  constructor() {
    this.ongletActif.set('PLANIFIE');
    this.charger();
  }

  changerOnglet(cle: CleOnglet): void {
    if (cle === this.ongletActif()) return;
    this.ongletActif.set(cle);
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    const cle = this.ongletActif();
    const requete = cle === 'MON_PLANNING'
      ? this.rendezVousService.monPlanning()
      : this.rendezVousService.listerParStatut(cle);

    requete.subscribe({
      next: (liste) => {
        this.rendezVous.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les rendez-vous.');
        this.chargement.set(false);
      },
    });
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

  annuler(rdv: RendezVousDto): void {
    this.idEnAction.set(rdv.id);
    this.rendezVousService.annuler(rdv.id).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }

  enregistrerConsultation(rdv: RendezVousDto): void {
    this.router.navigate(['/consultations/nouvelle'], {
      queryParams: { grossesseId: rdv.grossesseId, rendezVousId: rdv.id },
    });
  }

  private appliquerStatut(rdv: RendezVousDto, statut: StatutRendezVous): void {
    this.idEnAction.set(rdv.id);
    this.rendezVousService.changerStatut(rdv.id, { statut }).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }
}
