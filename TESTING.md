# IST Africa Auth — User Accepted (Tested) Stories

## Authentication

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 1 | User registration | Yes | |
| 2 | Email verification (OTP) | Yes | |
| 3 | Login (email/password) | Yes | |
| 4 | Token refresh | Yes | Auto-refresh works via apiClient |
| 5 | Logout (single device) | Yes | |
| 6 | Logout (all devices) | Yes | |
| 7 | LinkedIn OAuth login | No | |
| 8 | Forgot password (email reset) | Yes | |
| 9 | Reset password (via link) | Yes | |
| 10 | Change password (logged in) | Yes | |

## Profile Management

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 11 | View profile (name, email, date) | Yes | |
| 12 | View user type (ist_member/ext_member) | No | Not visible on profile page |
| 13 | Edit profile name | Yes | |
| 14 | Upload profile picture (with crop) | Yes | Added react-easy-crop |

## Sessions

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 15 | View active sessions (real data) | Yes | Shows browser, OS, IP, last active |
| 16 | Terminate specific session | Yes | Deletes refresh token only; access token remains valid until expiry |
| 17 | Device/browser detection | Yes | ua-parser-js captures Chrome, macOS, etc. |

## OAuth2 / Client Integration

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 18 | Register client app (admin) | No | |
| 19 | List clients (admin) | No | |
| 20 | Update client (admin) | No | |
| 21 | Regenerate client secret (admin) | No | |
| 22 | Delete client (admin) | No | |
| 23 | Authorization code flow | No | |
| 24 | Token exchange (code -> tokens) | No | |
| 25 | JWKS public key endpoint | No | |
| 26 | Token introspection | No | |

## Admin

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 27 | Update user role (admin) | No | |
| 28 | Default admin auto-disable | No | |

## Security

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 29 | CORS enforcement | Yes | Fixed origin/port mismatch |
| 30 | JWT RS256 signing | Yes | Working via login flow |
| 31 | Brute force protection | No | README mentions 5 failed logins -> 10-min lockout |

## Infrastructure

| # | Story | Accepted | Notes |
|---|-------|----------|-------|
| 32 | Docker Compose (local dev) | Yes | Fixed SSL, ports, volume mounts |
| 33 | Hot reload (FE + BE) | Yes | Source volumes mounted |
| 34 | Database migrations | Yes | Sequelize CLI, auto-run on startup |
