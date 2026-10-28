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
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `JWT_EXPIRES_IN` | Durée de validité du token (ex: `7d`) |
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

L'API sera disponible sur `http://localhost:3000` et PostgreSQL sur le port `5432`.

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

## Structure

```
src/
├── controleurs/   # Logique de traitement des requêtes
├── middlewares/   # Middlewares Express (auth, validation...)
├── routes/        # Définition des routes
├── services/      # Logique métier
└── index.ts       # Point d'entrée
```
