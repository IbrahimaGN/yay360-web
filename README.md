# YAY360 — Web (Angular)

Plateforme intelligente de suivi de la santé maternelle destinée aux femmes enceintes et aux professionnels de santé. L’espace web sert à l’**administration**, aux **professionnels de santé** (médecins et sages-femmes) et à l’**espace famille** (femme enceinte et conjoint).
SPA Angular 21 standalone (pas de SSR — inutile derrière une authentification).

## Démarrage

### Développement

```bash
npm ci
npm start          # http://localhost:4200, API sur http://localhost:8080 (src/environments/environment.ts)
```

Le backend (`yay360-backend`) doit tourner en parallèle ; son CORS accepte `http://localhost:*`.

### Production (Docker)

Le build de production appelle l'API sur **`/api`** (même origine) : Nginx relaie `/api/` vers le backend
(`API_UPSTREAM`, par défaut `http://yay360-api:8080` sur le réseau Docker Compose). Aucune URL n'est donc
codée en dur dans le bundle, et il n'y a pas de CORS en production.

```bash
cd ../yay360-backend && docker compose up -d --build   # web sur http://localhost:4200
```

Nginx (`nginx/`) ajoute les en-têtes de sécurité (CSP, X-Frame-Options, nosniff, Permissions-Policy),
revalide `index.html` à chaque visite, met en cache longue durée les fichiers hachés et n'en met jamais
sur les réponses de l'API (données de santé).

### Tests

```bash
npm test           # Vitest via @angular/build:unit-test
```

Tests du socle : authentification et session, intercepteur HTTP, guards, validateurs alignés sur le backend,
messages d'erreur, et **contrat d'API** (méthode, URL et corps de chaque appel vers le backend).

## Design system

Design tokens définis en variables CSS dans `src/styles.scss` :

| Rôle | Couleur |
|---|---|
| `--color-indigo-nuit` | `#1c2b4a` — fond sombre (sidebar), rigueur clinique |
| `--color-corail-aurore` | `#e8636b` — accent, actions principales, chaleur maternelle |
| `--color-sable-chaud` | `#faf3e9` — fond clair |
| `--color-argile` | `#a9836c` — texte secondaire, bordures |
| `--color-vert-sahel` | `#4c8c6b` — succès |
| `--color-ambre` | `#e0a63a` — attention |

Typographie : `Spectral` (titres) + `Plus Jakarta Sans` (interface) + `IBM Plex Mono` (données).

**Signature visuelle** : l'anneau des 40 semaines de grossesse (segmenté par
trimestre T1/T2/T3), utilisé comme logo abstrait et repris comme composant
réel sur les fiches grossesse (étapes suivantes).

## Architecture

```
src/app/
├── core/
│   ├── guards/        # authGuard, roleGuard
│   ├── interceptors/  # authInterceptor (JWT + gestion 401)
│   ├── models/        # interfaces TypeScript (miroir des DTOs backend)
│   └── services/       # AuthService (session en signal + localStorage)
├── features/
│   └── auth/           # login, forgot-password, reset-password
└── shared/
    └── components/     # composants réutilisables (access-denied, etc.)
```

Les femmes enceintes et leurs conjoints associés disposent d'un espace familial
partagé : suivi de grossesse, consultations, rendez-vous et alertes, dossier
familial et notifications. Le compte du conjoint est personnel et lié au dossier via une
invitation. L'envoi réel des invitations dépend de la configuration SMTP du backend.

## Fonctionnalités

**Sécurité et session**
- Session JWT : rôle et expiration lus dans le jeton signé, session expirée purgée, retour à la page demandée.
- Le jeton n'est envoyé qu'à l'API ; un 401 déconnecte une seule fois, un 401 sur `/auth/*` n'est pas une fin de session.
- Compte créé par l'admin : changement obligatoire du mot de passe temporaire avant tout accès.
- Changement de mot de passe : le nouveau jeton remplace l'ancien (révoqué par le serveur).
- Validations identiques au backend (mot de passe 8 caractères, téléphone `+221`, noms, tension en mmHg).
- Messages d'erreur du serveur affichés, y compris le détail champ par champ.

**Administration**
- Création des médecins, sages-femmes et administrateurs (mot de passe temporaire affiché une seule fois).
- Tableau de bord : ratio de grossesses à risque, taux de résolution des alertes, délai moyen de prise en charge,
  alertes non résolues par gravité.
- Établissements, conseils et étapes de grossesse, comptes utilisateurs.

**Professionnels de santé** (uniquement les patientes qu'ils suivent)
- Recherche exacte d'une patiente (téléphone ou email) et rattachement à leur établissement.
- Fiche grossesse : plan des 8 consultations prénatales OMS, évaluation automatique du risque, calendrier,
  suivi hebdomadaire, consultations, rendez-vous ; déclaration à risque et clôture (médecin).
- Rendez-vous : planification, confirmation, report, annulation motivée, statuts selon les transitions autorisées.
- Consultations : constantes validées, signaux cliniques détectés automatiquement.
- Alertes : prise en charge puis résolution avec observations obligatoires, justification du triage, origine.

**Espace famille** (femme enceinte et conjoint)
- Déclaration de la grossesse (femme enceinte), choix de l'établissement de suivi, plan des consultations prénatales.
- Signalement d'un symptôme avec consigne immédiate et explication du niveau de gravité.
- Invitation du conjoint : code à usage unique et lien à transmettre par SMS ou WhatsApp.

## Comptes de test (backend `DataInitializer`)

- Admin : `admin@yay360.sn` / `Admin@2026`
