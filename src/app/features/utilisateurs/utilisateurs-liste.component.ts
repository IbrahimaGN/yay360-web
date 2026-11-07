import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { StateComponent } from '../../shared/components/state/state.component';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, switchMap, catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { AuthService } from '../../core/services/auth.service';
import { Role, RoleProfessionnel, Utilisateur } from '../../core/models/utilisateur.model';
import { messageErreur } from '../../core/utils/message-erreur';
import { libelleRole } from '../../core/utils/libelles';
import { AIDE_TELEPHONE, MOTIF_TELEPHONE_SENEGAL, VALIDATEURS_NOM } from '../../core/validators/validateurs';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IconName } from '../../core/models/nav-item.model';

type CleOnglet = 'TOUS' | Role;
type FiltreStatut = 'TOUS' | 'ACTIFS' | 'INACTIFS';

/** Compte tout juste créé dont le mot de passe temporaire doit être transmis (affiché une seule fois). */
interface CompteCree {
  nomComplet: string;
  email: string;
  motDePasseTemporaire: string | null;
  emailEnvoye: boolean;
}

@Component({
  selector: 'yay360-utilisateurs-liste',
  standalone: true,
  imports: [StateComponent, DatePipe, ReactiveFormsModule, IconComponent],
  templateUrl: './utilisateurs-liste.component.html',
  styleUrl: './utilisateurs-liste.component.scss',
})
export class UtilisateursListeComponent {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly libelleRole = libelleRole;
  readonly aideTelephone = AIDE_TELEPHONE;

  readonly onglets: { cle: CleOnglet; label: string; icone: IconName }[] = [
    { cle: 'TOUS', label: 'Tous', icone: 'users' },
    { cle: 'FEMME_ENCEINTE', label: 'Patientes', icone: 'heart' },
    { cle: 'CONJOINT', label: 'Conjoints', icone: 'users' },
    { cle: 'MEDECIN', label: 'Médecins', icone: 'clipboard' },
    { cle: 'SAGE_FEMME', label: 'Sages-femmes', icone: 'activity' },
    { cle: 'ADMIN', label: 'Admins', icone: 'shield' },
  ];

  readonly ongletActif = signal<CleOnglet>('TOUS');
  readonly chargement = signal(true);
  readonly erreur = signal<string | null>(null);
  readonly erreurAction = signal<string | null>(null);
  readonly succes = signal<string | null>(null);
  readonly utilisateurs = signal<Utilisateur[]>([]);
  readonly idEnAction = signal<number | null>(null);

  readonly recherche = signal('');
  readonly filtreStatut = signal<FiltreStatut>('TOUS');

  readonly formulaireOuvert = signal(false);
  readonly enregistrement = signal(false);
  readonly erreurFormulaire = signal<string | null>(null);
  readonly compteCree = signal<CompteCree | null>(null);
  readonly copie = signal(false);

  /** Confirmation d'une action sensible (remplace la boîte native). */
  readonly confirmation = signal<{ mode: 'desactiver' | 'supprimer'; utilisateur: Utilisateur } | null>(null);

  readonly dateNaissanceMax = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  readonly stats = computed(() => {
    const l = this.utilisateurs();
    return { total: l.length, actifs: l.filter((u) => u.actif).length, inactifs: l.filter((u) => !u.actif).length };
  });

  readonly utilisateursFiltres = computed(() => {
    const terme = this.recherche().trim().toLowerCase();
    const st = this.filtreStatut();
    return this.utilisateurs()
      .filter((u) => (st === 'TOUS' || (st === 'ACTIFS' ? u.actif : !u.actif)) &&
        (!terme || `${u.prenom} ${u.nom}`.toLowerCase().includes(terme) || u.email.toLowerCase().includes(terme) || (u.telephone ?? '').includes(terme)))
      .sort((a, b) => +new Date(b.dateCreation) - +new Date(a.dateCreation));
  });
  readonly filtresActifs = computed(() => !!this.recherche().trim() || this.filtreStatut() !== 'TOUS');

  readonly form = this.fb.group({
    nom: ['', VALIDATEURS_NOM],
    prenom: ['', VALIDATEURS_NOM],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    telephone: ['', [Validators.required, Validators.pattern(MOTIF_TELEPHONE_SENEGAL)]],
    dateNaissance: ['', [Validators.required]],
    role: ['MEDECIN' as RoleProfessionnel, [Validators.required]],
  });

  /** Un seul chargement à la fois : la réponse d'un ancien onglet n'écrase jamais l'onglet actif. */
  private readonly rechargement$ = new Subject<CleOnglet>();

  constructor() {
    this.rechargement$
      .pipe(
        tap(() => {
          this.chargement.set(true);
          this.erreur.set(null);
        }),
        switchMap((cle) =>
          this.utilisateurService.listerTous(cle === 'TOUS' ? undefined : cle).pipe(
            catchError((err) => {
              this.erreur.set(messageErreur(err, 'Impossible de charger les utilisateurs.'));
              return of(null);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((liste) => {
        if (liste) {
          this.utilisateurs.set(liste);
        }
        this.chargement.set(false);
      });
    this.charger();
  }

  @HostListener('document:keydown.escape')
  onEchap(): void {
    if (this.confirmation()) this.confirmation.set(null);
    else if (this.formulaireOuvert()) this.fermerFormulaire();
  }

  /** L'admin connecté ne peut pas se désactiver ni se supprimer lui-même depuis la liste. */
  estMoi(u: Utilisateur): boolean {
    return u.email.toLowerCase() === (this.authService.session()?.email ?? '').toLowerCase();
  }

  initiales(u: Utilisateur): string {
    return `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();
  }

  changerOnglet(cle: CleOnglet): void {
    if (cle === this.ongletActif()) return;
    this.ongletActif.set(cle);
    this.charger();
  }

  charger(): void {
    this.rechargement$.next(this.ongletActif());
  }

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.filtreStatut.set('TOUS');
  }

  invalide(nom: 'nom' | 'prenom' | 'email' | 'telephone' | 'dateNaissance' | 'role'): boolean {
    const c = this.form.controls[nom];
    return c.invalid && c.touched;
  }

  ouvrirCreation(): void {
    this.form.reset({ role: 'MEDECIN' });
    this.erreurFormulaire.set(null);
    this.formulaireOuvert.set(true);
  }

  fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
  }

  soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enregistrement.set(true);
    this.erreurFormulaire.set(null);

    const v = this.form.getRawValue();
    this.utilisateurService
      .creerProfessionnel({
        nom: v.nom!.trim(),
        prenom: v.prenom!.trim(),
        email: v.email!.trim(),
        telephone: v.telephone!.trim(),
        dateNaissance: v.dateNaissance!,
        role: v.role!,
      })
      .subscribe({
        next: (r) => {
          this.enregistrement.set(false);
          this.formulaireOuvert.set(false);
          this.copie.set(false);
          this.compteCree.set({
            nomComplet: `${r.utilisateur.prenom} ${r.utilisateur.nom}`,
            email: r.utilisateur.email,
            motDePasseTemporaire: r.motDePasseTemporaire,
            emailEnvoye: r.emailEnvoye,
          });
          this.charger();
        },
        error: (err) => {
          this.enregistrement.set(false);
          this.erreurFormulaire.set(messageErreur(err, 'Impossible de créer ce compte. Vérifiez les informations saisies.'));
        },
      });
  }

  copierMotDePasse(): void {
    const mdp = this.compteCree()?.motDePasseTemporaire;
    if (mdp) {
      navigator.clipboard?.writeText(mdp).then(() => this.copie.set(true));
    }
  }

  /** Le mot de passe temporaire est effacé de la mémoire dès la fermeture du panneau. */
  fermerCompteCree(): void {
    this.compteCree.set(null);
    this.copie.set(false);
  }

  activer(u: Utilisateur): void {
    this.executer(u, this.utilisateurService.activer(u.id), "Impossible d'activer ce compte.", `Compte de ${u.prenom} ${u.nom} activé.`);
  }

  demanderConfirmation(mode: 'desactiver' | 'supprimer', u: Utilisateur): void {
    this.erreurAction.set(null);
    this.confirmation.set({ mode, utilisateur: u });
  }

  confirmerAction(): void {
    const c = this.confirmation();
    if (!c) return;
    const u = c.utilisateur;
    const nom = `${u.prenom} ${u.nom}`;
    if (c.mode === 'desactiver') {
      this.executer(u, this.utilisateurService.desactiver(u.id), 'Impossible de désactiver ce compte.', `Compte de ${nom} désactivé.`);
    } else {
      this.executer(u, this.utilisateurService.supprimer(u.id), 'Impossible de supprimer ce compte.', `Compte de ${nom} supprimé.`);
    }
  }

  private executer(u: Utilisateur, action: Observable<unknown>, parDefaut: string, messageSucces: string): void {
    this.idEnAction.set(u.id);
    this.erreurAction.set(null);
    this.succes.set(null);
    action.subscribe({
      next: () => {
        this.idEnAction.set(null);
        this.confirmation.set(null);
        this.succes.set(messageSucces);
        this.charger();
      },
      error: (err: unknown) => {
        this.idEnAction.set(null);
        this.confirmation.set(null);
        this.erreurAction.set(messageErreur(err, parDefaut));
      },
    });
  }
}
