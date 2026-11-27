import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UtilisateursListeComponent } from './utilisateurs-liste.component';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { EtablissementService } from '../../core/services/etablissement.service';
import { Role, Utilisateur } from '../../core/models/utilisateur.model';
import { EtablissementDto } from '../../core/models/etablissement.model';
import { ouvrirSessionDeTest } from '../../core/testing/session-de-test';

/** Comptes et établissements fictifs. */
function compte(partiel: Partial<Utilisateur>): Utilisateur {
  return {
    id: 1, nom: 'Diallo', prenom: 'Mamadou', email: 'mamadou@exemple.sn', telephone: '+221770000001',
    dateNaissance: '1980-01-01', role: 'MEDECIN', actif: true, dateCreation: '2026-11-01T09:00:00', ...partiel,
  };
}

function etablissement(partiel: Partial<EtablissementDto>): EtablissementDto {
  return {
    id: 1, nom: 'Centre de santé Démo', type: 'CENTRE_DE_SANTE', adresse: 'Dakar', ville: 'Dakar',
    telephone: '+221338000000', email: null, latitude: null, longitude: null, actif: true, professionnels: [], ...partiel,
  };
}

const MEDECIN = compte({ id: 20, nom: 'Diallo', prenom: 'Mamadou', role: 'MEDECIN' });
const SAGE_FEMME = compte({ id: 21, nom: 'Faye', prenom: 'Aïssatou', email: 'aissatou@exemple.sn', role: 'SAGE_FEMME' });
const MON_ETABLISSEMENT = etablissement({ id: 1, nom: 'Centre de santé Démo' });

describe('UtilisateursListeComponent (deux niveaux d’administration)', () => {
  let fixture: ComponentFixture<UtilisateursListeComponent>;
  let composant: UtilisateursListeComponent;
  let el: HTMLElement;
  let utilisateurs: Record<string, ReturnType<typeof vi.fn>>;
  let etablissements: Record<string, ReturnType<typeof vi.fn>>;

  function afficher(role: Role): void {
    localStorage.clear();
    ouvrirSessionDeTest(role);
    utilisateurs = {
      listerTous: vi.fn(() => of([MEDECIN, SAGE_FEMME])),
      soignantsDeMonEtablissement: vi.fn(() => of([MEDECIN, SAGE_FEMME])),
      creerProfessionnel: vi.fn(() => of({ utilisateur: MEDECIN, motDePasseTemporaire: 'Yay-temporaire-9', emailEnvoye: false })),
      activer: vi.fn(() => of(MEDECIN)),
      desactiver: vi.fn(() => of(MEDECIN)),
      supprimer: vi.fn(() => of(undefined)),
    };
    etablissements = {
      listerTous: vi.fn(() => of([MON_ETABLISSEMENT, etablissement({ id: 2, nom: 'Poste fermé', actif: false })])),
      monEtablissement: vi.fn(() => of(MON_ETABLISSEMENT)),
      retirerProfessionnel: vi.fn(() => of(MON_ETABLISSEMENT)),
    };
    TestBed.configureTestingModule({
      imports: [UtilisateursListeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: UtilisateurService, useValue: utilisateurs },
        { provide: EtablissementService, useValue: etablissements },
      ],
    });
    fixture = TestBed.createComponent(UtilisateursListeComponent);
    composant = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  afterEach(() => localStorage.clear());

  const onglets = () => Array.from(el.querySelectorAll('[role="tab"]')).map((o) => o.textContent!.trim());
  const remplir = (role: string, etablissementId = '') =>
    composant.form.setValue({
      nom: 'Ndiaye', prenom: 'Khady', email: 'khady@exemple.sn', telephone: '+221771234567',
      dateNaissance: '1985-05-01', role: role as never, etablissementId,
    });

  // ==================== ADMINISTRATEUR DE LA PLATEFORME ====================

  it('l’administrateur de la plateforme gère tous les comptes, y compris les administrateurs d’établissement', () => {
    afficher('ADMIN');

    expect(utilisateurs['listerTous']).toHaveBeenCalled();
    expect(utilisateurs['soignantsDeMonEtablissement']).not.toHaveBeenCalled();
    expect(onglets()).toContain('Admins d’établissement');
    expect(el.querySelector('.row-actions__delete')).not.toBeNull();
    // Seuls les établissements actifs sont proposés à la création
    expect(composant.etablissements().map((e) => e.id)).toEqual([1]);
  });

  it('un administrateur d’établissement ne peut pas être créé sans établissement', () => {
    afficher('ADMIN');
    composant.ouvrirCreation();
    remplir('ADMIN_ETABLISSEMENT');

    composant.soumettre();

    expect(composant.erreurFormulaire()).toContain('établissement');
    expect(utilisateurs['creerProfessionnel']).not.toHaveBeenCalled();
  });

  it('l’administrateur de la plateforme crée un administrateur rattaché à l’établissement choisi', () => {
    afficher('ADMIN');
    composant.ouvrirCreation();
    remplir('ADMIN_ETABLISSEMENT', '1');
    fixture.detectChanges();

    expect(composant.choixEtablissement()).toBe(true);
    expect(el.querySelector('#etablissementId')).not.toBeNull();
    composant.soumettre();

    expect(utilisateurs['creerProfessionnel']).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN_ETABLISSEMENT', etablissementId: 1 }));
    expect(composant.compteCree()?.motDePasseTemporaire).toBe('Yay-temporaire-9');
  });

  it('l’administrateur de la plateforme ne crée que des administrateurs, un seul par établissement', () => {
    afficher('ADMIN');
    utilisateurs['listerTous'].mockReturnValue(of([
      compte({ id: 30, role: 'ADMIN_ETABLISSEMENT', etablissementAdministreId: 1 }),
    ]));
    etablissements['listerTous'].mockReturnValue(of([MON_ETABLISSEMENT, etablissement({ id: 3, nom: 'Centre libre' })]));
    composant.etablissements.set([MON_ETABLISSEMENT, etablissement({ id: 3, nom: 'Centre libre' })]);

    composant.ouvrirCreation();
    fixture.detectChanges();

    expect(composant.form.controls.role.value).toBe('ADMIN_ETABLISSEMENT');
    expect(el.querySelector('input[value="MEDECIN"]')).toBeNull();
    expect(el.querySelector('input[value="SAGE_FEMME"]')).toBeNull();
    expect(el.querySelector('input[value="ADMIN"]')).not.toBeNull();
    expect(el.querySelector('#etablissementId')).not.toBeNull();
    expect(utilisateurs['listerTous']).toHaveBeenCalledWith('ADMIN_ETABLISSEMENT');
    expect(composant.etablissementsLibres().map((e) => e.id)).toEqual([3]);
    expect(el.querySelector('#titre-nouveau')?.textContent).toContain('Nouvel administrateur');
  });

  it('il crée un autre administrateur de la plateforme, sans établissement', () => {
    afficher('ADMIN');
    composant.ouvrirCreation();
    remplir('ADMIN', '1');
    fixture.detectChanges();

    expect(composant.choixEtablissement()).toBe(false);
    expect(el.querySelector('#etablissementId')).toBeNull();
    composant.soumettre();

    expect(utilisateurs['creerProfessionnel']).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN', etablissementId: undefined }));
  });

  // ==================== ADMINISTRATEUR D'ÉTABLISSEMENT ====================

  it('l’administrateur d’établissement ne voit que les soignants de sa structure', () => {
    afficher('ADMIN_ETABLISSEMENT');

    expect(utilisateurs['soignantsDeMonEtablissement']).toHaveBeenCalled();
    expect(utilisateurs['listerTous']).not.toHaveBeenCalled();
    expect(el.querySelector('.section-title')?.textContent).toContain('Centre de santé Démo');
    expect(onglets()).toEqual(['Tous', 'Médecins', 'Sages-femmes']);
    expect(el.querySelector('.row-actions__delete')).toBeNull();
  });

  it('les onglets filtrent ses soignants par profil', () => {
    afficher('ADMIN_ETABLISSEMENT');

    composant.changerOnglet('SAGE_FEMME');
    fixture.detectChanges();

    expect(composant.utilisateurs().map((u) => u.id)).toEqual([21]);
  });

  it('il crée seulement des soignants, rattachés d’office à son établissement', () => {
    afficher('ADMIN_ETABLISSEMENT');
    composant.ouvrirCreation();
    fixture.detectChanges();

    expect(el.querySelector('input[value="ADMIN"]')).toBeNull();
    expect(el.querySelector('input[value="ADMIN_ETABLISSEMENT"]')).toBeNull();
    expect(el.textContent).toContain('Le soignant sera rattaché à « Centre de santé Démo »');

    remplir('SAGE_FEMME', '2');
    composant.soumettre();

    expect(utilisateurs['creerProfessionnel']).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'SAGE_FEMME', etablissementId: undefined }));
  });

  it('il retire un soignant de son établissement après confirmation', () => {
    afficher('ADMIN_ETABLISSEMENT');

    composant.demanderConfirmation('retirer', SAGE_FEMME);
    fixture.detectChanges();
    expect(el.querySelector('#titre-confirm-u')?.textContent).toContain('Retirer ce soignant ?');
    composant.confirmerAction();

    expect(etablissements['retirerProfessionnel']).toHaveBeenCalledWith(1, 21);
    expect(composant.succes()).toContain('ne fait plus partie de « Centre de santé Démo »');
  });

  it('il désactive un compte de soignant', () => {
    afficher('ADMIN_ETABLISSEMENT');

    composant.demanderConfirmation('desactiver', MEDECIN);
    composant.confirmerAction();

    expect(utilisateurs['desactiver']).toHaveBeenCalledWith(20);
  });
});
