import { Component, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../icon/icon.component';

/**
 * Bouton clair / sombre. Libellé fixe + aria-pressed : le lecteur d'écran annonce
 * « Thème sombre, activé » ou « désactivé ». Le choix est mémorisé par ThemeService.
 */
@Component({
  selector: 'yay360-theme-toggle',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button type="button" class="icon-btn icon-btn--white" (click)="theme.toggle()"
            aria-label="Thème sombre" [attr.aria-pressed]="theme.isDark()"
            [title]="theme.isDark() ? 'Passer au thème clair' : 'Passer au thème sombre'">
      <yay360-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="20" aria-hidden="true" />
    </button>
  `,
  styles: `:host { display: inline-flex; }`,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
}
