# IAA — Client Registration Guide

How to register your application with IST Africa Auth and configure it for integration.

---

## 1. Create a Client Application [IAA Admin]

1. Log in to the IAA admin panel at `IAA_FRONTEND_URL/admin/clients`
2. Click **"Create Client"**
3. Fill in:

| Field | Example | Notes |
|-------|---------|-------|
| **Name** | My App | Display name shown to users during login |
| **Description** | Production web app | Internal reference |
| **Redirect URI** | `https://myapp.com/callback` | Must match **exactly** what your frontend sends (protocol, domain, path, no trailing slash) |
| **Allowed Origins** | `https://myapp.com` | Your app's origin(s) — used for CORS and iframe embedding |

4. Save. You will receive:
   - `client_id` — public, safe to embed in frontend code
   - `client_secret` — **shown once**. Copy and store it securely (e.g. in your backend's environment variables)

---

## 2. Configure Your App [Client app manager]

Set these environment variables on your **backend**:

```env
IAA_BASE_URL=https://iaa-backend
IAA_CLIENT_ID=your_client_id_here
IAA_CLIENT_SECRET=your_client_secret_here
```

Add the widget to your **frontend**:

```html
<script src="https://your-iaa-backend.com/sdk/iaa-widget.js"></script>
<script>
  new IAAAuthWidget({
    clientId: 'your_client_id_here',
    redirectUri: 'https://myapp.com/callback',
    iaaFrontendUrl: 'https://iaa-frontend-url',
  });
</script>
```

For full backend integration (token exchange, JWT verification), see **[docs/CLIENT_INTEGRATION.md](docs/CLIENT_INTEGRATION.md)**.

---

## Common Issues

### "Unauthorized client: This application is not registered"
- The `client_id` is not in the database. Ask IAA Admin to register your app via the iaa admin panel.

### "Invalid redirect URI"
- The `redirect_uri` your app sends doesn't match what's stored. They must be **identical** — including protocol, domain, port, path, and trailing slash.

### "Client application is not active"
- The client was deactivated. IAA admin should reactivate it in the admin panel.

### Widget doesn't load / CORS error
- Your app's origin must be listed in the iaa client's **Allowed Origins**.
- Example: if your app runs at `https://myapp.com`, that exact origin must be in the list.

### Lost your client secret
- Secrets cannot be recovered. Generate a new one from the admin panel and update your backend environment variables.
