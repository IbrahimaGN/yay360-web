import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/dashboard.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { RingChartComponent, RingSegment } from '../../shared/components/ring-chart/ring-chart.component';

interface BarreStatut {
  label: string;
  valeur: number;
  couleur: string;
}

@Component({
  selector: 'yay360-dashboard',
  standalone: true,
  imports: [StatCardComponent, RingChartComponent, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly data = signal<DashboardDto | null>(null);

  readonly segmentsTrimestre = computed<RingSegment[]>(() => {
    const d = this.data();
    if (!d) return [];
    const r = d.repartitionGrossessesParTrimestre ?? {};
    return [
      { label: 'T1', value: r['T1'] ?? 0, color: 'var(--c-primary)' },
      { label: 'T2', value: r['T2'] ?? 0, color: 'rgba(232, 93, 117, 0.65)' },
      { label: 'T3', value: r['T3'] ?? 0, color: 'var(--c-navy)' },
    ];
  });

  readonly barresRendezVous = computed<BarreStatut[]>(() => {
    const d = this.data();
    if (!d) return [];
    const r = d.repartitionRendezVousParStatut ?? {};
    return [
      { label: 'Planifiés', valeur: r['PLANIFIE'] ?? 0, couleur: 'var(--c-navy)' },
      { label: 'Confirmés', valeur: r['CONFIRME'] ?? 0, couleur: 'var(--c-primary)' },
      { label: 'Terminés', valeur: r['TERMINE'] ?? 0, couleur: 'rgba(232, 93, 117, 0.7)' },
      { label: 'Annulés', valeur: r['ANNULE'] ?? 0, couleur: 'var(--text-subtle)' },
      { label: 'Absences', valeur: r['ABSENT'] ?? 0, couleur: 'rgba(15, 23, 42, 0.4)' },
    ];
  });

  readonly maxBarreRendezVous = computed(() =>
    Math.max(1, ...this.barresRendezVous().map((b) => b.valeur))
  );

  readonly etablissementsTries = computed(() =>
    [...(this.data()?.activiteEtablissements ?? [])].sort((a, b) => b.nombreRendezVous - a.nombreRendezVous)
  );

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.dashboardService.obtenir().subscribe({
      next: (dashboard) => {
        this.data.set(dashboard);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set("Impossible de charger le tableau de bord. Réessayez.");
        this.chargement.set(false);
      },
    });
  }

  largeurBarre(valeur: number): string {
    return `${(valeur / this.maxBarreRendezVous()) * 100}%`;
  }
}
