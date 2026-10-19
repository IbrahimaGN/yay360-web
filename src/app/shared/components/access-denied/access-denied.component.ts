import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'yay360-access-denied',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="denied-page">
      <div class="denied-card">
        <div class="denied-badge">
          <span class="denied-badge__dot"></span>
          <span>Erreur 403</span>
        </div>
        <h1>Accès restreint</h1>
        <p>Votre rôle actuel ne vous accorde pas les privilèges nécessaires pour consulter cette ressource médicale.</p>
        <a routerLink="/" class="yay-btn yay-btn--primary">
          <span>Retour à l'accueil</span>
        </a>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; min-height: 100vh; }
    .denied-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-base);
      padding: var(--space-5);
      transition: background var(--ease-base);
    }
    .denied-card {
      max-width: 420px;
      width: 100%;
      text-align: center;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: clamp(2rem, 5vw, 3rem);
      animation: scaleIn 260ms var(--ease-base) both;
    }
    .denied-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 4px 12px;
      border-radius: var(--radius-pill);
      background: var(--danger-bg);
      border: 1px solid var(--danger-border);
      color: var(--danger-text);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      font-weight: 700;
      margin-bottom: var(--space-4);
    }
    .denied-badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--clr-red);
    }
    h1 {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin: 0 0 var(--space-2);
      color: var(--text-primary);
    }
    p {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: 1.6;
      margin-bottom: var(--space-6);
    }
  `,
})
export class AccessDeniedComponent {}
