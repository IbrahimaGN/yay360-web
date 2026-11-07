import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'yay360-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  /** Créé au démarrage : le thème mémorisé s'applique à toutes les pages. */
  private readonly theme = inject(ThemeService);
}
