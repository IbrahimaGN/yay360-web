import { Role } from './utilisateur.model';

export type IconName =
  | 'grid'
  | 'ring'
  | 'calendar'
  | 'clipboard'
  | 'bell'
  | 'building'
  | 'book'
  | 'users'
  | 'sun'
  | 'moon'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'user'
  | 'logout'
  | 'x'
  | 'home'
  | 'search'
  | 'filter'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'check'
  | 'alert-triangle'
  | 'info'
  | 'eye'
  | 'eye-off'
  | 'heart'
  | 'activity'
  | 'arrow-right'
  | 'mail'
  | 'phone'
  | 'map-pin'
  | 'shield';

export interface NavItem {
  label: string;
  /** Libellé court affiché sous l'icône dans la barre latérale. */
  court: string;
  path: string;
  icon: IconName;
  roles: Role[];
  /** Section de la barre latérale. */
  section: 'general' | 'suivi' | 'gestion';
}
