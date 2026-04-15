# IAA — Client Integration

Two steps: drop a script in your frontend, add one endpoint in your backend.

## 1. Register Your App

In the IAA admin panel (`/admin/clients`), register your app to get a `client_id` and `client_secret`. The secret is shown **once** — save it.

## 2. Frontend (any framework)

```html
<script src="IAA_BACKEND_URL/sdk/iaa-widget.js"></script>
<script>
  new IAAAuthWidget({
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'http://YOUR_APP/callback',
    iaaFrontendUrl: 'IAA_FRONTEND_URL',
    backendUrl: 'http://IAA_BACKEND', // optional, only if different origin
  });
</script>
```

The widget renders a login button, handles the OAuth flow, and stores tokens. It exposes a global `iaa` object:

```js
await iaa.getValidToken()   // token string, auto-refreshes if expired — USE THIS for API calls
iaa.getUser()               // { sub, email, name } from JWT (sync)
iaa.isAuthenticated()       // boolean
await iaa.logout()          // logout this device. Pass 'all' for all devices.

window.addEventListener('iaa-auth-change', (e) => { /* e.detail.isAuthenticated, e.detail.token */ });
```

For full profile (picture, user_type), call `GET IAA_BACKEND_URL/api/auth/userinfo` with `Authorization: Bearer <token>`.

> **Don't** read `localStorage` directly — always use `iaa.getValidToken()` so expired tokens auto-refresh.

## 3. Backend — Code Exchange Endpoint

The widget POSTs the auth code to your backend; your backend swaps it for tokens using your client secret. This is the only IAA-specific endpoint you need.

**Env vars:**
```env
IAA_BASE_URL=https://IAA_BACKEND
IAA_CLIENT_ID=...
IAA_CLIENT_SECRET=...
```

**Node.js (Express):**
```js
app.post('/api/auth/exchange', async (req, res) => {
  const r = await fetch(`${process.env.IAA_BASE_URL}/api/auth/tokens?code=${req.body.code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.IAA_CLIENT_ID,
      client_secret: process.env.IAA_CLIENT_SECRET,
    }),
  });
  res.status(r.status).json(await r.json());
});
```

**Spring Boot:**
```java
@PostMapping("/api/auth/exchange")
public Mono<ResponseEntity<String>> exchange(@RequestBody Map<String, String> body) {
  return WebClient.create().post()
    .uri(iaaBaseUrl + "/api/auth/tokens?code=" + body.get("code"))
    .bodyValue(Map.of("client_id", clientId, "client_secret", clientSecret))
    .retrieve().toEntity(String.class);
}
```

## 4. Backend — Verify JWTs on Protected Routes

Verify tokens against IAA's JWKS endpoint: `IAA_BASE_URL/api/auth/jwks` (RS256).

**Node.js:**
```js
const jwt = require('jsonwebtoken');
const jwks = require('jwks-rsa')({ jwksUri: process.env.IAA_BASE_URL + '/api/auth/jwks', cache: true });

const verifyToken = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  jwt.verify(token,
    (h, cb) => jwks.getSigningKey(h.kid, (e, k) => cb(e, k?.getPublicKey())),
    { algorithms: ['RS256'] },
    (err, decoded) => err ? res.status(401).json({ message: 'Invalid token' }) : (req.user = decoded, next())
  );
};

app.get('/api/me', verifyToken, (req, res) => res.json(req.user)); // { sub, email, role, ... }
```

**Spring Boot:** add `spring-boot-starter-oauth2-resource-server` and one property:
```properties
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=${iaa.base-url}/api/auth/jwks
```
Then access claims via `@AuthenticationPrincipal Jwt jwt` in any controller.

**Other languages:** any standard JWT library that supports JWKS + RS256 will work.

---

That's it. Total client work: 1 script tag, 1 exchange endpoint, 1 JWT-verify middleware.
