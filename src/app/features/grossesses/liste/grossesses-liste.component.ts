import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GrossesseService } from '../../../core/services/grossesse.service';
import { GrossesseDto } from '../../../core/models/grossesse.model';

@Component({
  selector: 'yay360-grossesses-liste',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './grossesses-liste.component.html',
  styleUrl: './grossesses-liste.component.scss',
})
export class GrossessesListeComponent {
  private readonly grossesseService = inject(GrossesseService);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly grossesses = signal<GrossesseDto[]>([]);
  readonly recherche = signal('');

  readonly grossessesFiltrees = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    return this.grossesses().filter((grossesse) =>
      grossesse.femmeEnceinteNomComplet.toLowerCase().includes(terme)
    );
  });

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.grossesseService.listerActives().subscribe({
      next: (liste) => {
        this.grossesses.set(liste);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger la liste des grossesses.');
        this.chargement.set(false);
      },
    });
  }

}
