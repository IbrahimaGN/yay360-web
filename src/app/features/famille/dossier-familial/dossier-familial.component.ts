import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { FamilleService } from '../../../core/services/famille.service';
import { InvitationConjointResponse } from '../../../core/models/famille.model';
import { messageErreur } from '../../../core/utils/message-erreur';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'yay360-dossier-familial',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, IconComponent],
  templateUrl: './dossier-familial.component.html',
  styleUrl: './dossier-familial.component.scss',
})
export class DossierFamilialComponent {
  private readonly fb = inject(FormBuilder);
  private readonly familleService = inject(FamilleService);
  private readonly auth = inject(AuthService);

  readonly estFemme = computed(() => this.auth.hasRole('FEMME_ENCEINTE'));
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly invitation = signal<InvitationConjointResponse | null>(null);
  readonly copie = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  /** Lien d'acceptation à transmettre au conjoint avec le code. */
  readonly lienAcceptation = computed(() => {
    const i = this.invitation();
    return i ? `${window.location.origin}/accepter-invitation-conjoint?token=${encodeURIComponent(i.code)}` : '';
  });

  /** Partage du lien par WhatsApp (message pré-rempli, le code y figure). */
  readonly lienWhatsapp = computed(() => {
    const i = this.invitation();
    if (!i) return '';
    const texte = `Rejoins mon suivi de grossesse sur YAY360 : ${this.lienAcceptation()} (code : ${i.code})`;
    return `https://wa.me/?text=${encodeURIComponent(texte)}`;
  });

  inviter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.chargement.set(true);
    this.erreur.set(null);
    this.invitation.set(null);
    this.copie.set(false);

    this.familleService.inviterConjoint(this.form.getRawValue().email!.trim()).subscribe({
      next: (reponse) => {
        this.chargement.set(false);
        this.invitation.set(reponse);
        this.form.reset();
      },
      error: (err) => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(err, "Impossible de créer l'invitation. Vérifiez l'adresse et réessayez."));
      },
    });
  }

  copierLien(): void {
    navigator.clipboard
      ?.writeText(this.lienAcceptation())
      .then(() => this.copie.set(true))
      .catch(() => this.copie.set(false));
  }
}
