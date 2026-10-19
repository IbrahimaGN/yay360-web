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
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="82" class="ring-chart__track" />
        @for (segment of segments(); track segment.label) {
          <circle
            cx="100" cy="100" r="82"
            fill="none"
            [attr.stroke]="segment.color"
            stroke-width="16"
            stroke-linecap="round"
            transform="rotate(-90 100 100)"
            [attr.stroke-dasharray]="segment.dasharray"
            [attr.stroke-dashoffset]="segment.dashoffset"
            class="ring-chart__segment"
          />
        }
      </svg>
      <div class="ring-chart__center">
        <span class="ring-chart__value">{{ total() }}</span>
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
      stroke: var(--c-surface-subtle);
      stroke-width: 16;
    }
    .ring-chart__segment {
      transition: stroke-dasharray var(--trans-base), stroke-dashoffset var(--trans-base);
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
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .ring-chart__label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-top: 0.25rem;
      font-weight: 600;
    }
  `,
})
export class RingChartComponent {
  readonly data = input.required<RingSegment[]>();
  readonly size = input<number>(180);
  readonly centerLabel = input<string>('total');

  private static readonly CIRCUMFERENCE = 2 * Math.PI * 82;

  readonly total = computed(() => this.data().reduce((acc, s) => acc + s.value, 0));

  readonly segments = computed<ComputedSegment[]>(() => {
    const total = this.total() || 1;
    const c = RingChartComponent.CIRCUMFERENCE;
    let cumulative = 0;

    return this.data().map((segment) => {
      const longueur = (segment.value / total) * c;
      const espace = Math.max(longueur - 3, 0);
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
