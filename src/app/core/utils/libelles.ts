import { Role } from '../models/utilisateur.model';

/** Libellés partagés (une seule source pour toute l'interface). */

export const LIBELLES_ROLE: Record<Role, string> = {
  ADMIN: 'Administrateur',
  MEDECIN: 'Médecin',
  SAGE_FEMME: 'Sage-femme',
  FEMME_ENCEINTE: 'Femme enceinte',
  CONJOINT: 'Conjoint',
};

export function libelleRole(role: Role | null | undefined): string {
  return role ? LIBELLES_ROLE[role] ?? role : '';
}

/** Types de symptôme acceptés par l'API (DeclarerSymptomeRequest). */
export const TYPES_SYMPTOME: { valeur: string; libelle: string }[] = [
  { valeur: 'SAIGNEMENTS', libelle: 'Saignements' },
  { valeur: 'DOULEURS_ABDOMINALES', libelle: 'Douleurs abdominales intenses' },
  { valeur: 'PERTE_LIQUIDE', libelle: 'Perte de liquide' },
  { valeur: 'DIMINUTION_MOUVEMENTS_BEBE', libelle: 'Le bébé bouge moins' },
  { valeur: 'FIEVRE_ELEVEE', libelle: 'Fièvre élevée' },
  { valeur: 'CONVULSIONS', libelle: 'Convulsions' },
  { valeur: 'DIFFICULTES_RESPIRATOIRES', libelle: 'Difficultés à respirer' },
  { valeur: 'MAUX_DE_TETE_INTENSES', libelle: 'Maux de tête intenses' },
  { valeur: 'TROUBLES_VISUELS', libelle: 'Troubles de la vue' },
  { valeur: 'OEDEMES_SOUDAINS', libelle: 'Gonflement soudain (visage, mains)' },
  { valeur: 'VOMISSEMENTS_SEVERES', libelle: 'Vomissements sévères' },
  { valeur: 'AUTRE', libelle: 'Autre symptôme' },
];

export function libelleSymptome(type: string | null | undefined): string {
  if (type === 'CONSTANTES_ANORMALES') {
    return 'Constantes anormales (consultation)';
  }
  return TYPES_SYMPTOME.find((t) => t.valeur === type)?.libelle ?? type ?? '';
}

/** Résultats de bandelette urinaire acceptés par l'API (ResultatBandelette). */
export const RESULTATS_BANDELETTE: { valeur: string; libelle: string }[] = [
  { valeur: 'NEGATIVE', libelle: 'Négative' },
  { valeur: 'TRACES', libelle: 'Traces' },
  { valeur: 'UNE_CROIX', libelle: '+' },
  { valeur: 'DEUX_CROIX', libelle: '++' },
  { valeur: 'TROIS_CROIX', libelle: '+++' },
];

export function libelleBandelette(valeur: string | null | undefined): string | null {
  return valeur ? RESULTATS_BANDELETTE.find((r) => r.valeur === valeur)?.libelle ?? valeur : null;
}

/** Issues de grossesse proposées à la clôture, groupées comme dans le formulaire. */
export const ISSUES_GROSSESSE: { groupe: string; issues: { valeur: string; libelle: string }[] }[] = [
  {
    groupe: 'Accouchement',
    issues: [
      { valeur: 'NAISSANCE_VIVANTE', libelle: 'Enfant né vivant' },
      { valeur: 'MORT_NE', libelle: 'Enfant mort-né (à partir de 22 SA)' },
    ],
  },
  {
    groupe: 'Interruption',
    issues: [
      { valeur: 'FAUSSE_COUCHE', libelle: 'Fausse couche ou avortement incomplet (avant 22 SA)' },
      { valeur: 'GROSSESSE_EXTRA_UTERINE', libelle: 'Grossesse extra-utérine' },
      { valeur: 'MORT_FOETALE_IN_UTERO', libelle: 'Mort fœtale in utero (à partir de 22 SA)' },
      { valeur: 'INTERRUPTION_THERAPEUTIQUE', libelle: 'Interruption thérapeutique (vie de la mère en danger)' },
    ],
  },
];

/** Libellé court de l'issue, pour l'en-tête du dossier. */
export function libelleIssue(issue: string | null | undefined): string | null {
  const courts: Record<string, string> = {
    NAISSANCE_VIVANTE: 'Accouchement',
    MORT_NE: 'Accouchement (enfant mort-né)',
    FAUSSE_COUCHE: 'Fausse couche',
    GROSSESSE_EXTRA_UTERINE: 'Grossesse extra-utérine',
    MORT_FOETALE_IN_UTERO: 'Mort fœtale in utero',
    INTERRUPTION_THERAPEUTIQUE: 'Interruption thérapeutique',
  };
  return issue ? courts[issue] ?? issue : null;
}

/** Types de rendez-vous acceptés par l'API. */
export const TYPES_RENDEZ_VOUS: { valeur: string; libelle: string }[] = [
  { valeur: 'CONSULTATION_PRENATALE', libelle: 'Consultation prénatale (CPN)' },
  { valeur: 'ECHOGRAPHIE', libelle: 'Échographie' },
  { valeur: 'VACCINATION', libelle: 'Vaccination' },
  { valeur: 'EXAMEN_LABORATOIRE', libelle: 'Examen de laboratoire' },
  { valeur: 'AUTRE', libelle: 'Autre' },
];

export function libelleTypeRendezVous(type: string | null | undefined): string {
  return TYPES_RENDEZ_VOUS.find((t) => t.valeur === type)?.libelle ?? type ?? '';
}

/** Niveaux de gravité des alertes (définis par les règles de triage du backend). */
export const LIBELLES_GRAVITE: Record<string, string> = {
  URGENT: 'Urgent',
  ELEVE: 'Élevé',
  MODERE: 'Modéré',
};

export function libelleGravite(niveau: string | null | undefined): string {
  return niveau ? LIBELLES_GRAVITE[niveau] ?? niveau : '';
}

export const LIBELLES_STATUT_ALERTE: Record<string, string> = {
  NOUVELLE: 'Nouvelle',
  PRISE_EN_CHARGE: 'Prise en charge',
  RESOLUE: 'Résolue',
};

export function libelleStatutAlerte(statut: string | null | undefined): string {
  return statut ? LIBELLES_STATUT_ALERTE[statut] ?? statut : '';
}

/** Statuts (rendez-vous, grossesse, contact CPN, alerte) → libellés lisibles. */
const LIBELLES_STATUT: Record<string, string> = {
  ...LIBELLES_STATUT_ALERTE,
  ...LIBELLES_GRAVITE,
  PLANIFIE: 'Planifié',
  CONFIRME: 'Confirmé',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
  ABSENT: 'Absence',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  INTERROMPUE: 'Interrompue',
  REALISE: 'Réalisé',
  A_VENIR: 'À venir',
  EN_RETARD: 'En retard',
};

export function libelleStatut(statut: string | null | undefined): string {
  return statut ? LIBELLES_STATUT[statut] ?? statut : '';
}
