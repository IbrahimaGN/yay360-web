import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type TypeEtat = 'chargement' | 'erreur' | 'vide' | 'succes';

/**
 * État d'une zone de contenu : chargement, erreur (avec « Réessayer »),
 * absence de données ou succès. À utiliser sur toutes les pages plutôt
 * que des blocs *-loading / *-error / *-empty locaux.
 *
 *   <yay360-state type="chargement" message="Chargement des rendez-vous…" />
 *   <yay360-state type="erreur" [message]="erreur()" (reessayer)="charger()" />
 *   <yay360-state type="vide" titre="Aucun rendez-vous" message="…">
 *     <button class="pro-btn pro-btn--primary">Planifier</button>   ← action facultative
 *   </yay360-state>
 */
@Component({
  selector: 'yay360-state',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="state" [class]="'state state--' + type()" [class.state--compact]="compact()"
         [attr.role]="type() === 'erreur' ? 'alert' : 'status'"
         [attr.aria-live]="type() === 'erreur' ? 'assertive' : 'polite'"
         [attr.aria-busy]="type() === 'chargement' ? true : null">
      @switch (type()) {
        @case ('chargement') {
          <div class="pro-spinner" aria-hidden="true"></div>
        }
        @case ('erreur') {
          <span class="state__icon" aria-hidden="true"><yay360-icon name="alert-triangle" [size]="22" /></span>
        }
        @case ('succes') {
          <span class="state__icon" aria-hidden="true"><yay360-icon name="check" [size]="22" /></span>
        }
        @default {
          <span class="state__icon" aria-hidden="true"><yay360-icon [name]="icone()" [size]="22" /></span>
        }
      }
      @if (titre()) { <h3 class="state__title">{{ titre() }}</h3> }
      @if (message()) { <p class="state__message">{{ message() }}</p> }
      @if (type() === 'erreur' && afficherReessayer()) {
        <button type="button" class="pro-btn pro-btn--secondary pro-btn--sm" (click)="reessayer.emit()">Réessayer</button>
      }
      <ng-content />
    </div>
  `,
  styles: `
    :host { display: block; }
    .state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: var(--s-3); text-align: center;
      padding: var(--s-12) var(--s-6);
      background: var(--c-surface); border: 1px solid var(--b-light);
      border-radius: var(--r-xl);
      color: var(--t-muted);
    }
    .state--chargement { background: transparent; border-color: transparent; }
    .state--compact { padding: var(--s-6) var(--s-4); }
    .state__icon {
      display: inline-grid; place-items: center;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--c-orange-soft); color: var(--c-teal-ink);
    }
    .state--erreur { border-color: var(--c-danger); background: var(--c-danger-soft); }
    .state--erreur .state__icon { background: var(--c-surface); color: var(--c-danger); }
    .state--succes .state__icon { background: var(--c-success-soft); color: var(--c-success); }
    .state__title { font-size: var(--fs-lg); color: var(--t-main); }
    .state__message { font-size: var(--fs-sm); max-width: 48ch; color: var(--t-muted); }
    .state--erreur .state__message { color: var(--t-main); }
  `,
})
export class StateComponent {
  readonly type = input.required<TypeEtat>();
  readonly titre = input<string | null>(null);
  readonly message = input<string | null>(null);
  readonly icone = input<'info' | 'calendar' | 'bell' | 'users' | 'clipboard' | 'heart' | 'search' | 'book' | 'building'>('info');
  readonly compact = input(false);
  readonly afficherReessayer = input(true);
  readonly reessayer = output<void>();
}
