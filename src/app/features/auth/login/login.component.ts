import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';
import { FeuillageComponent } from '../../../shared/components/feuillage/feuillage.component';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { messageErreur } from '../../../core/utils/message-erreur';
import { IconName } from '../../../core/models/nav-item.model';

@Component({
  selector: 'yay360-login',
  standalone: true,
  imports: [ThemeToggleComponent, CommonModule, ReactiveFormsModule, RouterLink, IconComponent, FeuillageComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly themeService = inject(ThemeService);

  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly motDePasseVisible = signal(false);
  /** Arrivée après expiration de la session (redirection de l'intercepteur). */
  /** Les cinq profils de la plateforme (cahier des charges). */
  readonly profils: { libelle: string; icone: IconName }[] = [
    { libelle: 'Patiente', icone: 'heart' },
    { libelle: 'Conjoint', icone: 'users' },
    { libelle: 'Sage-femme', icone: 'activity' },
    { libelle: 'Médecin', icone: 'clipboard' },
    { libelle: 'Administration', icone: 'building' },
  ];

  readonly sessionExpiree = this.route.snapshot.queryParamMap.has('expiree');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  basculerVisibiliteMotDePasse(): void {
    this.motDePasseVisible.update((v) => !v);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.chargement.set(true);
    this.erreur.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (reponse) => {
        this.chargement.set(false);
        if (reponse.motDePasseTemporaire) {
          this.router.navigate(['/changer-mot-de-passe']);
          return;
        }
        // Retour à la page demandée, uniquement si c'est un chemin interne
        const retour = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(retour && retour.startsWith('/') && !retour.startsWith('//') ? retour : '/accueil');
      },
      error: (err: HttpErrorResponse) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, 'Une erreur est survenue. Vérifiez votre connexion et réessayez.'));
      },
    });
  }
}
