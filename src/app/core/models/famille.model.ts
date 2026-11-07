/**
 * Résultat d'une invitation du conjoint. Sans serveur d'email, le code est remis à la femme
 * qui invite : elle le transmet elle-même (SMS, WhatsApp). Il est valable 72 heures.
 */
export interface InvitationConjointResponse {
  message: string;
  code: string;
  dateExpiration: string;
  emailEnvoye: boolean;
}
