# IST Africa Auth

## 🧩 Overview
The **IST Africa Auth** is a centralized authentication and authorization system used across all internal applications.  
It provides a consistent user management interface, token-based authentication, and integration with multiple clients via REST APIs and OAuth2.

## 🎯 Goals
- Provide a single source of truth for user identities.
- Standardize authentication across internal tools.
- Simplify onboarding/offboarding and permission management.
- Allow other apps to integrate easily via APIs or SDK.

## 🏗️ Architecture Overview
- **Backend:** Node.js (NestJS)
- **Database:** PostgreSQL (with Sequelize)
- **Auth:** JWT & OAuth2
- **Cache:** Redis (session tokens)
- **Deployment:** Docker + Nginx + CI/CD (GitHub Actions)

## ⚙️ Technical Documentation

# 🧾 IST Africa Auth (IAA) — Developer Guide

### Table of Contents

1. [Overview](#1-overview)
2. [Core Concepts & Domain Knowledge](#2-core-concepts--domain-knowledge)

   * [Authentication vs Authorization](#authentication-vs-authorization)
   * [OAuth 2.0 & OpenID Connect](#oauth-20--openid-connect)
   * [Tokens](#tokens)
   * [JWT & JWKS](#jwt--jwks)
   * [Audience (`aud`)](#audience-aud)
   * [Authorization Code Flow Explained](#authorization-code-flow-explained)
   * [Why Use Authorization Codes](#why-use-authorization-codes)
3. [Core Design Principles](#3-core-design-principles)
4. [Architecture Overview](#4-architecture-overview)
5. [Token Model](#5-token-model)
6. [Token Lifecycle](#6-token-lifecycle)
7. [API Structure](#7-api-structure)

   * [`/auth/login`](#authlogin)
   * [`/auth/token`](#authtoken)
   * [`/auth/refresh`](#authrefresh)
   * [`/auth/logout`](#authlogout)
   * [`/auth/jwks`](#authjwks)
   * [`/auth/userinfo`](#authuserinfo)
8. [Security Design](#8-security-design)
9. [Database Design (PostgreSQL + Sequelize)](#9-database-design-postgresql--sequelize)
10. [Client Integration Guide](#10-client-integration-guide)
11. [User Account Management](#11-user-account-management)
12. [Example Implementation Snippet (NestJS)](#12-example-implementation-snippet-nestjs)

---

## 1. Overview

**IST Africa Auth (IAA)** is a lightweight, standards-based **Identity Provider (IdP)** that manages authentication across IST Africa’s ecosystem of applications.

It enables:

* Centralized login for all IST apps.
* OAuth 2.0 + OpenID Connect (OIDC) authentication.
* JWT-based Access & Refresh tokens.
* A simple user classification model (`ist_member` vs `external_user`).
* Secure public key verification through JWKS.
* Minimal coupling with app-specific roles (apps manage roles independently).

---

## 2. Core Concepts & Domain Knowledge

### Authentication vs Authorization

| Concept            | Description                                      |
| ------------------ | ------------------------------------------------ |
| **Authentication** | Verifies *who* the user is (identity).           |
| **Authorization**  | Determines *what* the user can do (permissions). |

IAA handles **authentication**. Each application handles **authorization** (roles & permissions).

---

### OAuth 2.0 & OpenID Connect

In the OAuth ecosystem, these entities exist:

| Role                           | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| **Resource Owner**             | The user (e.g., Alice).                           |
| **Client App**                 | The app that requests access (e.g., IST Academy). |
| **Authorization Server (IAA)** | Authenticates the user and issues tokens.         |
| **Resource Server (API)**      | Validates tokens and serves protected data.       |

OpenID Connect (OIDC) extends OAuth 2.0 by adding identity information.



IAA issues two main types of tokens:

| Token             | Description                                     | Typical Lifespan |
| ----------------- | ----------------------------------------------- | ---------------- |
| **Access Token**  | Short-lived JWT for accessing APIs.             | 1 hour           |
| **Refresh Token** | Long-lived opaque token to renew access tokens. | 30 days          |

---

### JWT & JWKS

IAA uses **RSA256 (RS256)** JWT tokens with **asymmetric encryption** (private/public key pairs).

#### JWT Structure
A **JWT (JSON Web Token)** is a signed token that encodes identity claims.
It has 3 parts: Header, Payload, and Signature.

#### Encryption Method: RSA256
- **Algorithm:** RS256 (RSA Signature with SHA-256)
- **Key Type:** Asymmetric (private/public key pair)
- **Signing:** IAA uses **private key** to sign tokens
- **Verification:** Client apps use **public key** to verify signatures

#### JWKS (JSON Web Key Set)
The **JWKS endpoint** (`/auth/jwks`) exposes public keys that client apps use to verify JWT signatures.

**Example JWKS Response:**

```json
{
  "keys": [
    {
      "kty": "RSA",           // Key Type: RSA
      "use": "sig",           // Use: Signature
      "kid": "key-2025-01",   // Key ID (for rotation)
      "alg": "RS256",         // Algorithm: RSA256
      "n": "AKLweUqJ2hJ3u43oB2...",  // RSA Modulus (public key)
      "e": "AQAB"             // RSA Exponent (public key)
    }
  ]
}
```

**Key Components:**
- `kty`: Key Type (RSA)
- `use`: Key Use (signature)
- `kid`: Key ID (for key rotation)
- `alg`: Algorithm (RS256)
- `n`: RSA **modulus** (public key component)
- `e`: RSA **exponent** (public key component)

#### Security Benefits of RSA256
- **Asymmetric encryption:** Private key stays secure on IAA server
- **Public key distribution:** Client apps can verify tokens without secret keys
- **Key rotation:** IAA can rotate keys while maintaining backward compatibility
- **Industry standard:** Widely supported and secure

---

### Audience (`aud`)

The **audience** identifies which application or API the token is intended for.
Each app registers its domain as the audience (e.g., `academy.ist.africa`).

Apps must validate:

```js
token.aud === expectedAudience
```

If the audience doesn’t match, the token is rejected.

---

### Authorization Code Flow Explained

This is the **most secure** OAuth 2.0 flow and the one IAA uses.

1. **User → Client App:**
   The user clicks “Login with IST Africa”.
2. **Client → IAA:**
   App redirects the user to IAA’s `/login` endpoint with a `client_id` and `redirect_uri`.
3. **User Authenticates:**
   IAA verifies the user credentials.
4. **IAA → Client:**
   IAA sends back an **authorization code**, not tokens.
5. **Client → IAA:**
   The app backend exchanges the code for **Access** and **Refresh** tokens via `/auth/token`.
6. **Client → API:**
   The app uses the access token to call APIs.

---

### Why Use Authorization Codes

Tokens are never exposed in browser redirects or logs.
Instead, a short-lived **authorization code** is used, which the **backend** exchanges securely for tokens.

This prevents:

* Token theft from the URL or browser storage.
* Exposure of secrets in frontend code.

---

## 3. Core Design Principles

| Principle                   | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| **Decoupled Authorization** | Each app manages its own roles & permissions.            |
| **Minimal Claims**          | Tokens contain only identity, email, and classification. |
| **Stateless Validation**    | Apps validate tokens locally using JWKS.                 |
| **Security by Design**      | All tokens are RSA256-signed.                            |
| **Scalability**             | Supports multiple apps and login sources (e.g., Google). |

---

## 4. Architecture Overview

```
                   +-------------------------+
                   |     IST Africa Auth     |
                   |  (Identity Provider)    |
                   +-----------+-------------+
                               |
              +----------------+----------------+
              |                                 |
     +--------v--------+               +--------v--------+
     |  App A (HR)     |               |  App B (Academy)|
     |  Roles: admin,   |               |  Roles: teacher,|
     |  recruiter, etc. |               |  student, etc.  |
     +------------------+               +------------------+
              |                                 |
              +---------------+----------------+
                              |
                    +---------v---------+
                    |   JWKS Public Key |
                    | (used for token    |
                    |  verification)     |
                    +-------------------+
```

---

## 5. Token Model

### Access Token (JWT)

Used for API authentication.

Example Payload:

```json
{
  "iss": "https://auth.ist.africa",
  "sub": "user:73bde923",
  "email": "alice@ist.africa",
  "user_type": "ist_member",
  "aud": "academy.ist.africa",
  "iat": 1738890000,
  "exp": 1738893600
}
```

### Refresh Token

Opaque token stored in IAA’s database:

```
a9e3bca1-92e7-4c6c-9349-1a3d0289d23b
```

---

## 6. Token Lifecycle

| Step               | Description                                     |
| ------------------ | ----------------------------------------------- |
| **Login**          | User authenticates.                             |
| **Code Issued**    | IAA issues short-lived authorization code.      |
| **Token Exchange** | App exchanges code for Access + Refresh tokens. |
| **Validation**     | Apps verify JWT via `/auth/jwks`.               |
| **Refresh**        | App renews tokens when expired.                 |
| **Revoke**         | IAA invalidates refresh tokens on logout.       |

---

## 7. API Structure

### Base URL

```
https://auth.ist.africa/api
```

---

### `/auth/authenticate`

**Initiated by:** Client App
**When:** When the user clicks “Login with IST Africa”
**Why:** Starts the authentication flow and returns an authorization code.

**Request**

```json
{
  "email": "alice@ist.africa",
  "password": "********",
  "client_id": "academy-app",
  "redirect_uri": "https://academy.ist.africa/callback"
}
```

**Response**

```json
{
  "code": "xyz123",
  "redirect_uri": "https://academy.ist.africa/callback"
}
```

**Error Responses**

```json
{ "error": "invalid_credentials", "message": "Email or password incorrect" }
{ "error": "unauthorized_client", "message": "Client not registered" }
```

---

### `/auth/tokens`

**Initiated by:** Client App backend
**When:** Immediately after receiving the authorization code
**Why:** Exchanges the code for Access and Refresh tokens.

**Request**

```json
{
  "code": "xyz123",
  "client_id": "academy-app",
  "client_secret": "app-secret"
}
```

**Response**

```json
{
  "access_token": "<JWT>",
  "refresh_token": "a9e3bca1-92e7-4c6c-9349-1a3d0289d23b",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Responses**

```json
{ "error": "invalid_grant", "message": "Authorization code expired or invalid" }
{ "error": "invalid_client", "message": "Client secret mismatch" }
```

---

### `/auth/refresh`

**Initiated by:** Client App
**When:** Access token expires
**Why:** Requests a new Access Token using the Refresh Token.

**Request**

```json
{ "refresh_token": "a9e3bca1-92e7-4c6c-9349-1a3d0289d23b" }
```

**Response**

```json
{ "access_token": "<new JWT>", "expires_in": 3600 }
```

---

### `/auth/logout`

**Initiated by:** Client App or User
**When:** User logs out
**Why:** Revokes the Refresh Token.

---

### `/auth/jwks`

**Initiated by:** Apps periodically
**When:** During startup or every 12 hours
**Why:** To fetch public keys for JWT verification.

---

### `/auth/userinfo`

**Initiated by:** App backend
**When:** After login, to get user profile
**Why:** To identify the logged-in user.

**Response**

```json
{
  "sub": "user:73bde923",
  "email": "alice@ist.africa",
  "user_type": "ist_member"
}
```

---

## Client Management APIs

### `/api/clients` (POST)

**Initiated by:** System administrators
**When:** Registering a new client application
**Why:** To allow a new application to integrate with IAA.

**Request**

```json
{
  "name": "IST Academy",
  "description": "Learning management system for IST Africa",
  "redirect_uri": "https://academy.ist.africa/callback",
  "allowed_origins": ["https://academy.ist.africa"]
}
```

**Response**

```json
{
  "id": "client:abc123",
  "client_id": "academy-app",
  "client_secret": "secret_xyz789",
  "name": "IST Academy",
  "description": "Learning management system for IST Africa",
  "redirect_uri": "https://academy.ist.africa/callback",
  "allowed_origins": ["https://academy.ist.africa"],
  "created_at": "2024-01-15T10:30:00Z",
  "status": "active"
}
```

**Error Responses**

```json
{ "error": "invalid_redirect_uri", "message": "Redirect URI must be HTTPS" }
{ "error": "duplicate_client", "message": "Client with this name already exists" }
```

### `/api/clients` (GET)

**Initiated by:** System administrators
**When:** Viewing all registered clients
**Why:** To manage and monitor client applications.

**Response**

```json
{
  "clients": [
    {
      "id": "client:abc123",
      "client_id": "academy-app",
      "name": "IST Academy",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "client:def456",
      "client_id": "hr-system",
      "name": "HR Management",
      "status": "active",
      "created_at": "2024-01-10T14:20:00Z"
    }
  ],
  "total": 2
}
```

### `/api/clients/:id` (PUT)

**Initiated by:** System administrators
**When:** Updating client configuration
**Why:** To modify client settings or regenerate secrets.

**Request**

```json
{
  "name": "IST Academy Updated",
  "description": "Updated learning management system",
  "redirect_uri": "https://academy.ist.africa/callback",
  "allowed_origins": ["https://academy.ist.africa", "https://app.academy.ist.africa"],
  "status": "active"
}
```

**Response**

```json
{
  "id": "client:abc123",
  "client_id": "academy-app",
  "client_secret": "secret_xyz789",
  "name": "IST Academy Updated",
  "description": "Updated learning management system",
  "redirect_uri": "https://academy.ist.africa/callback",
  "allowed_origins": ["https://academy.ist.africa", "https://app.academy.ist.africa"],
  "status": "active",
  "updated_at": "2024-01-20T09:15:00Z"
}
```

### `/api/clients/:id/regenerate-secret` (POST)

**Initiated by:** System administrators
**When:** Client secret is compromised
**Why:** To generate a new client secret for security.

**Response**

```json
{
  "id": "client:abc123",
  "client_id": "academy-app",
  "client_secret": "new_secret_abc123",
  "secret_generated_at": "2024-01-20T09:15:00Z"
}
```

### `/api/clients/:id` (DELETE)

**Initiated by:** System administrators
**When:** Deactivating a client application
**Why:** To revoke access for a client application.

**Response**

```json
{
  "message": "Client application deactivated successfully",
  "deactivated_at": "2024-01-20T09:15:00Z"
}
```

---

## 8. Security Design

| Aspect                 | Description                      |
| ---------------------- | -------------------------------- |
| Encryption             | RSA256 asymmetric keys           |
| Key Rotation           | Every 6 months                   |
| HTTPS                  | Required                         |
| Access Token TTL       | 1 hour                           |
| Refresh Token TTL      | 30 days                          |
| CORS                   | Only whitelisted clients         |
| Brute Force Protection | 5 failed logins → 10-min lockout |

---

## 9. Database Design (PostgreSQL + Sequelize)

### Tables

| Table       | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| **users**   | Stores user credentials and classification.                |
| **clients** | Registered applications (client_id, secret, redirect_uri). |
| **tokens**  | Stores issued refresh tokens.                              |
| **keys**    | Tracks RSA key pairs (for rotation).                       |

### Example Sequelize Models

**User**

```js
User.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  user_type: DataTypes.ENUM('ist_member', 'external_user')
}, { sequelize, modelName: 'user' });
```

**Client**

```js
Client.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
  client_id: DataTypes.STRING,
  client_secret: DataTypes.STRING,
  redirect_uri: DataTypes.STRING
}, { sequelize, modelName: 'client' });
```

**Token**

```js
Token.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: UUIDV4 },
  refresh_token: DataTypes.STRING,
  user_id: DataTypes.UUID,
  client_id: DataTypes.UUID,
  revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'token' });
```

---

## 10. Client Integration Guide

### Floating Authentication Widget

The IAA system provides a **floating authentication widget** that can be easily integrated into any client application. This widget appears only when users are not authenticated and disappears once they successfully log in.

#### Widget Behavior

**Unauthenticated State:**
- Shows "Login with IAA" button in top-right corner
- Floating/fixed position, non-intrusive
- Only visible when user needs to authenticate

**Authenticated State:**
- Widget completely disappears
- User can access protected content
- Session managed via JWT tokens

#### Integration Steps

1. **Include the Widget Script**
   ```html
   <!-- Add to your client app's HTML -->
   <script src="https://auth.ist.africa/widget/iaa-widget.js"></script>
   <script>
     // Initialize with your app configuration
     new IAAAuthWidget({
       clientId: 'your-app-id',
       redirectUri: 'https://yourapp.com/callback'
     });
   </script>
   ```

2. **Widget CSS Styling**
   ```css
   #iaa-auth-widget {
     position: fixed;
     top: 20px;
     right: 20px;
     z-index: 9999;
   }

   .iaa-widget-btn {
     background: #007bff;
     color: white;
     border: none;
     padding: 12px 20px;
     border-radius: 6px;
     cursor: pointer;
     font-size: 14px;
     font-weight: 500;
     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
     transition: all 0.2s ease;
   }

   .iaa-widget-btn:hover {
     background: #0056b3;
     transform: translateY(-1px);
     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
   }
   ```

3. **Widget JavaScript Implementation**
   ```javascript
   class IAAAuthWidget {
     constructor(config) {
       this.clientId = config.clientId;
       this.redirectUri = config.redirectUri;
       this.baseUrl = 'https://auth.ist.africa/api';
       this.isAuthenticated = false;
       this.init();
     }

     init() {
       this.checkAuthStatus();
       this.createWidget();
     }

     checkAuthStatus() {
       // Check if user has valid JWT token
       const token = localStorage.getItem('iaa_access_token');
       if (token && !this.isTokenExpired(token)) {
         this.isAuthenticated = true;
       }
     }

     createWidget() {
       if (this.isAuthenticated) {
         this.hideWidget();
         return;
       }

       const widget = document.createElement('div');
       widget.id = 'iaa-auth-widget';
       widget.innerHTML = `
         <button id="iaa-login-btn" class="iaa-widget-btn">
           Login with IAA
         </button>
       `;
       
       document.body.appendChild(widget);
       this.attachEventListeners();
     }

     attachEventListeners() {
       document.getElementById('iaa-login-btn').addEventListener('click', () => {
         this.initiateLogin();
       });
     }

     initiateLogin() {
       const state = this.generateRandomState();
       const params = new URLSearchParams({
         client_id: this.clientId,
         redirect_uri: this.redirectUri,
         state: state
       });
       
       window.location.href = `${this.baseUrl}/auth/login?${params}`;
     }

     hideWidget() {
       const widget = document.getElementById('iaa-auth-widget');
       if (widget) {
         widget.style.display = 'none';
       }
     }

     isTokenExpired(token) {
       try {
         const payload = JSON.parse(atob(token.split('.')[1]));
         return Date.now() >= payload.exp * 1000;
       } catch {
         return true;
       }
     }

     generateRandomState() {
       return Math.random().toString(36).substring(2, 15);
     }
   }
   ```

#### Authentication Flow with Widget

1. **User visits client app** → Widget appears (if not authenticated)
2. **User clicks "Login with IAA"** → Redirects to IAA authentication
3. **User authenticates** → IAA redirects back with authorization code
4. **Client app exchanges code** → Gets access and refresh tokens
5. **Widget detects authentication** → Automatically hides itself
6. **User accesses protected content** → No widget visible

#### Configuration Options

```javascript
new IAAAuthWidget({
  clientId: 'your-app-id',           // Required: Your registered client ID
  redirectUri: 'https://yourapp.com/callback', // Required: Your callback URL
  position: 'top-right',             // Optional: Widget position (default: top-right)
  theme: 'light',                    // Optional: Widget theme (light/dark)
  autoHide: true                     // Optional: Auto-hide when authenticated (default: true)
});
```

### Security Considerations

- Widget automatically validates JWT tokens
- Implements CSRF protection with state parameter
- Tokens are stored securely in localStorage
- Automatic token expiration checking
- No sensitive data exposed in frontend code

## 11. User Account Management

The IAA system provides a **User Dashboard** where authenticated users can manage their account settings and password.

#### User Dashboard Access

**URL:** `https://auth.ist.africa/dashboard`

Users can access their dashboard by:
1. **Direct URL access** - Users can bookmark and visit the dashboard directly
2. **Client app links** - Client applications can provide links to the IAA dashboard
3. **Email notifications** - Dashboard links in account-related emails

#### Dashboard Features

**Profile Information:**
- Email address
- User type (ist_member vs external_user)
- Account creation date
- Last login information

**Password Management:**
- **Change Password** - For users who know their current password
- **Reset Password** - For users who have forgotten their password

**Active Sessions:**
- View all active login sessions
- See which applications are currently logged in
- Revoke individual sessions
- Security monitoring

**Security Settings:**
- Two-factor authentication (future feature)
- Login history
- Security alerts

#### Password Management Options

**1. Change Password (Logged-in Users)**
```
┌─────────────────────────────────────┐
│  Change Password                    │
│                                     │
│  Current Password: [____________]   │
│  New Password: [____________]       │
│  Confirm Password: [____________]   │
│                                     │
│  [Change Password]                  │
└─────────────────────────────────────┘
```

**Flow:**
1. User enters current password
2. User enters new password (twice for confirmation)
3. IAA validates current password
4. Password is updated immediately
5. User remains logged in

**2. Reset Password (Forgot Password)**
```
┌─────────────────────────────────────┐
│  Reset Password                     │
│                                     │
│  Email: [____________]              │
│                                     │
│  [Send Reset Email]                 │
│                                     │
│  A reset link will be sent to your  │
│  email address.                     │
└─────────────────────────────────────┘
```

**Flow:**
1. User enters email address
2. IAA sends reset email with secure link
3. User clicks link in email
4. User sets new password on IAA reset page
5. User is redirected to login page

#### Client App Integration

**Simple Integration (Option 1):**
Client applications can provide direct links to IAA functionality:

```html
<!-- Client app can include these links -->
<a href="https://auth.ist.africa/dashboard">Manage Account</a>
<a href="https://auth.ist.africa/login?forgot=true">Forgot Password?</a>
```

**Benefits:**
- No complex API integration required
- Users get full IAA functionality
- Consistent user experience across all apps
- IAA handles all security and validation

---

## 🔐 Authorization Code Flow (IST Africa Auth)

```text
User (browser)
   |
   | 1) Click "Login with IST Africa"
   v
Client App (Frontend) -------------------------
   |                                          |
   | 2) Redirect (GET) to IAA /login          |
   |    (client_id + redirect_uri + state)    |
   v                                          |
IAA (Auth Server)                              |
   |                                          |
   | 3) User authenticates (email/password / federated)
   |                                          |
   | 4) IAA issues short-lived AUTHORIZATION CODE
   |    and redirects browser to redirect_uri:
   |    https://app/callback?code=AUTH_CODE
   v                                          |
Client App (Frontend) -------------------------
   |
   | 5) Forward code to Client Backend (server)
   v
Client Backend ------------------------------> IAA /auth/token
   | 6) POST { code, client_id, client_secret }
   |                                          |
   | 7) IAA validates code, client, redirect_uri
   |    then issues:
   |    - access_token (JWT, RS256)
   |    - refresh_token (opaque UUID)
   v                                          |
Client Backend <------------------------------
   |
   | 8) Client stores refresh token securely (server-side)
   |    Uses access_token to call Resource API:
   v
Resource Server / API
   | 9) API verifies JWT signature & claims:
   |    - retrieve matching JWKS key by `kid` (cached)
   |    - check `iss`, `aud`, `exp`, `sub`
   v
Protected Resource returned to Client

-- Refresh flow (when access_token expires) --
Client Backend --> IAA /auth/refresh { refresh_token }
   IAA validates and returns new access_token (and optionally refresh_token)

-- Logout / Revoke --
Client Backend --> IAA /auth/logout { refresh_token }
   IAA revokes refresh_token (invalidates sessions)

-- JWKS & Key Rotation --
IAA publishes /auth/jwks (n, e, kid).
Clients cache JWKS (e.g., refresh every 12h).
IAA rotates signing keys periodically (e.g., every 6 months) and exposes new `kid`.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
