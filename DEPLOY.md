# Deploy this API (with MongoDB) — easy options

## Option 1: Railway (easiest — app + MongoDB in one place)

1. **Sign up**: [railway.app](https://railway.app) (GitHub login).
2. **New project** → **Deploy from GitHub** → connect repo and select this project.
3. **Add MongoDB**: In the project, click **+ New** → **Database** → **MongoDB**. Railway gives you a connection URL.
4. **Set env vars** for the API service:
   - `MONGODB_URI` = the MongoDB URL from step 3 (e.g. `mongodb://mongo:27017` — use the **internal** URL from Railway’s MongoDB service).
   - `JWT_SECRET` = a long random string, e.g. run `openssl rand -base64 32`.
   - `NODE_ENV` = `production`.
   - `CORS_ORIGINS` = your frontend URL(s), comma-separated, or `*` for testing only.
5. **Build**: Railway detects Node and runs `npm install` + `npm run build`; set **Start Command** to `node dist/main.js` (or leave default if it runs the built app).
6. **Deploy**: Push to GitHub; Railway auto-deploys. Your API URL will be like `https://your-app.up.railway.app`.

---

## Option 2: Render + MongoDB Atlas (free tiers)

**MongoDB (Atlas):**

1. [cloud.mongodb.com](https://cloud.mongodb.com) → create free cluster (M0).
2. **Database Access** → Add user (username + password).
3. **Network Access** → Add IP: `0.0.0.0/0` (allow from anywhere; for production restrict to Render IPs if needed).
4. **Connect** → **Drivers** → copy connection string. Replace `<password>` with your user password. Use the format: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/herolo-messaging?retryWrites=true&w=majority`.

**App (Render):**

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Connect GitHub and select this repo.
3. **Build**: `npm ci && npm run build`.
4. **Start**: `node dist/main.js`.
5. **Environment**:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your Atlas connection string (above)
   - `JWT_SECRET` = `openssl rand -base64 32`
   - `CORS_ORIGINS` = your frontend URL(s) or `*` for testing

---

## Option 3: Docker Compose (your own server or VM)

Runs API + MongoDB on one machine:

```bash
# Optional: set production secrets
export JWT_SECRET=$(openssl rand -base64 32)
export CORS_ORIGINS=https://your-frontend.com

docker compose up --build -d
```

API: `http://localhost:3000` (or your server’s host). Data persists in `mongo_data` volume.

---

## Required env vars (production)

| Variable        | Required | Description                                      |
|----------------|----------|--------------------------------------------------|
| `MONGODB_URI`  | Yes      | MongoDB connection string                        |
| `JWT_SECRET`   | Yes      | Strong secret (not the default from .env.example)|
| `CORS_ORIGINS` | Yes      | Comma-separated allowed origins (e.g. `https://app.example.com`) |
| `NODE_ENV`     | Yes      | Set to `production`                              |
| `PORT`         | No       | Default 3000; set if platform assigns a port     |

---

## Quick test after deploy

```bash
# Health
curl https://YOUR_DEPLOY_URL/api/health

# Register
curl -X POST https://YOUR_DEPLOY_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Use the returned `access_token` in `Authorization: Bearer <token>` for message endpoints.
