import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlerteService } from '../../core/services/alerte.service';
import { AuthService } from '../../core/services/auth.service';
import { AlerteDto, StatutAlerte } from '../../core/models/alerte.model';

type CleOnglet = 'URGENTES' | StatutAlerte;

@Component({
  selector: 'yay360-alertes-liste',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './alertes-liste.component.html',
  styleUrl: './alertes-liste.component.scss',
})
export class AlertesListeComponent {
  private readonly alerteService = inject(AlerteService);
  private readonly authService = inject(AuthService);

  readonly peutAgir = computed(() => this.authService.hasRole('MEDECIN', 'SAGE_FEMME'));

  readonly onglets: { cle: CleOnglet; label: string }[] = [
    { cle: 'URGENTES', label: 'Urgentes' },
    { cle: 'NOUVELLE', label: 'Nouvelles' },
    { cle: 'PRISE_EN_CHARGE', label: 'Prises en charge' },
    { cle: 'RESOLUE', label: 'Résolues' },
  ];

  readonly ongletActif = signal<CleOnglet>('NOUVELLE');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly alertes = signal<AlerteDto[]>([]);
  readonly idEnAction = signal<number | null>(null);
  readonly notesParAlerte = signal<Record<number, string>>({});
  readonly formulaireResolutionOuvert = signal<number | null>(null);
  readonly alertesGrossesse = computed(() => this.alertes());

  constructor() {
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
    const requete = cle === 'URGENTES'
      ? this.alerteService.listerUrgentes()
      : this.alerteService.listerParStatut(cle);

    requete.subscribe({
      next: (liste) => {
        this.alertes.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les alertes.');
        this.chargement.set(false);
      },
    });
  }

  prendreEnCharge(alerte: AlerteDto): void {
    this.idEnAction.set(alerte.id);
    this.alerteService.prendreEnCharge(alerte.id).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }

  ouvrirResolution(alerte: AlerteDto): void {
    this.formulaireResolutionOuvert.set(alerte.id);
  }

  mettreAJourNote(alerteId: number, valeur: string): void {
    this.notesParAlerte.update((notes) => ({ ...notes, [alerteId]: valeur }));
  }

  confirmerResolution(alerte: AlerteDto): void {
    this.idEnAction.set(alerte.id);
    const notes = this.notesParAlerte()[alerte.id] ?? '';

    this.alerteService.resoudre(alerte.id, { notesPriseEnCharge: notes }).subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.formulaireResolutionOuvert.set(null);
        this.charger();
      },
      error: () => this.idEnAction.set(null),
    });
  }
}
