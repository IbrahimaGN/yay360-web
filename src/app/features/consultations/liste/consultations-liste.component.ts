import { messageErreur } from '../../../core/utils/message-erreur';
import { Component, computed, inject, signal } from '@angular/core';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StateComponent } from '../../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConsultationService } from '../../../core/services/consultation.service';
import { ConsultationDto } from '../../../core/models/consultation.model';

@Component({
  selector: 'yay360-consultations-liste',
  standalone: true,
  imports: [StateComponent, DatePipe, RouterLink, IconComponent],
  templateUrl: './consultations-liste.component.html',
  styleUrl: './consultations-liste.component.scss',
})
export class ConsultationsListeComponent {
  private readonly consultationService = inject(ConsultationService);

  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly consultations = signal<ConsultationDto[]>([]);

  readonly recherche = signal('');
  readonly periode = signal<'TOUT' | '7' | '30'>('TOUT');
  readonly avecSignaux = signal(false);

  readonly stats = computed(() => {
    const l = this.consultations();
    const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
    return {
      total: l.length,
      ceMois: l.filter((c) => +new Date(c.dateConsultation) >= +debutMois).length,
      signaux: l.filter((c) => c.signauxCliniques.length > 0).length,
      patientes: new Set(l.map((c) => c.femmeEnceinteId)).size,
    };
  });

  /** Consultations filtrées, regroupées par mois (plus récentes d'abord). */
  readonly mois = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const p = this.periode();
    const limite = p === 'TOUT' ? 0 : Date.now() - Number(p) * 864e5;
    const liste = this.consultations()
      .filter((c) => +new Date(c.dateConsultation) >= limite && (!this.avecSignaux() || c.signauxCliniques.length > 0) &&
        (!terme || c.femmeEnceinteNomComplet.toLowerCase().includes(terme) || (c.diagnostic ?? '').toLowerCase().includes(terme)))
      .sort((a, b) => +new Date(b.dateConsultation) - +new Date(a.dateConsultation));
    const groupes = new Map<string, { cle: string; date: string; items: ConsultationDto[] }>();
    for (const c of liste) {
      const d = new Date(c.dateConsultation);
      const cle = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groupes.has(cle)) groupes.set(cle, { cle, date: c.dateConsultation, items: [] });
      groupes.get(cle)!.items.push(c);
    }
    return [...groupes.values()];
  });
  readonly nombreAffiches = computed(() => this.mois().reduce((n, m) => n + m.items.length, 0));
  readonly filtresActifs = computed(() => !!this.recherche().trim() || this.periode() !== 'TOUT' || this.avecSignaux());

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.periode.set('TOUT');
    this.avecSignaux.set(false);
  }

  initiales(nom: string): string {
    return nom.replace(/\([^)]*\)/, '').trim().split(/\s+/).slice(0, 2).map((m) => m.charAt(0).toUpperCase()).join('');
  }

  constructor() {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);

    this.consultationService.monActivite().subscribe({
      next: (liste) => {
        this.consultations.set(liste);
        this.chargement.set(false);
      },
      error: (err) => {
        this.erreur.set(messageErreur(err, 'Impossible de charger vos consultations.'));
        this.chargement.set(false);
      },
    });
  }
}
