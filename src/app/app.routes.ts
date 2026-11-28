import { Routes } from '@angular/router';
import { authGuard, inviteGuard, motDePasseTemporaireGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/public-home/public-home.component').then((m) => m.PublicHomeComponent),
    title: 'YAY360 — Votre suivi maternel, à chaque étape',
  },
  {
    path: 'inscription',
    canActivate: [inviteGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    title: 'Inscription — YAY360',
  },
  {
    path: 'connexion',
    canActivate: [inviteGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Connexion — YAY360',
  },
  {
    path: 'mot-de-passe-oublie',
    canActivate: [inviteGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
    title: 'Mot de passe oublié — YAY360',
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
    title: 'Réinitialiser le mot de passe — YAY360',
  },
  {
    path: 'accepter-invitation-conjoint',
    loadComponent: () =>
      import('./features/famille/accepter-invitation/accepter-invitation.component').then(
        (m) => m.AccepterInvitationComponent
      ),
    title: 'Rejoindre un dossier familial — YAY360',
  },
  {
    path: 'changer-mot-de-passe',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/changer-mot-de-passe/changer-mot-de-passe.component').then(
        (m) => m.ChangerMotDePasseComponent
      ),
    title: 'Choisir mon mot de passe — YAY360',
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('./shared/components/access-denied/access-denied.component').then(
        (m) => m.AccessDeniedComponent
      ),
    title: 'Accès refusé — YAY360',
  },
  {
    path: '',
    canActivate: [authGuard, motDePasseTemporaireGuard],
    loadComponent: () =>
      import('./shared/components/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'accueil',
      },
      {
        path: 'accueil',
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
        data: { pageTitle: 'Accueil' },
      },
      {
        path: 'tableau-de-bord',
        canActivate: [roleGuard],
        data: { pageTitle: 'Tableau de bord', roles: ['ADMIN'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'grossesses',
        canActivate: [roleGuard],
        data: { pageTitle: 'Suivi des grossesses', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/grossesses/liste/grossesses-liste.component').then(
                (m) => m.GrossessesListeComponent
              ),
          },
          {
            // Déclarée avant ':id' pour ne pas être interprétée comme un identifiant
            path: 'recherche',
            canActivate: [roleGuard],
            data: { pageTitle: 'Rechercher une patiente', roles: ['MEDECIN', 'SAGE_FEMME'] },
            loadComponent: () =>
              import('./features/grossesses/recherche/recherche-patiente.component').then(
                (m) => m.RecherchePatienteComponent
              ),
          },
          {
            path: ':id',
            data: { pageTitle: 'Fiche grossesse' },
            loadComponent: () =>
              import('./features/grossesses/detail/grossesse-detail.component').then(
                (m) => m.GrossesseDetailComponent
              ),
          },
        ],
      },
      {
        path: 'rendez-vous',
        canActivate: [roleGuard],
        data: { pageTitle: 'Rendez-vous', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
        loadComponent: () =>
          import('./features/rendez-vous/rendez-vous-liste.component').then(
            (m) => m.RendezVousListeComponent
          ),
      },
      {
        path: 'consultations',
        canActivate: [roleGuard],
        data: { pageTitle: 'Consultations', roles: ['MEDECIN', 'SAGE_FEMME'] },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/consultations/liste/consultations-liste.component').then(
                (m) => m.ConsultationsListeComponent
              ),
          },
          {
            path: 'nouvelle',
            data: { pageTitle: 'Nouvelle consultation' },
            loadComponent: () =>
              import('./features/consultations/nouvelle/nouvelle-consultation.component').then(
                (m) => m.NouvelleConsultationComponent
              ),
          },
          {
            path: ':id',
            data: { pageTitle: 'Consultation' },
            loadComponent: () =>
              import('./features/consultations/detail/consultation-detail.component').then(
                (m) => m.ConsultationDetailComponent
              ),
          },
        ],
      },
      {
        path: 'alertes',
        canActivate: [roleGuard],
        data: { pageTitle: 'Alertes', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
        loadComponent: () =>
          import('./features/alertes/alertes-liste.component').then((m) => m.AlertesListeComponent),
      },
      {
        path: 'etablissements',
        canActivate: [roleGuard],
        data: { pageTitle: 'Établissements', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/etablissements/etablissements-liste.component').then(
            (m) => m.EtablissementsListeComponent
          ),
      },
      {
        path: 'conseils',
        canActivate: [roleGuard],
        data: { pageTitle: 'Conseils & étapes', roles: ['ADMIN', 'MEDECIN', 'SAGE_FEMME'] },
        loadComponent: () =>
          import('./features/conseils/conseils-etapes.component').then(
            (m) => m.ConseilsEtapesComponent
          ),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard],
        data: { pageTitle: 'Utilisateurs', roles: ['ADMIN'] },
        loadComponent: () =>
          import('./features/utilisateurs/utilisateurs-liste.component').then(
            (m) => m.UtilisateursListeComponent
          ),
      },
      {
        path: 'notifications',
        data: { pageTitle: 'Notifications' },
        loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'dossier-familial',
        canActivate: [roleGuard],
        data: { pageTitle: 'Dossier familial', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
        loadComponent: () =>
          import('./features/famille/dossier-familial/dossier-familial.component').then(
            (m) => m.DossierFamilialComponent
          ),
      },
      {
        path: 'suivi-prenatal',
        canActivate: [roleGuard],
        data: { pageTitle: 'Suivi prénatal', roles: ['FEMME_ENCEINTE', 'CONJOINT'] },
        loadComponent: () =>
          import('./features/famille/suivi-prenatal/suivi-prenatal.component').then(
            (m) => m.SuiviPrenatalComponent
          ),
      },
      {
        path: 'profil',
        data: { pageTitle: 'Mon profil' },
        loadComponent: () =>
          import('./features/profil/profil.component').then((m) => m.ProfilComponent),
      },
    ],
  },
  {
    // Utilisateur connecté → accueil ; sinon authGuard redirige vers la connexion
    path: '**',
    redirectTo: 'accueil',
  },
];
