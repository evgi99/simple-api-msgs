# Herolo Messaging API

REST API for a simple messaging system (Herolo home assignment). Built with NestJS, MongoDB, and JWT authentication.

## Features

- **Auth**: Register and login (JWT). All message endpoints require a valid Bearer token.
- **Messages**: Write message, get all messages for current user, get unread messages, read single message (marks as read for receiver), delete message (soft-delete as sender or receiver).
- **Health**: `GET /api/health` – app and database status.
- **Metrics**: `GET /api/metrics` – Prometheus metrics.
- **Security**: Helmet, CORS, rate limiting (Throttler), validation (class-validator).

## Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- (Optional) Docker for containerized run

## Setup

1. Clone and install dependencies:

   ```bash
   npm ci
   ```

2. Copy environment file and set variables:

   ```bash
   cp .env.example .env
   # Edit .env: set MONGODB_URI and JWT_SECRET for production
   ```

3. Run locally:

   ```bash
   npm run start:dev
   ```

   API base URL: `http://localhost:3000` (or `PORT` from `.env`). All routes are under `/api`.

## API base paths

| Path | Description |
|------|-------------|
| `POST /api/auth/register` | Register (body: `email`, `password`) |
| `POST /api/auth/login` | Login (body: `email`, `password`) |
| `POST /api/messages` | Write message (body: `receiverId`, `subject`, `body`) |
| `GET /api/messages` | Get all messages for current user |
| `GET /api/messages/unread` | Get unread messages for current user |
| `GET /api/messages/:id` | Read one message (marks as read if receiver) |
| `DELETE /api/messages/:id` | Soft-delete for current user |
| `GET /api/health` | Health and DB status |
| `GET /api/metrics` | Prometheus metrics |

## Postman

Import the collection from `postman/Herolo-Messaging-API.postman_collection.json`.

- Set collection variable `baseUrl` (e.g. `http://localhost:3000` for local, or your deployed URL).
- Run **Register** or **Login**; the collection will store `access_token` for message requests.
- For **Write message**, set `receiverId` to another user’s `_id` (e.g. create a second user and use their id from Register response).

## Docker

Build and run with Docker (MongoDB must be provided separately, e.g. via env `MONGODB_URI`):

```bash
docker build -t herolo-messaging-api .
docker run -p 3000:3000 -e MONGODB_URI="mongodb://host.docker.internal:27017/herolo-messaging" -e JWT_SECRET=your-secret herolo-messaging-api
```

For a full stack with MongoDB in Docker, use docker-compose or run MongoDB in a separate container and pass its URL.

## Scripts

- `npm run start` – run production build.
- `npm run start:dev` – run in development with watch.
- `npm run build` – compile TypeScript.
- `npm run test` – unit tests.
- `npm run test:e2e` – e2e tests (use in-memory MongoDB).
- `npm run lint` – ESLint.

## Deployment

Suitable for free tiers (e.g. Render, Fly.io, Railway):

1. Set environment variables: `MONGODB_URI`, `JWT_SECRET`, optionally `PORT` and `JWT_EXPIRES_IN`.
2. Build: `npm run build`.
3. Start: `node dist/main.js`, or use the provided Dockerfile.

Ensure the platform allows outbound connections to your MongoDB (e.g. Atlas with IP allowlist or VPC).
