# Hero SOS API

REST API backend pour le projet Hero SOS, construite avec Node.js, Express et TypeScript.

## Stack

- **Runtime** : Node.js + TypeScript
- **Framework** : Express
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Auth** : JWT + bcrypt
- **Validation** : Zod
- **CORS** : cors

## Prérequis

- Node.js >= 18
- PostgreSQL

## Installation

```bash
npm install
```

## Configuration

Copie le fichier d'exemple et renseigne tes variables :

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Utilisateur de la base (créé par Docker) |
| `POSTGRES_PASSWORD` | Mot de passe de la base, à choisir fort |
| `POSTGRES_DB` | Nom de la base (ex: `hero_sos`) |
| `DB_PORT` | Port de la base sur ta machine (défaut: `5432`, à changer si un Postgres local l'utilise déjà) |
| `DATABASE_URL` | URL PostgreSQL utilisée par Prisma depuis ta machine (`localhost:DB_PORT`) |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `PORT` | Port d'écoute du serveur (défaut: `3000`) |
| `NODE_ENV` | Environnement (`development` / `production`) |
| `FRONTEND_URL` | URL du front autorisée par CORS |

## Base de données

```bash
# Créer et appliquer les migrations
npx prisma migrate dev

# Générer le client Prisma
npx prisma generate
```

## Lancement

### Avec Docker (recommandé)

```bash
docker compose up --build
```

L'API sera disponible sur `http://localhost:3000`, PostgreSQL sur le port `5432` (ou `DB_PORT`) et Adminer sur `http://localhost:8080`.

Pour se connecter à la base avec un client (TablePlus, DBeaver…) : hôte `127.0.0.1`, port `DB_PORT`, et les `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` de ton `.env`.

> Le mot de passe n'est appliqué qu'à la création de la base. Si tu le changes ensuite, mets-le aussi à jour dans Postgres : `docker compose exec db psql -U <POSTGRES_USER> -c "ALTER USER <POSTGRES_USER> PASSWORD '<nouveau>'"`.

### Sans Docker

```bash
# Développement (hot-reload)
npm run dev

# Build production
npm run build

# Lancer la version compilée
npm start
```

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Vérifie que l'API est opérationnelle |
| POST | `/auth/inscription` | Crée un compte citoyen (actif) ou super-héros (en attente de validation) |
| POST | `/auth/connexion` | `{ identifiant, mot_de_passe }` → `{ token, utilisateur }` (identifiant = email ou pseudo) |
| GET | `/auth/me` | Utilisateur connecté (en-tête `Authorization: Bearer <token>`) |
| GET | `/incidents/recents` | Public : les 5 derniers incidents avec vilain et héros |
| GET | `/heros` | Public : super-héros actifs avec note moyenne et missions réussies |
| GET | `/stats` | Public : héros actifs, incidents signalés, taux de réussite, temps moyen |

## Structure

```
src/
├── controleurs/   # Logique de traitement des requêtes
├── middlewares/   # Middlewares Express (auth, validation...)
├── routes/        # Définition des routes
├── services/      # Logique métier
└── index.ts       # Point d'entrée
```
