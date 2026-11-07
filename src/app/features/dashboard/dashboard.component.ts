import { Component, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardDto } from '../../core/models/dashboard.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';
import { RingChartComponent, RingSegment } from '../../shared/components/ring-chart/ring-chart.component';

interface Barre {
  label: string;
  valeur: number;
}

@Component({
  selector: 'yay360-dashboard',
  standalone: true,
  imports: [StateComponent, RingChartComponent, IconComponent, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly data = signal<DashboardDto | null>(null);

  /** Activité générale. */
  readonly kpis = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'Patientes enregistrées', valeur: d.nombreFemmesEnceintes, icone: 'heart' as IconName, ton: 'teal' },
      { label: 'Grossesses en cours', valeur: d.nombreGrossessesActives, icone: 'activity' as IconName, ton: 'orange' },
      { label: 'Consultations réalisées', valeur: d.nombreConsultations, icone: 'clipboard' as IconName, ton: 'lilac' },
      { label: 'Rendez-vous enregistrés', valeur: d.nombreRendezVous, icone: 'calendar' as IconName, ton: 'teal' },
    ];
  });

  /** Jauge circulaire : un seul segment rempli sur 100. */
  jauge(pourcentage: number, couleur: string, libelle: string): RingSegment[] {
    const p = Math.max(0, Math.min(100, pourcentage ?? 0));
    return [
      { label: libelle, value: p, color: couleur },
      { label: 'Reste', value: 100 - p, color: 'transparent' },
    ];
  }

  readonly segmentsTrimestre = computed<RingSegment[]>(() => {
    const r = this.data()?.repartitionGrossessesParTrimestre ?? {};
    return [
      { label: '1er trimestre', value: r['T1'] ?? 0, color: 'var(--viz-1)' },
      { label: '2e trimestre', value: r['T2'] ?? 0, color: 'var(--viz-2)' },
      { label: '3e trimestre', value: r['T3'] ?? 0, color: 'var(--viz-3)' },
    ];
  });
  readonly totalTrimestres = computed(() => this.segmentsTrimestre().reduce((a, s) => a + s.value, 0));

  readonly issues = computed<Barre[]>(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'En cours', valeur: d.nombreGrossessesActives },
      { label: 'Accouchements', valeur: d.nombreGrossessesTerminees },
      { label: 'Interrompues', valeur: d.nombreGrossessesInterrompues },
    ];
  });

  readonly barresRendezVous = computed<Barre[]>(() => {
    const r = this.data()?.repartitionRendezVousParStatut ?? {};
    return [
      { label: 'Planifiés', valeur: r['PLANIFIE'] ?? 0 },
      { label: 'Confirmés', valeur: r['CONFIRME'] ?? 0 },
      { label: 'Terminés', valeur: r['TERMINE'] ?? 0 },
      { label: 'Annulés', valeur: r['ANNULE'] ?? 0 },
      { label: 'Absences', valeur: r['ABSENT'] ?? 0 },
    ];
  });

  /** Statuts des alertes (couleurs d'état + icône + libellé, jamais la couleur seule). */
  readonly statutsAlertes = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { label: 'Urgentes non résolues', valeur: d.nombreAlertesUrgentes, icone: 'alert-triangle' as IconName, ton: 'danger' },
      { label: 'Nouvelles', valeur: d.nombreAlertesNouvelles, icone: 'bell' as IconName, ton: 'warning' },
      { label: 'Prises en charge', valeur: d.nombreAlertesPrisesEnCharge, icone: 'activity' as IconName, ton: 'info' },
      { label: 'Résolues', valeur: d.nombreAlertesResolues, icone: 'check' as IconName, ton: 'success' },
    ];
  });

  readonly gravites = computed(() => {
    const r = this.data()?.repartitionAlertesNonResoluesParGravite ?? {};
    const items = [
      { label: 'Urgente', valeur: r['URGENT'] ?? 0, ton: 'danger' },
      { label: 'Élevée', valeur: r['ELEVE'] ?? 0, ton: 'warning' },
      { label: 'Modérée', valeur: r['MODERE'] ?? 0, ton: 'info' },
    ];
    const total = items.reduce((a, i) => a + i.valeur, 0);
    return { items, total };
  });

  readonly etablissementsTries = computed(() =>
    [...(this.data()?.activiteEtablissements ?? [])].sort((a, b) => b.nombreRendezVous - a.nombreRendezVous)
  );

  /** Délai moyen lisible : « 45 min », « 2 h 10 », ou « — » sans donnée. */
  readonly delaiPriseEnCharge = computed(() => {
    const minutes = this.data()?.delaiMoyenPriseEnChargeMinutes;
    if (minutes === null || minutes === undefined) return '—';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  });

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
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Impossible de charger le tableau de bord. Réessayez.'));
        this.chargement.set(false);
      },
    });
  }

  /** Largeur d'une barre relative au maximum de sa série. */
  largeur(valeur: number, serie: Barre[] | { nombreRendezVous: number }[]): string {
    const valeurs = serie.map((b) => ('valeur' in b ? b.valeur : b.nombreRendezVous));
    const max = Math.max(1, ...valeurs);
    return `${(valeur / max) * 100}%`;
  }

  pourcentage(valeur: number, total: number): number {
    return total ? Math.round((valeur / total) * 100) : 0;
  }
}
