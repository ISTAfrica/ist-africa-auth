# IST Africa Auth (IAA) — Client Integration Guide

## Overview

This guide explains how to integrate IAA authentication into your application. The integration has two parts:

1. **Frontend** — Include the IAA widget script (works with any framework)
2. **Backend** — Add one endpoint to exchange authorization codes for tokens

## Prerequisites

- Register your application as a client in the IAA admin panel (`/admin/clients`)
- You will receive a `client_id` and `client_secret`
- Save the `client_secret` securely — it is shown only once

## Frontend Integration (Any Framework)

Add the IAA widget script before the closing `</body>` tag:

```html
<script src="IAA_BACKEND_URL/sdk/iaa-widget.js"></script>
<script>
  new IAAAuthWidget({
    clientId: 'YOUR_CLIENT_ID',
    redirectUri: 'http://YOUR_APP/callback',
    iaaFrontendUrl: 'IAA_FRONTEND_URL',
    backendUrl: 'http://YOUR_BACKEND',       // optional if same origin as frontend
  });
</script>
```

### Widget Config

| Param | Required | Description |
|-------|----------|-------------|
| `clientId` | Yes | Your registered client ID |
| `redirectUri` | Yes | Your frontend callback URL (e.g., `http://localhost:4001/callback`) |
| `iaaFrontendUrl` | Yes | Official IAA frontend URL |
| `backendUrl` | No | Your app's backend URL. Only needed if different from frontend origin |

### Widget API

After initialization, the SDK exposes global helpers:

```js
iaa.getValidToken()     // (async) Returns a valid token — auto-refreshes if expired
iaa.getToken()          // (sync) Returns current token or null — does NOT refresh
iaa.getUser()           // (sync) Returns { sub, email, name } from the token
iaa.refreshToken()      // (async) Forces a token refresh, returns new token or null
iaa.isAuthenticated()   // Returns true/false
iaa.logout()            // Clears tokens, shows login button
```

### Getting User Info

**Basic info** (no API call — decoded from the token):

```js
const user = iaa.getUser();
// { sub: "2", email: "denis@ist.africa", name: "Denis Niwemugisha" }
```

**Full profile** (API call to IAA — includes picture, user_type):

```js
const token = await iaa.getValidToken();
const res = await fetch('IAA_BACKEND_URL/api/auth/userinfo', {
  headers: { Authorization: 'Bearer ' + token }
});
const profile = await res.json();
// { sub: "2", email: "...", name: "...", picture: "...", user_type: "ist_member", created_at: "..." }
```

### Logout

Logout is the client app's responsibility — build your own logout button and call `iaa.logout()`:

```js
// Logout from this device
await iaa.logout();

// Logout from all devices
await iaa.logout('all');
```

`iaa.logout()` automatically invalidates the token on IAA's server (even if expired — it refreshes first), then clears local state and re-shows the login button.

### Auth Change Event

Listen for authentication state changes:

```js
window.addEventListener('iaa-auth-change', function(e) {
  console.log('Authenticated:', e.detail.isAuthenticated);
  console.log('Token:', e.detail.token);
});
```

### Sending Authenticated Requests

**Important:** Always use `iaa.getValidToken()` to get the token before API calls. Do NOT read directly from `localStorage` — `getValidToken()` automatically refreshes the token if it has expired.

```js
// Correct — auto-refreshes if expired
const token = await iaa.getValidToken();
fetch('/api/resource', {
  headers: { Authorization: 'Bearer ' + token }
});
```

```js
// Wrong — will fail after token expires
fetch('/api/resource', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('iaa_access_token') }
});
```

---

## Backend Integration — Node.js (Express)

### 1. Install Dependencies

```bash
npm install jsonwebtoken jwks-rsa
```

### 2. Environment Variables

```env
IAA_BASE_URL=https://YOUR_IAA_BACKEND
IAA_CLIENT_ID=your_client_id
IAA_CLIENT_SECRET=your_client_secret
```

### 3. Add Code Exchange Endpoint

This is the only IAA-specific endpoint your backend needs. The widget calls it to exchange the authorization code for tokens.

```js
app.post('/api/auth/exchange', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code is required' });

  try {
    const response = await fetch(
      `${process.env.IAA_BASE_URL}/api/auth/tokens?code=${code}`,
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
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Token exchange failed' });
  }
});
```

### 4. JWT Verification Middleware

Protects your API routes by verifying tokens against IAA's public key (JWKS).

```js
const jwt = require('jsonwebtoken');
const jwks = require('jwks-rsa')({
  jwksUri: process.env.IAA_BASE_URL + '/api/auth/jwks',
  cache: true,
});

function verifyToken(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(
    token,
    function (header, cb) {
      jwks.getSigningKey(header.kid, function (err, key) {
        cb(err, key ? key.getPublicKey() : null);
      });
    },
    { algorithms: ['RS256'] },
    function (err, decoded) {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      req.user = decoded;
      next();
    }
  );
}
```

### 5. Protect Routes

```js
// Public route
app.get('/api/books', async (req, res) => { ... });

// Protected route
app.post('/api/books', verifyToken, async (req, res) => { ... });

// Access user info in protected routes
app.get('/api/me', verifyToken, (req, res) => {
  res.json({
    userId: req.user.sub,
    email: req.user.email,
    role: req.user.role,
  });
});
```

---

## Backend Integration — Spring Boot

### 1. Add Dependencies

**Maven (`pom.xml`):**

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webflux</artifactId>
</dependency>
```

**Gradle (`build.gradle`):**

```groovy
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

### 2. Environment Variables

```properties
# application.properties or application.yml
iaa.base-url=https://YOUR_IAA_BACKEND
iaa.client-id=your_client_id
iaa.client-secret=your_client_secret

spring.security.oauth2.resourceserver.jwt.jwk-set-uri=${iaa.base-url}/api/auth/jwks
```

### 3. Security Config

Spring automatically verifies JWTs using the JWKS endpoint:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/books").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(Customizer.withDefaults())
            );

        return http.build();
    }
}
```

### 4. Add Code Exchange Endpoint

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${iaa.base-url}")
    private String iaaBaseUrl;

    @Value("${iaa.client-id}")
    private String clientId;

    @Value("${iaa.client-secret}")
    private String clientSecret;

    private final WebClient webClient = WebClient.create();

    @PostMapping("/exchange")
    public Mono<ResponseEntity<String>> exchange(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) {
            return Mono.just(ResponseEntity.badRequest().body("{\"message\":\"Code is required\"}"));
        }

        return webClient.post()
            .uri(iaaBaseUrl + "/api/auth/tokens?code=" + code)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(Map.of(
                "client_id", clientId,
                "client_secret", clientSecret
            ))
            .retrieve()
            .toEntity(String.class);
    }
}
```

### 5. Access User Info in Controllers

Spring automatically parses the JWT. Access claims via `@AuthenticationPrincipal`:

```java
@GetMapping("/api/me")
public Map<String, Object> me(@AuthenticationPrincipal Jwt jwt) {
    return Map.of(
        "userId", jwt.getSubject(),
        "email", jwt.getClaimAsString("email"),
        "role", jwt.getClaimAsString("role")
    );
}
```

---

## Summary

| Step | What | Where |
|------|------|-------|
| 1 | Register client in IAA admin | IAA admin panel |
| 2 | Add widget script to HTML | Client frontend |
| 3 | Add 3 env variables | Client backend |
| 4 | Add `/api/auth/exchange` endpoint | Client backend |
| 5 | Add JWT verification middleware | Client backend |
| 6 | Protect routes | Client backend |

**Total client code changes:**
- Frontend: 1 script tag + config
- Backend: 1 endpoint + 1 middleware + 3 env variables
