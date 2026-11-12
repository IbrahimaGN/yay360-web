import { Component, inject, input, OnInit, signal } from '@angular/core';
import { StateComponent } from '../../../shared/components/state/state.component';
import { messageErreur } from '../../../core/utils/message-erreur';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ConsultationDto } from '../../../core/models/consultation.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { IconName } from '../../../core/models/nav-item.model';
import { libelleBandelette } from '../../../core/utils/libelles';
import { initiales } from '../../../core/utils/affichage';

@Component({
  selector: 'yay360-consultation-detail',
  standalone: true,
  imports: [StateComponent, DatePipe, RouterLink, IconComponent],
  templateUrl: './consultation-detail.component.html',
  styleUrl: './consultation-detail.component.scss',
})
export class ConsultationDetailComponent implements OnInit {
  private readonly consultationService = inject(ConsultationService);

  readonly id = input.required<string>();

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly consultation = signal<ConsultationDto | null>(null);

  readonly initiales = initiales;

  /** Constantes affichées en tuiles (valeur brute, sans interprétation côté interface). */
  constantes(c: ConsultationDto): { libelle: string; valeur: string | null; unite: string; icone: IconName }[] {
    return [
      { libelle: 'Tension artérielle', valeur: c.tensionArterielle, unite: 'mmHg', icone: 'activity' },
      { libelle: 'Poids', valeur: c.poidsKg !== null ? `${c.poidsKg}` : null, unite: 'kg', icone: 'user' },
      { libelle: 'Température', valeur: c.temperatureC !== null ? `${c.temperatureC}` : null, unite: '°C', icone: 'sun' },
      { libelle: 'Hauteur utérine', valeur: c.hauteurUterineCm !== null ? `${c.hauteurUterineCm}` : null, unite: 'cm', icone: 'heart' },
      { libelle: 'Bruits du cœur fœtal', valeur: c.battementsCoeurFoetal !== null ? `${c.battementsCoeurFoetal}` : null, unite: '/min', icone: 'heart' },
      { libelle: 'Fréquence cardiaque maternelle', valeur: c.frequenceCardiaqueMaternelle != null ? `${c.frequenceCardiaqueMaternelle}` : null, unite: '/min', icone: 'heart' },
      { libelle: 'Protéinurie', valeur: libelleBandelette(c.proteinurie), unite: '', icone: 'activity' },
      { libelle: 'Glycosurie', valeur: libelleBandelette(c.glycosurie), unite: '', icone: 'activity' },
    ];
  }

  imprimer(): void {
    window.print();
  }

  // L'identifiant de route n'est disponible qu'après l'initialisation des inputs
  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.consultationService.obtenirParId(Number(this.id())).subscribe({
      next: (c) => {
        this.consultation.set(c);
        this.chargement.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Impossible de charger cette consultation.'));
        this.chargement.set(false);
      },
    });
  }
}
