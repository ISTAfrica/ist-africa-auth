# IST Africa Authentication Backend

A NestJS-based authentication service with JWT token management, user registration, and JWKS endpoint for the IST Africa project.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with Docker
docker run --name postgres-iaa \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=IAA \
  -p 5432:5432 \
  -d postgres:15
```

#### Option B: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database named `IAA`
3. Update connection details in `.env` file

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_SYNC=true
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=mypassword
DB_NAME=IAA
DB_DIALECT=postgres
NODE_ENV=development

# Database URL for Prisma
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/IAA?schema=public"

# JWT Configuration
JWT_KEY_ID="key id"
JWT_PRIVATE_KEY="private key"

JWT_PUBLIC_KEY="public key"
```

### 4. Generate JWT Keys (Optional)

If you want to generate new JWT keys:

```bash
node src/scripts/generate-keys.mjs
```

### 5. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 6. Start the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### Authenticate User
```http
POST /api/auth/authenticate
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "uuid-refresh-token"
}
```

#### JWKS Endpoint
```http
GET /api/auth/jwks
```

**Response:**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-iaa-admin-2025-01",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

### User Management

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/:id
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── app/                    # Main application module
│   ├── config/                 # Configuration files
│   ├── models/                 # Feature modules
│   │   ├── auth/              # Authentication module
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   └── users/             # User management module
│   ├── prisma/                # Database service
│   └── scripts/               # Utility scripts
├── prisma/                    # Database schema and migrations
├── test/                      # Test files
└── dist/                      # Compiled JavaScript (generated)
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug         # Start with debugging

# Building
npm run build              # Build for production
npm run start:prod         # Start production build

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database (⚠️ DESTROYS ALL DATA)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_NAME` | Database name | `IAA` |
| `JWT_KEY_ID` | JWT key identifier | `key-iaa-admin-2025-01` |
| `JWT_PRIVATE_KEY` | RSA private key for signing | Required |
| `JWT_PUBLIC_KEY` | RSA public key for verification | Required |

### Database Schema

The application uses two main models:

- **User**: Stores user account information
- **RefreshToken**: Manages JWT refresh tokens

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🔒 Security Features

- **Password Hashing**: Uses bcryptjs for secure password storage
- **JWT Tokens**: RS256 algorithm for token signing
- **Input Validation**: Zod schemas for request validation
- **CORS**: Enabled for cross-origin requests
- **Refresh Tokens**: Secure token refresh mechanism

## 📝 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists

2. **JWT Token Generation Error**
   - Verify `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are set
   - Ensure keys are properly formatted with `\n` characters

3. **Prisma Client Error**
   - Run `npx prisma generate` after schema changes
   - Check if migrations are applied: `npx prisma migrate status`

### Logs

The application logs important events:
- Database connection status
- JWT key loading
- Authentication attempts
- Error details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is licensed under the UNLICENSED license.
