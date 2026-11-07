import { Component, computed, input } from '@angular/core';

export interface RingSegment {
  label: string;
  value: number;
  color: string;
}

interface ComputedSegment extends RingSegment {
  dasharray: string;
  dashoffset: string;
}

@Component({
  selector: 'yay360-ring-chart',
  standalone: true,
  template: `
    <div class="ring-chart" [style.width.px]="size()" [style.height.px]="size()">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="82" class="ring-chart__track" [attr.stroke-width]="epaisseur()" />
        @for (segment of segments(); track segment.label) {
          <circle
            cx="100" cy="100" r="82"
            fill="none"
            [style.stroke]="segment.color"
            [attr.stroke-width]="epaisseur()"
            stroke-linecap="butt"
            transform="rotate(-90 100 100)"
            [attr.stroke-dasharray]="segment.dasharray"
            [attr.stroke-dashoffset]="segment.dashoffset"
            class="ring-chart__segment"
          ><title>{{ segment.label }} : {{ segment.value }}</title></circle>
        }
      </svg>
      <div class="ring-chart__center">
        <span class="ring-chart__value">{{ centerValue() ?? total() }}</span>
        <span class="ring-chart__label">{{ centerLabel() }}</span>
      </div>
    </div>
  `,
  styles: `
    .ring-chart {
      position: relative;
      display: inline-block;
    }
    .ring-chart svg {
      width: 100%;
      height: 100%;
    }
    .ring-chart__track {
      fill: none;
      stroke: var(--viz-track);
    }
    .ring-chart__segment {
      pointer-events: stroke;
      transition: stroke-dasharray var(--t-base), stroke-dashoffset var(--t-base);
      @media (prefers-reduced-motion: reduce) { transition: none; }
    }
    .ring-chart__center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      pointer-events: none;
    }
    .ring-chart__value {
      font-size: var(--fs-2xl);
      font-weight: 600;
      color: var(--t-main);
      line-height: 1;
    }
    .ring-chart__label {
      font-size: var(--fs-xs);
      color: var(--t-muted);
      margin-top: 4px;
      max-width: 70%;
    }
  `,
})
export class RingChartComponent {
  readonly data = input.required<RingSegment[]>();
  readonly size = input<number>(180);
  readonly centerLabel = input<string>('total');
  /** Épaisseur de l'anneau (unités du viewBox de 200). */
  readonly epaisseur = input<number>(14);
  /** Valeur affichée au centre (par défaut : somme des segments). */
  readonly centerValue = input<number | string | null>(null);

  private static readonly CIRCUMFERENCE = 2 * Math.PI * 82;

  readonly total = computed(() => this.data().reduce((acc, s) => acc + s.value, 0));

  readonly segments = computed<ComputedSegment[]>(() => {
    const total = this.total() || 1;
    const c = RingChartComponent.CIRCUMFERENCE;
    let cumulative = 0;

    return this.data().map((segment) => {
      const longueur = (segment.value / total) * c;
      // 2 unités d'écart entre segments (séparation visuelle)
      const espace = segment.value > 0 ? Math.max(longueur - 4, 0.01) : 0;
      const computed: ComputedSegment = {
        ...segment,
        dasharray: `${espace} ${c}`,
        dashoffset: `${-cumulative}`,
      };
      cumulative += longueur;
      return computed;
    });
  });
}
