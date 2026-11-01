# Back-end Hero SOS

Ce projet est l'API REST du projet Hero SOS, développée avec Node.js, Express et TypeScript. Elle gère les comptes (citoyens, super-héros, administrateurs), les incidents signalés, les interventions des super-héros, les avis, les statistiques, les articles du blog, la vidéothèque des super-héros et la newsletter. Elle est utilisée par le [front-end Hero SOS](https://github.com/tomfrx12/Hero-SOS).

## Liens

| Projet    | Dépôt GitHub                                                      | En ligne                                                                        |
| --------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Front-end | [tomfrx12/Hero-SOS](https://github.com/tomfrx12/Hero-SOS)         | [heros-sos.tom-fourneaux.fr](https://heros-sos.tom-fourneaux.fr/)               |
| Back-end  | [tomfrx12/Hero-SOS-API](https://github.com/tomfrx12/Hero-SOS-API) | [api.heros-sos.tom-fourneaux.fr](https://api.heros-sos.tom-fourneaux.fr/health) |

## Sommaire

1. [Technologies utilisées](#technologies-utilisées)
2. [Installation et lancement](#installation-et-lancement)
   - [Prérequis](#prérequis)
   - [Installation](#installation)
   - [Configuration](#configuration)
   - [Lancement avec Docker (recommandé)](#lancement-avec-docker-recommandé)
   - [Lancement sans Docker](#lancement-sans-docker)
   - [Déploiement en production](#déploiement-en-production)
3. [Scripts disponibles](#scripts-disponibles)
4. [Structure du projet](#structure-du-projet)
5. [Endpoints](#endpoints)
6. [Rôles et accès](#rôles-et-accès)
7. [Auteurs](#auteurs)
8. [Licence](#licence)

## Technologies utilisées

- **[Node.js](https://nodejs.org/)** + **[TypeScript](https://www.typescriptlang.org/)** : environnement d'exécution et typage du code
- **[Express 5](https://expressjs.com/)** : framework HTTP
- **[Prisma 7](https://www.prisma.io/)** : ORM et migrations
- **[PostgreSQL 16](https://www.postgresql.org/)** : base de données
- **[JSON Web Token](https://github.com/auth0/node-jsonwebtoken)** + **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** : authentification et hachage des mots de passe
- **[Zod](https://zod.dev/)** : validation des données reçues
- **[Multer](https://github.com/expressjs/multer)** : envoi des photos de profil et des images des articles
- **[API TMDB](https://developer.themoviedb.org/)** : recherche des films de la vidéothèque (titre, année, affiche, description)
- **[sanitize-html](https://github.com/apostrophecms/sanitize-html)** : nettoyage du HTML des articles (protection contre les failles XSS)
- **[Nodemailer](https://nodemailer.com/)** : envoi des mails ([Mailpit](https://mailpit.axllent.org/) en développement, [Brevo](https://www.brevo.com/) en production)
- **Docker + Traefik** : conteneurisation et déploiement de la version de production

## Installation et lancement

### Prérequis

- [Node.js](https://nodejs.org/)
- npm
- [Docker](https://www.docker.com/) 
- PostgreSQL 16 pour un lancement sans Docker

### Installation

Cloner le repository et installer les dépendances :

```sh
git clone https://github.com/tomfrx12/Hero-SOS-API.git
cd Hero-SOS-API
npm install
```

### Configuration

Copier le fichier d'exemple des variables d'environnement :

```sh
cp .env.example .env
```

Puis renseigner les variables dans le fichier `.env` :

| Variable            | Description                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | Utilisateur de la base (créé par Docker)                                                             |
| `POSTGRES_PASSWORD` | Mot de passe de la base                                                                              |
| `POSTGRES_DB`       | Nom de la base (ex. `hero_sos`)                                                                      |
| `DB_PORT`           | Port de la base sur votre machine (défaut : `5432`, à changer si un PostgreSQL local l'utilise déjà) |
| `DATABASE_URL`      | URL PostgreSQL utilisée par Prisma depuis votre machine (`localhost:DB_PORT`)                        |
| `JWT_SECRET`        | Clé secrète pour signer les tokens JWT (obligatoire, l'API ne démarre pas sans)                      |
| `PORT`              | Port d'écoute de l'API (défaut : `3000`)                                                             |
| `NODE_ENV`          | Environnement (`development` / `production`)                                                         |
| `FRONTEND_URL`      | URL du front autorisée par CORS et utilisée dans les liens des mails (ex. `http://localhost:5173`)   |
| `SMTP_HOST`         | Serveur d'envoi des mails (`localhost` pour Mailpit)                                                 |
| `SMTP_PORT`         | Port du serveur d'envoi des mails (`1025` pour Mailpit)                                              |
| `SMTP_USER`         | Utilisateur SMTP (à laisser absent avec Mailpit, qui n'a pas d'authentification)                     |
| `SMTP_PASSWORD`     | Mot de passe SMTP (à laisser absent avec Mailpit)                                                    |
| `TMDB_API_TOKEN`    | Jeton TMDB « API Read Access Token », à créer sur [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) (nécessaire pour la recherche de films) |

> Avec Docker, `DATABASE_URL`, `SMTP_HOST` et `SMTP_PORT` sont remplacés automatiquement dans le conteneur de l'API pour pointer vers les conteneurs `db` et `mailpit`.

### Lancement avec Docker (recommandé)

`docker-compose.yml` lance PostgreSQL, Mailpit et l'API avec rechargement automatique du code :

```sh
docker compose up -d --build
```

Au premier lancement, appliquer les migrations pour créer les tables :

```sh
docker compose exec api npx prisma migrate dev --config prisma7.config.ts
```

> À relancer après chaque `git pull` qui ajoute une migration dans `prisma/migrations/` (par exemple `add_article` pour le blog ou `add_videotheque` pour la vidéothèque), avec `docker compose up -d --build` si de nouvelles dépendances ont été ajoutées.

| Service    | Adresse                                                      |
| ---------- | ------------------------------------------------------------ |
| API        | [http://localhost:3000](http://localhost:3000/health)        |
| Mailpit    | [http://localhost:8025](http://localhost:8025) (mails reçus) |
| PostgreSQL | `127.0.0.1:5432` (ou `DB_PORT`)                              |

> Le mot de passe de la base n'est appliqué qu'à sa création. S'il change ensuite, il faut aussi le modifier dans PostgreSQL : `docker compose exec db psql -U <POSTGRES_USER> -c "ALTER USER <POSTGRES_USER> PASSWORD '<nouveau>'"`.

### Lancement sans Docker

Avec un PostgreSQL local et la `DATABASE_URL` du `.env` qui pointe dessus :

```sh
# Créer les tables
npx prisma migrate dev --config prisma7.config.ts

# Développement (rechargement automatique)
npm run dev
```

L'API est disponible sur [http://localhost:3000](http://localhost:3000/health). Sans serveur SMTP accessible, les mails ne partent pas mais les requêtes fonctionnent quand même.

Pour la version compilée :

```sh
npm run build
npm start
```

### Déploiement en production

`docker-compose.prod.yml` lance la base, les migrations, l'API et le front derrière le reverse proxy Traefik du serveur. Mailpit n'est pas déployé : les mails passent par Brevo.

Sur le serveur, cloner les deux dépôts côte à côte (le front est construit depuis le dossier `../Hero-SOS`) :

```sh
git clone https://github.com/tomfrx12/Hero-SOS.git
git clone https://github.com/tomfrx12/Hero-SOS-API.git
cd Hero-SOS-API
cp .env.prod.example .env.prod
```

Renseigner `.env.prod` :

| Variable                                                  | Description                                                                       |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `FRONT_DOMAIN`                                            | Domaine du front (ex. `heros-sos.tom-fourneaux.fr`)                               |
| `API_DOMAIN`                                              | Domaine de l'API (ex. `api.heros-sos.tom-fourneaux.fr`)                           |
| `TRAEFIK_NETWORK`                                         | Réseau Docker externe de Traefik                                                  |
| `TRAEFIK_ENTRYPOINT`                                      | Entrypoint HTTPS de Traefik (ex. `websecure`)                                     |
| `TRAEFIK_CERTRESOLVER`                                    | Certresolver de Traefik (ex. `letsencrypt`)                                       |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`     | Accès à la base (mot de passe sans caractères spéciaux : `openssl rand -hex 32`)  |
| `JWT_SECRET`                                              | Clé secrète des tokens (`openssl rand -hex 64`)                                   |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | Accès SMTP Brevo                                                                  |
| `TMDB_API_TOKEN`                                          | Jeton TMDB pour la recherche de films                                             |

Faire pointer le DNS des deux domaines vers le serveur, puis lancer (et relancer à chaque mise à jour après un `git pull` dans les deux dépôts) :

```sh
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Les migrations sont appliquées automatiquement par le service `migrate` avant le démarrage de l'API. L'application est alors accessible sur [heros-sos.tom-fourneaux.fr](https://heros-sos.tom-fourneaux.fr/) et l'API sur [api.heros-sos.tom-fourneaux.fr](https://api.heros-sos.tom-fourneaux.fr/health).

## Scripts disponibles

| Commande        | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `npm run dev`   | Génère le client Prisma et lance l'API avec rechargement automatique |
| `npm run build` | Compile le TypeScript dans le dossier `dist/`                        |
| `npm start`     | Lance la version compilée                                            |

## Structure du projet

```
├── prisma/
│   ├── migrations/          # Migrations de la base
│   └── schema.prisma        # Modèles de la base
├── src/
│   ├── controleurs/         # Traitement des requêtes
│   ├── middlewares/         # Authentification et vérification des rôles
│   ├── routes/              # Déclaration des routes
│   ├── services/            # Prisma, tokens, mails, envoi de fichiers, doublons
│   └── index.ts             # Point d'entrée
├── uploads/                 # Photos de profil et images des articles (servies sur /uploads)
├── docker-compose.yml       # Développement (base, Mailpit, API)
├── docker-compose.prod.yml  # Production (base, migrations, API, front, Traefik)
├── Dockerfile               # Image de production
├── Dockerfile.dev           # Image de développement
└── prisma7.config.ts        # Configuration de Prisma
```

## Endpoints

Les routes protégées attendent l'en-tête `Authorization: Bearer <token>`, obtenu avec `POST /auth/connexion`.

### Général

| Méthode | Route               | Accès  | Description                          |
| ------- | ------------------- | ------ | ------------------------------------ |
| GET     | `/health`           | Public | Vérifie que l'API est opérationnelle |
| GET     | `/uploads/:fichier` | Public | Photos de profil et images des articles |

### Authentification

| Méthode | Route                              | Accès    | Description                                                                  |
| ------- | ---------------------------------- | -------- | ---------------------------------------------------------------------------- |
| POST    | `/auth/inscription`                | Public   | Crée un compte citoyen (actif) ou super-héros (en attente de validation)     |
| POST    | `/auth/connexion`                  | Public   | `{ identifiant, mot_de_passe }` → `{ token, utilisateur }` (email ou pseudo) |
| GET     | `/auth/me`                         | Connecté | Utilisateur connecté                                                         |
| POST    | `/auth/mot-de-passe-oublie`        | Public   | Envoie un lien de réinitialisation par mail (valable 1 heure)                |
| POST    | `/auth/reinitialiser-mot-de-passe` | Public   | Enregistre le nouveau mot de passe                                           |

### Incidents

| Méthode | Route                         | Accès                       | Description                                     |
| ------- | ----------------------------- | --------------------------- | ----------------------------------------------- |
| GET     | `/incidents`                  | Connecté                    | Liste des incidents                             |
| GET     | `/incidents/recents`          | Public                      | Les 5 derniers incidents (alertes de l'accueil) |
| GET     | `/incidents/en-cours`         | Public                      | Incidents non terminés (carte publique)         |
| GET     | `/incidents/:id`              | Connecté                    | Détail d'un incident                            |
| GET     | `/incidents/:id/doublons`     | Administrateurs             | Doublons possibles d'un incident                |
| POST    | `/incidents`                  | Citoyens, Administrateurs   | Signale un incident                             |
| POST    | `/incidents/:id/intervention` | SuperHeros                  | Prend en charge un incident                     |
| PATCH   | `/incidents/:id/intervention` | SuperHeros                  | Termine une intervention (réussie ou échouée)   |
| PATCH   | `/incidents/:id/urgence`      | SuperHeros, Administrateurs | Change le niveau d'urgence                      |
| PATCH   | `/incidents/:id`              | Administrateurs             | Modifie un incident                             |
| DELETE  | `/incidents/:id`              | Administrateurs             | Supprime un incident                            |

### Super-héros, super-vilains et statistiques

| Méthode | Route             | Accès           | Description                                                                         |
| ------- | ----------------- | --------------- | ----------------------------------------------------------------------------------- |
| GET     | `/heros`          | Public          | Super-héros actifs avec note moyenne et missions réussies                           |
| GET     | `/vilains`        | Public          | Super-vilains avec nombre d'incidents et d'arrestations                             |
| POST    | `/vilains`        | Administrateurs | Crée un super-vilain `{ pseudo, specialite, secteur, nom?, prenom?, description? }` |
| GET     | `/stats`          | Public          | Héros actifs, incidents signalés, taux de réussite, temps moyen                     |
| GET     | `/stats/globales` | SuperHeros      | Statistiques globales de l'espace super-héros                                       |

### Compte de l'utilisateur connecté

| Méthode | Route                    | Accès                     | Description                                          |
| ------- | ------------------------ | ------------------------- | ---------------------------------------------------- |
| GET     | `/moi`                   | Connecté                  | Profil de l'utilisateur connecté                     |
| PATCH   | `/moi`                   | Connecté                  | Modifie le profil                                    |
| PATCH   | `/moi/email`             | Connecté                  | Demande un changement d'adresse email                |
| PATCH   | `/moi/mot-de-passe`      | Connecté                  | Change le mot de passe                               |
| POST    | `/moi/photo`             | Connecté                  | Change la photo de profil (image, 2 Mo maximum)      |
| GET     | `/moi/incidents`         | Citoyens, Administrateurs | Incidents signalés, avec les héros et la note donnée |
| POST    | `/moi/notes`             | Citoyens, Administrateurs | Note un super-héros après une intervention           |
| GET     | `/moi/statistiques`      | SuperHeros                | Statistiques personnelles                            |
| GET     | `/moi/interventions`     | SuperHeros                | Interventions, la plus récente en premier            |
| GET     | `/moi/reputation`        | SuperHeros                | Avis laissés par les citoyens                        |
| PATCH   | `/moi/notes/:id/reponse` | SuperHeros                | Répond à un avis                                     |

### Newsletter

| Méthode | Route         | Accès  | Description                 |
| ------- | ------------- | ------ | --------------------------- |
| POST    | `/newsletter` | Public | Inscription à la newsletter |
| DELETE  | `/newsletter` | Public | Désinscription              |

### Blog

| Méthode | Route           | Accès  | Description                                  |
| ------- | --------------- | ------ | -------------------------------------------- |
| GET     | `/articles`     | Public | Articles publiés, le plus récent en premier  |
| GET     | `/articles/:id` | Public | Détail d'un article publié                   |

### Vidéothèque

Les super-héros ajoutent des films trouvés sur TMDB. Un film n'apparaît dans la vidéothèque publique qu'une fois validé par un administrateur.

| Méthode | Route                    | Accès      | Description                                                       |
| ------- | ------------------------ | ---------- | ----------------------------------------------------------------- |
| GET     | `/videotheque`           | Public     | Films validés, avec les héros qui les ont ajoutés                 |
| GET     | `/videotheque/recherche` | SuperHeros | Recherche un film sur TMDB (`?q=titre`)                           |
| GET     | `/videotheque/mes-films` | SuperHeros | Films ajoutés par le héros connecté, avec leur statut             |
| POST    | `/videotheque`           | SuperHeros | Ajoute un film `{ tmdb_id, titre, annee?, affiche_url?, description? }` (en attente de validation) |
| DELETE  | `/videotheque/:filmId`   | SuperHeros | Retire un film de sa vidéothèque                                  |

### Administration (administrateurs uniquement)

| Méthode | Route                       | Description                                                  |
| ------- | --------------------------- | ------------------------------------------------------------ |
| GET     | `/admin/tableau-de-bord`    | Données du tableau de bord                                   |
| GET     | `/admin/utilisateurs`       | Liste des utilisateurs                                       |
| GET     | `/admin/utilisateurs/:id`   | Détail d'un compte (incidents signalés, interventions, avis) |
| PATCH   | `/admin/utilisateurs/:id`   | Actions sur un compte                                        |
| GET     | `/admin/incidents/:id`      | Détail d'un incident (signalement, héros, avis, vilains)     |
| GET     | `/admin/avis`               | Liste des avis                                               |
| PATCH   | `/admin/avis/:id`           | Affiche ou masque un avis                                    |
| POST    | `/admin/newsletter/envoyer` | Envoie la newsletter aux abonnés                             |
| GET     | `/admin/articles`           | Tous les articles, publiés ou en brouillon                   |
| GET     | `/admin/articles/:id`       | Détail d'un article                                          |
| POST    | `/admin/articles`           | Crée un article (`titre`, `contenu_html`, `publie`, `image` en FormData) |
| PATCH   | `/admin/articles/:id`       | Modifie un article (mêmes champs)                            |
| DELETE  | `/admin/articles/:id`       | Supprime un article                                          |
| GET     | `/admin/videotheque`        | Films ajoutés par les héros (filtre `?statut=EnAttente`, `Valide` ou `Refuse`) |
| PATCH   | `/admin/videotheque/:id/valider` | Valide un film (il apparaît dans la vidéothèque publique) |
| PATCH   | `/admin/videotheque/:id/refuser` | Refuse un film                                          |

## Rôles et accès

L'API gère quatre rôles : **Citoyens**, **SuperHeros**, **SuperVillains** et **Administrateurs**. Un compte peut être **EnAttente** (super-héros pas encore validé), **Actif** ou **Desactive**. Le token JWT est valable 7 jours. Sans token valide, les routes protégées répondent `401`, et avec un rôle non autorisé `403`.

## Auteurs

- **[Tom Fourneaux](https://tom-fourneaux.fr)** - [LinkedIn](https://www.linkedin.com/in/tom-fourneaux-4a8b31384) - [GitHub](https://github.com/tomfrx12)
- **[Nino Rameau](https://nino-rameau.fr)** - [LinkedIn](https://www.linkedin.com/in/nino-rameau-1a0636332/) - [GitHub](https://github.com/Nino-Rameau)

## Licence

Réalisé dans le cadre scolaire en octobre 2026.
