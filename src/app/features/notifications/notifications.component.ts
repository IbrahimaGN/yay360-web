import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationDto } from '../../core/models/notification.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'yay360-notifications',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  readonly notifications = signal<NotificationDto[]>([]);
  readonly chargement = signal(true);
  readonly enAction = signal(false);
  readonly erreur = signal<string | null>(null);

  constructor() {
    this.charger();
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
    this.notificationService.marquerLue(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.enAction.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de marquer cette notification comme lue.');
        this.enAction.set(false);
      },
    });
  }

  toutMarquerLu(): void {
    if (!this.notifications().some((item) => !item.lue) || this.enAction()) return;
    this.enAction.set(true);
    this.notificationService.toutMarquerLu().subscribe({
      next: () => {
        this.notifications.update((items) => items.map((item) => ({ ...item, lue: true })));
        this.enAction.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de marquer toutes les notifications comme lues.');
        this.enAction.set(false);
      },
    });
  }
}
