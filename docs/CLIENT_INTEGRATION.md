# IAA — Client Integration Guide

Three steps: load the widget on your frontend, add one exchange endpoint on your backend, verify JWTs.

---

## Step 1 — Register Your App

Go to the IAA admin panel (`/admin/clients`) and create a new client application. You will receive:

| Field | Description |
|-------|-------------|
| `client_id` | Public identifier for your app |
| `client_secret` | Private key for server-side token exchange — **shown once, save it** |

You will also configure:
- **Redirect URI** — e.g. `https://yourapp.com/callback` (where the widget sends the auth code)
- **Allowed Origins** — your app's origin(s) for CORS and iframe embedding

---

## Step 2 — Frontend: Add the Widget

The IAA widget is a single JS file served from the IAA backend. Add it to any page:

```html
<script src="https://IAA_BACKEND_URL/sdk/iaa-widget.js"></script>
<script>
  new IAAAuthWidget({
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'https://yourapp.com/callback',
    iaaFrontendUrl: 'https://IAA_FRONTEND_URL',
    backendUrl: 'https://yourapp.com',  // your app's backend (optional — defaults to redirectUri origin)
  });
</script>
```

**What it does:** renders a "Login with IAA" button. When clicked, it opens a modal with the IAA login page (email/password or LinkedIn). After login, the widget automatically exchanges the auth code via your backend and stores tokens in `localStorage`.

### Widget API

Once loaded, a global `iaa` object is available:

```js
// Get a valid access token (auto-refreshes if expired) — use this before every API call
const token = await iaa.getValidToken();

// Get basic user info decoded from the JWT (sync, no network call)
const user = iaa.getUser();   // { sub, email, name }

// Check if user is logged in
iaa.isAuthenticated();         // boolean

// Logout (clears tokens, revokes session on IAA server)
await iaa.logout();            // single device
await iaa.logout('all');       // all devices

// Listen for auth state changes (login/logout, including cross-tab)
window.addEventListener('iaa-auth-change', (e) => {
  console.log(e.detail.isAuthenticated, e.detail.token);
});
```

> **Important:** Always use `iaa.getValidToken()` instead of reading `localStorage` directly — it handles token refresh automatically.

For full profile data (picture, user_type, etc.), call the userinfo endpoint:
```js
const res = await fetch('https://IAA_BACKEND_URL/api/auth/userinfo', {
  headers: { Authorization: `Bearer ${await iaa.getValidToken()}` }
});
const profile = await res.json();
```

---

## Step 3 — Backend: Token Exchange Endpoint

The widget sends the authorization code to **your** backend, which exchanges it for tokens using your client secret. This keeps the secret server-side.

**Flow:** Widget → `POST /api/auth/exchange` (your backend) → `POST IAA_BACKEND/api/auth/tokens?code=...` → tokens returned to widget.

### Environment Variables

```env
IAA_BASE_URL=https://IAA_BACKEND_URL
IAA_CLIENT_ID=your_client_id
IAA_CLIENT_SECRET=your_client_secret
```

### Node.js / Express

```js
app.post('/api/auth/exchange', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Missing authorization code' });

  try {
    const response = await fetch(
      `${process.env.IAA_BASE_URL}/api/auth/tokens?code=${encodeURIComponent(code)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.IAA_CLIENT_ID,
          client_secret: process.env.IAA_CLIENT_SECRET,
        }),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('IAA token exchange failed:', err);
    res.status(502).json({ message: 'Token exchange failed' });
  }
});
```

### Spring Boot

```java
@RestController
public class AuthController {

    @Value("${iaa.base-url}") private String iaaBaseUrl;
    @Value("${iaa.client-id}") private String clientId;
    @Value("${iaa.client-secret}") private String clientSecret;

    @PostMapping("/api/auth/exchange")
    public ResponseEntity<?> exchange(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) return ResponseEntity.badRequest().body(Map.of("message", "Missing code"));

        return WebClient.create()
            .post()
            .uri(iaaBaseUrl + "/api/auth/tokens?code=" + URLEncoder.encode(code, StandardCharsets.UTF_8))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of("client_id", clientId, "client_secret", clientSecret))
            .retrieve()
            .toEntity(String.class)
            .block();
    }
}
```

### Python / Flask

```python
@app.route('/api/auth/exchange', methods=['POST'])
def exchange():
    code = request.json.get('code')
    if not code:
        return jsonify(message='Missing authorization code'), 400

    resp = requests.post(
        f"{os.environ['IAA_BASE_URL']}/api/auth/tokens",
        params={'code': code},
        json={
            'client_id': os.environ['IAA_CLIENT_ID'],
            'client_secret': os.environ['IAA_CLIENT_SECRET'],
        }
    )
    return jsonify(resp.json()), resp.status_code
```

---

## Step 4 — Backend: Verify JWTs on Protected Routes

IAA tokens are RS256-signed JWTs. Verify them against IAA's public keys:

**JWKS endpoint:** `GET IAA_BASE_URL/api/auth/jwks`

### Node.js / Express

```bash
npm install jsonwebtoken jwks-rsa
```

```js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `${process.env.IAA_BASE_URL}/api/auth/jwks`,
  cache: true,
  rateLimit: true,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(err, key?.getPublicKey());
  });
}

function verifyToken(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded; // { sub, email, name, role, ... }
    next();
  });
}

// Usage
app.get('/api/me', verifyToken, (req, res) => res.json(req.user));
```

### Spring Boot

```bash
# Add dependency: spring-boot-starter-oauth2-resource-server
```

```properties
# application.properties
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=${IAA_BASE_URL}/api/auth/jwks
```

Spring auto-validates tokens on protected endpoints. Access claims via:

```java
@GetMapping("/api/me")
public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
    return jwt.getClaims(); // { sub, email, name, role, ... }
}
```

### Python / Flask

```bash
pip install PyJWT cryptography requests
```

```python
import jwt
from jwt import PyJWKClient

jwks_client = PyJWKClient(f"{os.environ['IAA_BASE_URL']}/api/auth/jwks")

def verify_token(token):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(token, signing_key.key, algorithms=['RS256'])

# Usage in a route
@app.route('/api/me')
def me():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    try:
        user = verify_token(token)
        return jsonify(user)
    except jwt.InvalidTokenError:
        return jsonify(message='Invalid token'), 401
```

---

## Quick Reference

| What | URL |
|------|-----|
| Widget script | `GET IAA_BACKEND_URL/sdk/iaa-widget.js` |
| Token exchange | `POST IAA_BACKEND_URL/api/auth/tokens?code=AUTH_CODE` |
| JWKS (public keys) | `GET IAA_BACKEND_URL/api/auth/jwks` |
| User info | `GET IAA_BACKEND_URL/api/auth/userinfo` (Bearer token) |
| Token refresh | `POST IAA_BACKEND_URL/api/auth/refresh` |
| Introspect token | `POST IAA_BACKEND_URL/api/auth/introspect` |

---

**Total client work:** 1 script tag + 1 exchange endpoint + 1 JWT middleware.
