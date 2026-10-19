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
  | 'chat';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  roles: Role[];
}
