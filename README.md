# IST Auth Service

## 🧩 Overview
The **IST Auth Service** is a centralized authentication and authorization system used across all internal applications.  
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

## ⚙️ API Integration
### Login
