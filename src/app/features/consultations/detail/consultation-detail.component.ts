import { Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ConsultationDto } from '../../../core/models/consultation.model';

@Component({
  selector: 'yay360-consultation-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './consultation-detail.component.html',
  styleUrl: './consultation-detail.component.scss',
})
export class ConsultationDetailComponent {
  private readonly consultationService = inject(ConsultationService);

  readonly id = input.required<string>();

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly consultation = signal<ConsultationDto | null>(null);

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.consultationService.obtenirParId(Number(this.id())).subscribe({
      next: (c) => {
        this.consultation.set(c);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger cette consultation.');
        this.chargement.set(false);
      },
    });
  }
}
