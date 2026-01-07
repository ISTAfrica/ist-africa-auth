# IST Africa Auth - Frontend Pages Documentation

## 📋 Complete List of IAA Pages & Components

### **🔐 Authentication Pages**
1. **Login Page** (`/login`)
   - Email/password form
   - "Login with IAA" button
   - Error handling for invalid credentials

2. **Password Reset Page** (`/login?forgot=true`)
   - Email input form
   - "Send Reset Email" button
   - Reset email confirmation

3. **Password Reset Form** (`/reset-password?token=abc123`)
   - New password form (accessed via email link)
   - Password confirmation
   - Success redirect

4. **Client App Callback Page** (`/callback`) ⚠️ **NOT IAA PAGE**
   - **Location:** Client application (e.g., academy.ist.africa/callback)
   - **Purpose:** Receives authorization code from IAA
   - **Content:** Loading spinner, "Authenticating..." message
   - **Action:** Exchanges code for tokens via IAA API
   - **User Experience:** Brief loading, then redirect to app dashboard
   - **Note:** This is a client application page, not part of IAA/IDP

### **👤 User Management Pages**
5. **User Dashboard** (`/dashboard`)
   - Profile information display
   - Password management options
   - Active sessions view
   - Security settings

6. **Change Password Form** (within dashboard)
   - Current password input
   - New password input
   - Password confirmation

### **🔧 Client Integration Components**
7. **Floating Authentication Widget**
   - "Login with IAA" button (appears when not authenticated)
   - Auto-hides when user is authenticated
   - JavaScript widget for client apps

### **📊 Administrative Pages** (Mentioned but not fully documented)
8. **Admin Dashboard** (`/admin`)
   - System overview
   - User statistics
   - Active sessions monitoring

9. **Client Management Page** (`/admin/clients`)
   - Register new client applications
   - Manage client_id, client_secret, redirect_uri
   - View/edit registered clients

10. **User Management Page** (`/admin/users`)
    - List all users
    - User search and filtering
    - User status management

11. **Key Management Page** (`/admin/keys`)
    - RSA key pair generation
    - Key rotation management
    - JWKS endpoint management

12. **Active Sessions Page** (`/admin/sessions`)
    - View active refresh tokens
    - Session details
    - Revoke individual sessions

13. **Security Dashboard** (`/admin/security`)
    - Failed login attempts monitoring
    - Brute force protection status
    - Security logs

14. **System Health Page** (`/admin/health`)
    - Database connection status
    - Redis cache status
    - API endpoint health checks

### **📚 Documentation Pages**
15. **API Documentation Page** (`/docs`)
    - Interactive API documentation
    - Endpoint descriptions
    - Request/response examples

### **❌ Error Pages**
16. **Error Pages**
    - 404 Not Found
    - 500 Internal Server Error
    - Invalid credentials
    - Unauthorized client
    - Invalid grant errors

## 🎯 Summary

**Fully Documented:** 6 pages/components
- Login Page
- Password Reset Page  
- Password Reset Form
- Callback Page
- User Dashboard
- Floating Authentication Widget

**Mentioned but Not Detailed:** 10+ administrative and system pages

**Total Pages Defined:** **16+ pages/components**

---

## 📝 Update Log

- **Initial Creation:** Complete list of all IAA pages and components
- **Status:** Core user-facing functionality documented, administrative pages need detailed documentation

---

 *This document will be updated as we continue developing and documenting the IAA frontend pages.*