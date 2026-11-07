import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Validateurs identiques aux règles du backend (Bean Validation), pour que l'utilisateur
 * soit prévenu avant l'envoi plutôt que de recevoir un refus du serveur.
 */

/** Mot de passe : 8 à 100 caractères, au moins une lettre et un chiffre (RegisterRequest). */
export const VALIDATEURS_MOT_DE_PASSE: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(8),
  Validators.maxLength(100),
  Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
];

export const AIDE_MOT_DE_PASSE = '8 caractères minimum, avec au moins une lettre et un chiffre.';

/** Téléphone mobile sénégalais : +221 puis 70, 71, 75, 76, 77 ou 78, puis 7 chiffres (@TelephoneSenegal). */
export const MOTIF_TELEPHONE_SENEGAL = /^\+221(70|71|75|76|77|78)\d{7}$/;
export const AIDE_TELEPHONE = 'Format : +221 suivi de 9 chiffres, sans espace (ex. +221771234567).';

/** Téléphone d'un établissement : +221 puis 9 chiffres (EtablissementRequest). */
export const MOTIF_TELEPHONE_ETABLISSEMENT = /^\+221\d{9}$/;

/** Nom ou prénom : lettres, apostrophe, tiret et espace uniquement. */
export const MOTIF_NOM = /^[\p{L}'\- ]+$/u;

export const VALIDATEURS_NOM: ValidatorFn[] = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(50),
  Validators.pattern(MOTIF_NOM),
];

/**
 * Tension artérielle en mmHg « systolique/diastolique » cohérente : systolique 60 à 260,
 * diastolique 30 à 160, systolique supérieure à la diastolique (refuse 16/11 saisi en cmHg).
 */
export const validateurTension: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valeur = (control.value ?? '').toString().trim();
  if (!valeur) {
    return null;
  }
  const correspondance = /^(\d{2,3})\/(\d{2,3})$/.exec(valeur);
  if (!correspondance) {
    return { tension: true };
  }
  const systolique = Number(correspondance[1]);
  const diastolique = Number(correspondance[2]);
  const plausible =
    systolique >= 60 && systolique <= 260 && diastolique >= 30 && diastolique <= 160 && systolique > diastolique;
  return plausible ? null : { tension: true };
};

/** Le champ doit être identique au champ `nomAutre` du même groupe. */
export function identiqueA(nomAutre: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const autre = control.parent?.get(nomAutre);
    return autre && control.value !== autre.value ? { differents: true } : null;
  };
}

/** Une date (yyyy-MM-dd ou date-heure) strictement dans le futur. */
export const validateurDateFuture: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control.value) {
    return null;
  }
  return new Date(control.value).getTime() > Date.now() ? null : { passee: true };
};
