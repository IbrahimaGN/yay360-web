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
      border: 1px solid var(--border-light);
      border-radius: var(--r-xl);
      box-shadow: var(--shadow-sm);
      padding: 1rem;
      transition: all var(--trans-base);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: rgba(232, 93, 117, 0.35);
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
      transition: transform var(--trans-fast);
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
      font-size: 1.85rem;
      font-weight: 700;
      line-height: 1.1;
      color: var(--text-main);
      letter-spacing: -0.02em;
      font-family: var(--font-body);
    }
    .stat-card__label {
      font-size: clamp(0.5rem, 0.62vw, 0.62rem);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.015em;
      color: var(--text-muted);
      margin-top: 0.35rem;
      white-space: nowrap;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly valeur = input.required<number | string>();
  readonly icon = input.required<IconName>();
  readonly iconColor = input<string>('var(--c-primary)');
  readonly iconBg = input<string>('var(--c-primary-soft)');
}
