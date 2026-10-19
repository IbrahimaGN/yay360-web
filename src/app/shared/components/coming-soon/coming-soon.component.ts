import { Component, input } from '@angular/core';

@Component({
  selector: 'yay360-coming-soon',
  standalone: true,
  template: `
    <div class="coming-soon">
      <div class="coming-soon__ring">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" stroke-width="6"/>
          <path d="M32 6 A26 26 0 0 1 52 24" fill="none" stroke="var(--clr-primary)" stroke-width="6" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="yay-eyebrow">Module en développement</p>
      <h2>{{ titre() }}</h2>
      <p class="coming-soon__text">{{ description() }}</p>
    </div>
  `,
  styles: `
    .coming-soon {
      max-width: 460px;
      margin: var(--space-8) auto;
      text-align: center;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
      padding: var(--space-8) var(--space-6);
      animation: scaleIn 260ms var(--ease-base) both;
    }
    .coming-soon__ring {
      width: 64px;
      height: 64px;
      margin: 0 auto var(--space-4);
      filter: drop-shadow(0 4px 12px rgba(232, 99, 107, 0.25));
    }
    .coming-soon__ring svg {
      width: 100%;
      height: 100%;
      animation: spin 16s linear infinite;
    }
    .yay-eyebrow {
      color: var(--clr-primary);
      font-weight: 600;
      margin-bottom: var(--space-2);
    }
    h2 {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }
    .coming-soon__text {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: 1.6;
    }
  `,
})
export class ComingSoonComponent {
  readonly titre = input<string>('Ce module arrive bientôt');
  readonly description = input<string>(
    'Cette section sera construite lors d\'une prochaine étape.'
  );
}
