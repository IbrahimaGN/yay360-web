import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationDto } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';
import { IconName } from '../../core/models/nav-item.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StateComponent } from '../../shared/components/state/state.component';

/** Familles de notifications regroupant les types envoyés par le backend. */
type Famille = 'alerte' | 'rappel' | 'conseil' | 'info';
type Filtre = 'toutes' | 'non-lues' | Famille;

interface Apparence { famille: Famille; libelle: string; icone: IconName }

const APPARENCES: Record<string, Apparence> = {
  ALERTE_MEDICALE: { famille: 'alerte', libelle: 'Alerte médicale', icone: 'alert-triangle' },
  RAPPEL_CONSULTATION: { famille: 'rappel', libelle: 'Rappel de consultation', icone: 'calendar' },
  RAPPEL_ECHOGRAPHIE: { famille: 'rappel', libelle: 'Rappel d’échographie', icone: 'calendar' },
  RAPPEL_VACCINATION: { famille: 'rappel', libelle: 'Rappel de vaccination', icone: 'calendar' },
  CONSEIL_HEBDOMADAIRE: { famille: 'conseil', libelle: 'Conseil de la semaine', icone: 'book' },
  INFORMATION: { famille: 'info', libelle: 'Information', icone: 'info' },
};
const PAR_DEFAUT: Apparence = { famille: 'info', libelle: 'Information', icone: 'bell' };

interface Groupe { cle: string; titre: string; items: NotificationDto[] }

@Component({
  selector: 'yay360-notifications',
  standalone: true,
  imports: [DatePipe, IconComponent, StateComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  readonly notifications = signal<NotificationDto[]>([]);
  readonly chargement = signal(true);
  readonly enAction = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly erreurAction = signal<string | null>(null);
  readonly filtre = signal<Filtre>('toutes');

  readonly nonLues = computed(() => this.notifications().filter((n) => !n.lue).length);

  readonly filtres = computed(() => {
    const liste = this.notifications();
    const compte = (f: Famille) => liste.filter((n) => this.apparence(n).famille === f).length;
    return [
      { cle: 'toutes' as Filtre, libelle: 'Toutes', nombre: liste.length },
      { cle: 'non-lues' as Filtre, libelle: 'Non lues', nombre: this.nonLues() },
      { cle: 'alerte' as Filtre, libelle: 'Alertes', nombre: compte('alerte') },
      { cle: 'rappel' as Filtre, libelle: 'Rappels', nombre: compte('rappel') },
      { cle: 'conseil' as Filtre, libelle: 'Conseils', nombre: compte('conseil') },
      { cle: 'info' as Filtre, libelle: 'Informations', nombre: compte('info') },
    ];
  });

  /** Notifications filtrées puis regroupées par jour (Aujourd'hui, Hier, date). */
  readonly groupes = computed<Groupe[]>(() => {
    const f = this.filtre();
    const visibles = this.notifications()
      .filter((n) => f === 'toutes' || (f === 'non-lues' ? !n.lue : this.apparence(n).famille === f))
      .sort((a, b) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime());

    const groupes = new Map<string, Groupe>();
    for (const n of visibles) {
      const d = new Date(n.dateEnvoi);
      const cle = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groupes.has(cle)) groupes.set(cle, { cle, titre: this.titreJour(d), items: [] });
      groupes.get(cle)!.items.push(n);
    }
    return [...groupes.values()];
  });

  constructor() {
    this.charger();
  }

  apparence(n: NotificationDto): Apparence {
    return APPARENCES[n.type] ?? PAR_DEFAUT;
  }

  private titreJour(d: Date): string {
    const debut = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const ecart = Math.round((debut(new Date()) - debut(d)) / 864e5);
    if (ecart === 0) return 'Aujourd’hui';
    if (ecart === 1) return 'Hier';
    return '';
  }

  charger(): void {
    this.chargement.set(true);
    this.erreur.set(null);
    this.notificationService.lister().subscribe({
      next: (items) => {
        this.notifications.set(items);
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger vos notifications.');
        this.chargement.set(false);
      },
    });
  }

  marquerLue(notification: NotificationDto): void {
    if (notification.lue || this.enAction()) return;
    this.enAction.set(true);
    this.erreurAction.set(null);
    this.notificationService.marquerLue(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.enAction.set(false);
      },
      error: () => {
        this.erreurAction.set('Impossible de marquer cette notification comme lue.');
        this.enAction.set(false);
      },
    });
  }

  toutMarquerLu(): void {
    if (!this.nonLues() || this.enAction()) return;
    this.enAction.set(true);
    this.erreurAction.set(null);
    this.notificationService.toutMarquerLu().subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => ({ ...item, lue: true })));
        this.enAction.set(false);
      },
      error: () => {
        this.erreurAction.set('Impossible de marquer toutes les notifications comme lues.');
        this.enAction.set(false);
      },
    });
  }
}
