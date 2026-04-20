# IAA — Self-Hosting Setup Guide

How to deploy IST Africa Auth (backend + frontend + database) from scratch.

---

## Prerequisites

- **Docker & Docker Compose** (recommended) — or Node.js v20+, PostgreSQL 15+
- A **Gmail account** (or other SMTP provider) for transactional emails
- **LinkedIn OAuth credentials** (optional, for social login)

---

## 1. Clone & Configure

```bash
git clone <your-repo-url> ist-africa-auth
cd ist-africa-auth
```

### 1a. Generate RSA Keys for JWT

IAA signs tokens with RS256. Generate a key pair:

```bash
node backend/src/scripts/generate-keys.mjs
```

This prints `JWT_KEY_ID`, `JWT_PRIVATE_KEY`, and `JWT_PUBLIC_KEY` — copy them for the next step.

### 1b. Backend Environment (`backend/.env`)

Create `backend/.env` with the following:

```env
# ── Server ──
PORT=3000
NODE_ENV=development

# ── Database (PostgreSQL) ──
DB_HOST=localhost          # use "postgres" if running via docker-compose
DB_PORT=5432               # mapped to 5433 on host in docker-compose
DB_USERNAME=postgres
DB_PASSWORD=12345
DB_NAME=postgres
DB_DIALECT=postgres
DB_SYNC=true               # auto-sync models in dev — set to false in production
DB_SSL=false

# ── JWT (paste output from generate-keys.mjs) ──
JWT_KEY_ID="key-iaa-2025-01"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
JWT_ISSUER=https://auth.ist.africa
JWT_DEFAULT_AUDIENCE=ist-africa
ACCESS_TOKEN_TTL_SECONDS=3600    # 1 hour (use 120 for dev/testing)
REFRESH_TOKEN_TTL_DAYS=30

# ── Default Admin (created on first startup if no admin exists) ──
DEFAULT_ADMIN_EMAIL=admin@ist.africa
DEFAULT_ADMIN_PASSWORD=changeMe!Strong123
DEFAULT_ADMIN_NAME=IAA Admin

# ── Email / SMTP ──
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password         # use a Gmail App Password, not your login password

# ── Frontend URL (used in email links) ──
FRONTEND_URL=http://localhost:3000

# ── CORS ──
CORS_ORIGIN=http://localhost:3000   # IAA frontend origin

# ── LinkedIn OAuth (optional) ──
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_CALLBACK_URL=http://localhost:3000/auth/linkedin/callback

# ── IST Membership Detection ──
# Emails matching these domains are auto-classified as ist_member
IST_DOMAINS=ist.africa,istgroup.africa
```

### 1c. Frontend Environment (`Frontend/.env.local`)

Create `Frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003   # backend URL (or 3000 if running locally)
NEXT_PUBLIC_API_URL=http://localhost:3003
NEXT_PUBLIC_APP_URL=http://localhost:3000         # this frontend
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000
```

---

## 2. Run with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts three services:

| Service | Container Port | Host Port | Notes |
|---------|---------------|-----------|-------|
| **postgres** | 5432 | 5433 | PostgreSQL 15, data persisted in `postgres_data` volume |
| **ist-africa-backend** | 3000 | 3003 | NestJS API + widget static files |
| **ist-africa-frontend** | 3000 | 3000 | Next.js app |

> When using docker-compose, set `DB_HOST=postgres` (the service name) in `backend/.env`.

On first startup the backend will:
1. Auto-sync database tables (if `DB_SYNC=true`)
2. Create the default admin user from your env vars
3. Serve the widget JS at `/sdk/iaa-widget.js`

Verify it's running:

```bash
# Backend health
curl http://localhost:3003/api/auth/jwks

# Frontend
open http://localhost:3000
```

---

## 3. Run Without Docker (Manual)

### 3a. Start PostgreSQL

```bash
# macOS (Homebrew)
brew services start postgresql@15

# Or Docker (just the database)
docker run --name postgres-iaa \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345 \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 3b. Start the Backend

```bash
cd backend
npm install
npm run start:dev          # http://localhost:3000
```

### 3c. Start the Frontend

```bash
cd Frontend
npm install
npm run dev                # http://localhost:3000 (or 3001 if 3000 is taken)
```

> Adjust `NEXT_PUBLIC_API_BASE_URL` in `Frontend/.env.local` to match the backend port.

---

## 4. First-Time Setup Checklist

### 4a. Verify Admin Login

1. Open the frontend (`http://localhost:3000`)
2. Log in with `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD`
3. Navigate to `/admin` — you should see the admin panel

### 4b. Verify Email Delivery

1. Register a new user
2. Check that the verification email arrives
3. If using Gmail: you need a [Google App Password](https://support.google.com/accounts/answer/185833) (not your regular password)

### 4c. Verify JWKS

```bash
curl http://localhost:3003/api/auth/jwks
```

Should return a JSON object with a `keys` array containing your RSA public key.

### 4d. Register Your First Client App

1. Log in as admin → `/admin/clients`
2. Create a client (name, redirect URI, allowed origins)
3. Copy the `client_id` and `client_secret`
4. Follow [CLIENT_INTEGRATION.md](docs/CLIENT_INTEGRATION.md) to integrate

---

## 5. Production Deployment

### 5a. Security Hardening

| Setting | Dev | Production |
|---------|-----|------------|
| `DB_SYNC` | `true` | `false` — use migrations instead |
| `NODE_ENV` | `development` | `production` |
| `ACCESS_TOKEN_TTL_SECONDS` | `120` (for testing) | `3600` (1 hour) |
| `DB_PASSWORD` | simple | strong, randomly generated |
| `DEFAULT_ADMIN_PASSWORD` | simple | strong — **change after first login** |
| HTTPS | optional | **required** for all URLs |

### 5b. Reverse Proxy (Nginx)

Place both services behind Nginx with TLS:

```nginx
server {
    listen 443 ssl;
    server_name auth.ist.africa;

    ssl_certificate     /etc/ssl/certs/auth.ist.africa.pem;
    ssl_certificate_key /etc/ssl/private/auth.ist.africa.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API + Widget
    location /api/ {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /sdk/ {
        proxy_pass http://localhost:3003;
    }
}
```

### 5c. Update URLs for Production

**Backend `.env`:**
```env
FRONTEND_URL=https://auth.ist.africa
CORS_ORIGIN=https://auth.ist.africa
JWT_ISSUER=https://auth.ist.africa
LINKEDIN_CALLBACK_URL=https://auth.ist.africa/auth/linkedin/callback
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_BASE_URL=https://auth.ist.africa
NEXT_PUBLIC_APP_URL=https://auth.ist.africa
```

### 5d. Key Rotation

IAA supports key rotation via the `JWT_KEY_ID` field:

1. Generate a new key pair (`node backend/src/scripts/generate-keys.mjs`)
2. Update `JWT_KEY_ID` to a new value (e.g., `key-iaa-2025-07`)
3. Update `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`
4. Restart the backend — the JWKS endpoint will serve the new key
5. Existing tokens signed with the old key will expire naturally

Recommended rotation interval: **every 6 months**.

---

## 6. Troubleshooting

### Backend won't start — DB connection refused
- Confirm PostgreSQL is running and the host/port/credentials match your `.env`
- In docker-compose, use `DB_HOST=postgres` (service name), not `localhost`

### Emails not sending
- Gmail requires an **App Password** if 2FA is enabled
- Check `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Look at backend logs for nodemailer errors — OTP will be logged to console as fallback

### JWKS returns empty keys array
- Verify `JWT_PUBLIC_KEY` is set in `.env` and properly formatted with `\n` escapes

### Widget CORS errors on client app
- The client app's origin must be in `allowed_origins` on the registered client
- `CORS_ORIGIN` in backend `.env` only covers the IAA frontend itself

### Admin user not created
- Ensure `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` are set in `.env`
- The admin is only auto-created if **no active admin exists** in the database

### LinkedIn OAuth not working
- Confirm `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_CALLBACK_URL` are set
- The callback URL must match exactly what's configured in your LinkedIn app

---

## Quick Reference

| What | URL |
|------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:3003/api` |
| Admin panel | `http://localhost:3000/admin` |
| JWKS endpoint | `http://localhost:3003/api/auth/jwks` |
| Widget script | `http://localhost:3003/sdk/iaa-widget.js` |
| Prisma Studio (dev) | `npx prisma studio` (from `backend/`) |

---

## Related Docs

- [Client Registration Guide](CLIENT_REGISTRATION_GUIDE.md) — register apps to use IAA
- [Client Integration Guide](docs/CLIENT_INTEGRATION.md) — widget setup, token exchange, JWT verification
