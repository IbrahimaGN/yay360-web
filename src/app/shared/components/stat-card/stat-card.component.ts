import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { IconName } from '../../../core/models/nav-item.model';

@Component({
  selector: 'yay360-stat-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="stat-card">
      <div class="stat-card__icon" [style.background]="iconBg()" [style.color]="iconColor()">
        <yay360-icon [name]="icon()" [size]="22" />
      </div>
      <div class="stat-card__body">
        <span class="stat-card__value">{{ valeur() }}</span>
        <span class="stat-card__label">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: `
    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--c-surface);
      border: 1px solid var(--b-light);
      border-radius: var(--r-xl);
      box-shadow: var(--sh-xs);
      padding: 1rem;
      transition: all var(--t-base);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--sh-sm);
        border-color: var(--c-teal);
      }
    }
    .stat-card__icon {
      width: 42px;
      height: 42px;
      border-radius: var(--r-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform var(--t-fast);
    }
    .stat-card:hover .stat-card__icon {
      transform: scale(1.06);
    }
    .stat-card__body {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }
    .stat-card__value {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.1;
      color: var(--t-main);
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .stat-card__label {
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.35;
      color: var(--t-muted);
      margin-top: 0.3rem;
    }
    @media (max-width: 479.98px) {
      .stat-card { flex-direction: column; align-items: flex-start; gap: 0.6rem; padding: 0.875rem; }
      .stat-card__value { font-size: 1.5rem; }
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly valeur = input.required<number | string>();
  readonly icon = input.required<IconName>();
  readonly iconColor = input<string>('var(--c-teal-ink)');
  readonly iconBg = input<string>('var(--c-teal-soft)');
}
