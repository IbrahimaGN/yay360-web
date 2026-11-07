import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { PlanCpnDto, StatutContactCpn } from '../../../core/models/grossesse.model';

/**
 * Frise des 8 contacts prénatals recommandés par l'OMS (2016), calculée par le moteur de
 * règles du backend : contacts réalisés, planifiés, à venir ou en retard.
 */
@Component({
  selector: 'yay360-plan-cpn',
  standalone: true,
  imports: [DatePipe, IconComponent],
  template: `
    @if (plan(); as p) {
      <div class="cpn">
        <div class="cpn__resume">
          <span class="cpn__count"><strong>{{ p.nombreRealises }}</strong> / {{ p.contacts.length }} consultations réalisées</span>
          @if (p.nombreEnRetard > 0) {
            <span class="cpn__late" role="status">
              <yay360-icon name="alert-triangle" [size]="14" aria-hidden="true" />
              {{ p.nombreEnRetard }} en retard
            </span>
          }
        </div>

        <ol class="cpn__frise">
          @for (c of p.contacts; track c.numero) {
            <li class="step" [class]="'step step--' + c.statut.toLowerCase()" [class.step--actuel]="estActuel(c.semaineCible)">
              <span class="step__dot" aria-hidden="true">
                @if (c.statut === 'REALISE') { <yay360-icon name="check" [size]="16" /> }
                @else if (c.statut === 'EN_RETARD') { ! }
                @else { {{ c.numero }} }
              </span>
              <span class="step__week">{{ c.semaineCible }} SA</span>
              <span class="step__status">{{ libelle(c.statut) }}</span>
              <span class="step__date">{{ (c.statut === 'REALISE' ? c.dateRealisation : c.dateCible) | date: 'd MMM' }}</span>
              <span class="sr-only">Consultation {{ c.numero }}</span>
            </li>
          }
        </ol>

        <p class="cpn__reference">{{ p.reference }}</p>
      </div>
    }
  `,
  styles: `
    .cpn__resume { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin-bottom: var(--s-5); font-size: var(--fs-sm); color: var(--t-muted); }
    .cpn__count strong { font-size: var(--fs-lg); color: var(--c-teal-ink); }
    .cpn__late {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 3px 10px; border-radius: var(--r-pill);
      background: var(--c-danger-soft); color: var(--c-danger); font-size: var(--fs-xs); font-weight: 600;
    }
    .cpn__frise {
      position: relative;
      display: grid;
      grid-template-columns: repeat(8, minmax(0, 1fr));
      gap: var(--s-1);
      margin: 0; padding: 0; list-style: none;
    }
    /* Ligne de liaison derrière les pastilles */
    .cpn__frise::before {
      content: ''; position: absolute; left: 6%; right: 6%; top: 19px; height: 3px;
      border-radius: 2px; background: var(--viz-track);
    }
    .step { position: relative; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
    .step__dot {
      display: grid; place-items: center;
      width: 40px; height: 40px; margin-bottom: var(--s-2);
      border-radius: 50%;
      border: 2px solid var(--b-strong);
      background: var(--c-surface);
      color: var(--t-muted);
      font-size: var(--fs-sm); font-weight: 600;
      box-shadow: 0 0 0 4px var(--c-surface);
    }
    .step__week { font-size: var(--fs-sm); font-weight: 600; color: var(--t-main); }
    .step__status { font-size: var(--fs-xs); color: var(--t-muted); }
    .step__date { font-size: 0.6875rem; color: var(--t-muted); }

    .step--realise .step__dot { background: var(--c-teal-dark); border-color: var(--c-teal-ink); color: var(--t-on-strong); }
    .step--realise .step__status { color: var(--c-teal-ink); }
    .step--planifie .step__dot { background: var(--c-orange); border-color: var(--c-orange-line); color: var(--t-on-accent); }
    .step--planifie .step__status { color: var(--c-orange-ink); }
    .step--en_retard .step__dot { background: var(--c-danger-soft); border-color: var(--c-danger); color: var(--c-danger); }
    .step--en_retard .step__status { color: var(--c-danger); font-weight: 600; }
    .step--actuel .step__dot { box-shadow: 0 0 0 4px var(--c-surface), 0 0 0 7px var(--c-orange-soft); }

    .cpn__reference { margin: var(--s-4) 0 0; font-size: var(--fs-xs); color: var(--t-muted); }

    @media (max-width: 767.98px) {
      .cpn__frise { grid-template-columns: repeat(4, minmax(0, 1fr)); row-gap: var(--s-5); }
      .cpn__frise::before { display: none; }
    }
  `,
})
export class PlanCpnComponent {
  readonly plan = input.required<PlanCpnDto | null>();

  /** Contact le plus proche de la semaine actuelle, mis en évidence. */
  private readonly prochaineCible = computed(() => {
    const p = this.plan();
    return p?.contacts.find((c) => c.statut !== 'REALISE' && c.semaineCible >= p.semaineActuelle - 2)?.semaineCible;
  });

  estActuel(semaineCible: number): boolean {
    return this.prochaineCible() === semaineCible;
  }

  libelle(statut: StatutContactCpn): string {
    return { REALISE: 'Réalisée', PLANIFIE: 'Planifiée', A_VENIR: 'À venir', EN_RETARD: 'En retard' }[statut];
  }
}
