import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
﻿import { Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { libelleRole } from '../../../core/utils/libelles';
import { IconComponent } from '../icon/icon.component';
import { FeuillageComponent } from '../feuillage/feuillage.component';

/** Page affichée quand le rôle connecté n'a pas le droit d'ouvrir une page (garde de rôle). */
@Component({
  selector: 'yay360-access-denied',
  standalone: true,
  imports: [ThemeToggleComponent, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss',
})
export class AccessDeniedComponent {
  private readonly location = inject(Location);
  readonly authService = inject(AuthService);
  readonly libelleRole = computed(() => libelleRole(this.authService.role()));

  retour(): void {
    this.location.back();
  }
}
