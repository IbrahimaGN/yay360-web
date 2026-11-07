import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MOTIF_NOM,
  MOTIF_TELEPHONE_ETABLISSEMENT,
  MOTIF_TELEPHONE_SENEGAL,
  VALIDATEURS_MOT_DE_PASSE,
  identiqueA,
  validateurDateFuture,
  validateurTension,
} from './validateurs';

/** Ces règles doivent rester identiques à celles du backend (Bean Validation). */
describe('Validateurs alignés sur le backend', () => {
  const motDePasse = (valeur: string) => new FormControl(valeur, VALIDATEURS_MOT_DE_PASSE).valid;

  it('mot de passe : 8 caractères minimum avec une lettre et un chiffre', () => {
    expect(motDePasse('abc123')).toBe(false); // 6 caractères : accepté avant, refusé par le serveur
    expect(motDePasse('abcdefgh')).toBe(false); // sans chiffre
    expect(motDePasse('12345678')).toBe(false); // sans lettre
    expect(motDePasse('Yay36000')).toBe(true);
  });

  it.each([
    ['+221771234567', true],
    ['+221701234567', true],
    ['+221781234567', true],
    ['+221791234567', false], // préfixe inexistant
    ['+221 77 123 45 67', false], // espaces refusés par le serveur
    ['771234567', false], // sans indicatif
  ])('téléphone mobile %s → %s', (tel, valide) => {
    expect(MOTIF_TELEPHONE_SENEGAL.test(tel)).toBe(valide);
  });

  it('téléphone d’établissement : +221 et 9 chiffres (fixe accepté)', () => {
    expect(MOTIF_TELEPHONE_ETABLISSEMENT.test('+221338000000')).toBe(true);
    expect(MOTIF_TELEPHONE_ETABLISSEMENT.test('+22133800000')).toBe(false);
  });

  it('nom : lettres (accents compris), apostrophe, tiret et espace', () => {
    expect(MOTIF_NOM.test("N'Diaye-Sène")).toBe(true);
    expect(MOTIF_NOM.test('Awa2')).toBe(false);
  });

  it.each([
    ['120/80', true],
    ['165/112', true],
    ['', true], // facultatif
    ['12/8', false], // saisie en cmHg
    ['16/11', false],
    ['80/120', false], // valeurs inversées
    ['120-80', false],
  ])('tension « %s » → %s', (ta, valide) => {
    expect(validateurTension(new FormControl(ta)) === null).toBe(valide);
  });

  it('confirmation identique au mot de passe', () => {
    const groupe = new FormGroup({
      nouveau: new FormControl('Yay36000'),
      confirmation: new FormControl('Yay36001', [Validators.required, identiqueA('nouveau')]),
    });
    // Comme dans l'application : la validation se relance une fois le contrôle rattaché au groupe
    groupe.controls.confirmation.updateValueAndValidity();
    expect(groupe.controls.confirmation.hasError('differents')).toBe(true);
    groupe.controls.confirmation.setValue('Yay36000');
    expect(groupe.controls.confirmation.valid).toBe(true);
  });

  it('date future', () => {
    expect(validateurDateFuture(new FormControl('2000-01-01T10:00'))).toEqual({ passee: true });
    expect(validateurDateFuture(new FormControl('2999-01-01T10:00'))).toBeNull();
  });
});
