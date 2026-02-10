# IST Africa Auth (IAA) - User & Integration Guide

Welcome to the IST Africa Auth (IAA) documentation. This guide helps end-users manage their accounts and developers integrate their applications with the IAA identity provider.

---

## For End Users

### 1. Creating an Account (Sign Up)
1.  Navigate to the **Sign Up** page (e.g., `/auth/signup`).
2.  Enter your **Full Name**, **Email Address**, and a **Strong Password**.
3.  Click **Create Account**.
4.  **Verify Your Email:**
    -   Check your inbox for a verification email containing a 6-digit **OTP** (One-Time Password) or a verification link.
    -   Enter the OTP on the verification page or click the link.
    -   *Note: If you don't receive an email, check your spam folder.*

### 2. Logging In
1.  Go to the **Login** page (`/auth/login`).
2.  Enter your registered **Email** and **Password**.
3.  Click **Sign In**.
4.  **LinkedIn Login:** You can also click **"Continue with LinkedIn"** to sign in using your LinkedIn account.

### 3. Forgot Password?
1.  On the Login page, click the **"Forgot Password?"** link.
2.  Enter your email address and submit.
3.  Check your email for a **Password Reset Link**.
4.  Click the link to set a new password.

### 4. User Dashboard
After logging in, you can access your **Dashboard** (`/user/profile`) to:
-   View your profile details.
-   Update your profile information.
-   Change your password.
-   View active login sessions.

---

##  For Developers (Integration)

IAA acts as a centralized Identity Provider (IDP) allowing other applications ("Clients") to authenticate users via OAuth2.

### 1. Registering Your Client Application
To use IAA for authentication, your app must be registered.

**Required Information:**
-   **App Name:** The name users will see.
-   **Redirect URI:** The URL where IAA will send the user back after login (e.g., `https://your-app.com/callback`).
-   **Allowed Origins:** Your app's domain (CORS).

**How to Register:**
-   **Admin Dashboard:** Log in as an Admin and go to `/admin/clients`, then click **"Create Client"**.
-   **API:** Send a `POST` request to `/api/clients` (requires admin token).

**Credentials:**
Upon registration, you will receive:
-   `client_id`: Public identifier for your app.
-   `client_secret`: Private key (Keep this safe! It is only shown once).

### 2. Authentication Flow (OAuth2 Authorization Code)
1.  **Redirect User to IAA:**
    Construct a URL to send the user to the IAA login page:
    ```
    GET /api/auth/authenticate?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&state=RANDOM_STRING
    ```
2.  **User Logs In:** The user authenticates on IAA.
3.  **Callback:** IAA redirects the user back to your `redirect_uri` with a temporary code:
    ```
    https://your-app.com/callback?code=AUTHORIZATION_CODE&state=RANDOM_STRING
    ```
4.  **Exchange Code for Token:**
    Your backend sends a POST request to IAA to get the access token:
    ```http
    POST /app/auth/exchange-code
    Content-Type: application/json

    {
      "code": "AUTHORIZATION_CODE",
      "client_id": "YOUR_CLIENT_ID",
      "client_secret": "YOUR_CLIENT_SECRET"
    }
    ```
5.  **Receive Token:** The response contains an `access_token` (JWT) identifying the user.

---

## For Administrators

### Admin Dashboard
Access the Admin panel at `/admin` (requires Admin role). Features include:
-   **User Management:** View, search, and ban/unban users.
-   **Client Management:** Specific view for managing registered apps.
-   **System Health:** Monitor database and API status.
-   **Security:** View logs of failed login attempts and active sessions.

### Troubleshooting
-   **Email Issues:** If users aren't receiving emails, check the server logs. The system is designed to log the OTP to the console (`stdout`) if the email service fails (`⚠️ Email failed. Backup OTP...`).
-   **Redirect URI Errors:** Ensure the `redirect_uri` sent by the client app **exactly matches** the one in the database (including trailing slashes).

---

##  Common How-To Guide

Here are step-by-step instructions for performing common actions in IAA.

### For Administrators

#### How to Ban or Activate a User
1.  Log in with an Admin account.
2.  Navigate to **User Management** (click "Users" in the sidebar or go to `/admin/users`).
3.  Find the user in the list (use the search bar to filter by name or email).
4.  In the "Actions" column:
    -   Click the **Lock Icon** 🔒 to **Deactivate (Ban)** a user.
    -   Click the **Unlock Icon** 🔓 to **Activate** a user.
5.  A dialog will appear. Enter a **Reason** for the action (optional but recommended).
6.  Click **Confirm**.

#### How to Promote a User to Admin
1.  Navigate to **User Management** (`/admin/users`).
2.  Find the user.
3.  Click the **Edit (Pencil) Icon** ✏️.
4.  Confirm that you want to change the user's role (e.g., from `user` to `admin`).
5.  Click **Confirm Role Change**.

#### How to Register a New Client App
1.  Navigate to **Client Management** (click "Clients" in the sidebar or go to `/admin/clients`).
2.  Click the **+ Register Client** button.
3.  Fill in the form:
    -   **Application Name:** e.g., "My E-Learning App".
    -   **Redirect URI:** The exact callback URL of your app (e.g., `https://myapp.com/callback`).
    -   **Allowed Origins:** Your app's domain (e.g., `https://myapp.com`). Press **Enter** after typing the URL to add it.
4.  Click **Create Client**.
5.  **IMPORTANT:** A popup will show the **Client ID** and **Client Secret**. Copy the Client Secret immediately — it will **never be shown again**.

#### How to Regenerate a Client Secret
*If a client's secret is compromised, you can generate a new one.*
1.  Go to **Client Management** (`/admin/clients`).
2.  Find the client application in the list.
3.  Click the **Refresh Icon** 🔄 (Regenerate Secret).
4.  Confirm the action in the warning dialog.
5.  Copy the **New Client Secret** from the success popup.
    -   *Note: The old secret will stop working immediately.*

### For Developers

#### How to Test Your Integration
You can manually test the OAuth2 flow without writing code:
1.  **Construct the URL:**
    ```
    https://ist-africa-auth-1.onrender.com/api/auth/authenticate?client_id=YOUR_ID&redirect_uri=YOUR_URI&state=123
    ```
2.  **Paste into Browser:** If your `redirect_uri` is correct, you will see the IAA login page.
3.  **Login:** Enter valid user credentials.
4.  **Check Redirect:** You should be redirected back to your `redirect_uri` with a `?code=...` parameter in the browser bar.
