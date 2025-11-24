# Client Registration Guide for IAA Backend

## Problem
Your client app with `client_id: c30b03b35a608c161d041bacf4771bf3` is being detected but the request is likely failing because:
1. The client is not registered in the database, OR
2. The `redirect_uri` doesn't match what's stored in the database

## Solution: Register Your Client

### Option 1: Using the Admin API (Recommended)

If you have admin access, use the admin interface or API to register your client:

**Endpoint:** `POST /api/clients`

**Request Body:**
```json
{
  "name": "Your Client App Name",
  "description": "Description of your client application",
  "redirect_uri": "https://your-client-app.com/callback",
  "allowed_origins": ["https://your-client-app.com"]
}
```

**Response:**
```json
{
  "id": "client:...",
  "client_id": "c30b03b35a608c161d041bacf4771bf3",
  "client_secret": "YOUR_CLIENT_SECRET_HERE",
  "name": "Your Client App Name",
  "description": "Description of your client application",
  "redirect_uri": "https://your-client-app.com/callback",
  "allowed_origins": ["https://your-client-app.com"],
  "status": "active"
}
```

**Important:** Save the `client_secret` immediately - it's only shown once!

### Option 2: Using SQL (Direct Database)

If you need to register directly in the database:

```sql
-- First, generate a client secret hash (you'll need to hash it with bcrypt)
-- For testing, you can use a tool or the backend to generate the hash

INSERT INTO clients (
  id,
  client_id,
  client_secret,
  name,
  description,
  redirect_uri,
  allowed_origins,
  status,
  created_at
) VALUES (
  'client:' || gen_random_uuid()::text,
  'c30b03b35a608c161d041bacf4771bf3',
  '$2a$12$YOUR_BCRYPT_HASHED_SECRET_HERE',  -- Must be bcrypt hashed
  'Your Client App Name',
  'Description of your client application',
  'https://your-client-app.com/callback',  -- Must match exactly what your app sends
  ARRAY['https://your-client-app.com'],
  'active',
  NOW()
);
```

**Note:** The `client_secret` must be bcrypt hashed. You can use the backend's client creation endpoint to generate it properly.

### Option 3: Update Existing Client

If the client already exists but the `redirect_uri` is wrong:

```sql
UPDATE clients
SET redirect_uri = 'https://your-client-app.com/callback'
WHERE client_id = 'c30b03b35a608c161d041bacf4771bf3';
```

## Verify Your Client Registration

Check if your client is registered:

```sql
SELECT 
  id,
  client_id,
  name,
  redirect_uri,
  allowed_origins,
  status,
  created_at
FROM clients
WHERE client_id = 'c30b03b35a608c161d041bacf4771bf3';
```

## Common Issues

### 1. Client Not Found
**Error:** `Unauthorized client: This application is not registered.`

**Solution:** Register the client using one of the methods above.

### 2. Redirect URI Mismatch
**Error:** `Invalid redirect URI: The provided redirect URI does not match...`

**Solution:** 
- Check what `redirect_uri` your client app is sending
- Update the database to match exactly (including protocol, domain, path, trailing slashes)
- Example: `https://app.com/callback` ≠ `https://app.com/callback/` (trailing slash matters)

### 3. Client Not Active
**Error:** `Client application is not active.`

**Solution:**
```sql
UPDATE clients
SET status = 'active'
WHERE client_id = 'c30b03b35a608c161d041bacf4771bf3';
```

## Testing the Flow

1. **Send authentication request:**
```bash
POST /api/auth/authenticate
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "client_id": "c30b03b35a608c161d041bacf4771bf3",
  "redirect_uri": "https://your-client-app.com/callback",
  "state": "optional-state-value"
}
```

2. **Expected response:**
```json
{
  "redirect_uri": "http://localhost:3000/auth/callback?code=AUTHORIZATION_CODE&state=optional-state-value"
}
```

3. **Exchange code for tokens:**
```bash
POST /api/auth/tokens?code=AUTHORIZATION_CODE
Content-Type: application/json

{
  "client_id": "c30b03b35a608c161d041bacf4771bf3",
  "client_secret": "YOUR_CLIENT_SECRET"
}
```

## Debugging

Check the backend logs for detailed information:
- Client lookup results
- Redirect URI comparisons
- Client status checks

The improved logging will show:
- `[AuthService] Detected OAuth2 Authorization Code flow for client: ...`
- `[AuthService] Redirect URI provided: ...`
- `[AuthService] Client found: ...`
- `[AuthService] Registered redirect URI: ...`
- Any error messages with specific details

