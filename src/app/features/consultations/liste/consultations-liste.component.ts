import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ConsultationDto } from '../../../core/models/consultation.model';

@Component({
  selector: 'yay360-consultations-liste',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './consultations-liste.component.html',
  styleUrl: './consultations-liste.component.scss',
})
export class ConsultationsListeComponent {
  private readonly consultationService = inject(ConsultationService);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly consultations = signal<ConsultationDto[]>([]);

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.consultationService.monActivite().subscribe({
      next: (liste) => {
        this.consultations.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger vos consultations.');
        this.chargement.set(false);
      },
    });
  }
}
