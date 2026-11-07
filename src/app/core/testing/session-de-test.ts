import { Role } from '../models/utilisateur.model';
import { expDans, jetonDeTest } from './jeton-de-test';

/**
 * Enregistre une session fictive dans le stockage local, comme après une connexion.
 * À appeler AVANT de créer le composant : AuthService lit la session à sa création.
 */
export function ouvrirSessionDeTest(role: Role, prenom = 'Awa', nom = 'Démo'): void {
  localStorage.setItem('yay360.session', JSON.stringify({
    token: jetonDeTest({ sub: 'demo@exemple.sn', role, exp: expDans(3600) }),
    id: 1,
    email: 'demo@exemple.sn',
    nom,
    prenom,
    role,
    motDePasseTemporaire: false,
  }));
}
