# أرشيفنا - Archivna

**بوابتك الرقمية للذاكرة الفلسطينية**

A complete full-stack digital archive platform for Palestinian archival materials.

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- TanStack Query
- React Hook Form + Zod
- React Router
- i18next
- Lucide icons

### Backend
- NestJS + TypeScript
- PostgreSQL
- Prisma ORM
- Passport.js + JWT
- bcrypt (password hashing)
- Multer (file uploads)
- Swagger/OpenAPI
- Helmet + Rate Limiting

### Infrastructure
- Docker + Docker Compose
- npm workspaces monorepo

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Docker)
- npm 9+

## Quick Start with Docker

```bash
# Clone and start everything
docker-compose up -d

# Run migrations
docker-compose exec api npx prisma migrate dev

# Seed the database
docker-compose exec api npm run seed

# Access:
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs
```

## Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL
Create a database named `archivna`:
```sql
CREATE DATABASE archivna;
```

### 3. Configure Environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials
```

### 4. Run Migrations
```bash
npm run generate
npm run migrate
```

### 5. Seed Database
```bash
npm run seed
```

### 6. Start Development
```bash
npm run dev
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:api` | Start backend only |
| `npm run dev:web` | Start frontend only |
| `npm run build` | Build both for production |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed the database |
| `npm run generate` | Generate Prisma client |
| `npm run test` | Run backend tests |
| `npm run lint` | Lint all packages |

## Environment Variables

See `apps/api/.env.example` for all configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_ACCESS_SECRET` | Secret for access tokens | - |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - |
| `ACCESS_TOKEN_EXPIRATION` | Access token lifetime | 15m |
| `REFRESH_TOKEN_EXPIRATION` | Refresh token lifetime | 7d |
| `STORAGE_DRIVER` | File storage backend | local |
| `UPLOAD_DIRECTORY` | Upload directory path | ./uploads |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `PORT` | Backend port | 3000 |

### File Size Limits
| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_IMAGE_SIZE` | 20MB | Max image file size |
| `MAX_DOCUMENT_SIZE` | 100MB | Max document size |
| `MAX_AUDIO_SIZE` | 250MB | Max audio file size |
| `MAX_VIDEO_SIZE` | 1GB | Max video file size |
| `MAX_ZIP_SIZE` | 250MB | Max ZIP file size |

## File Storage

### Local Storage (Default)
Files are stored in the `uploads/` directory with randomized filenames. The original filename is preserved in the database. Files are served through authenticated API endpoints, never directly from the filesystem.

### Switching to S3
The storage service is abstracted. To switch to S3/MinIO/Cloudflare R2:
1. Implement a new `S3StorageService` implementing the storage interface
2. Register it in the storage module
3. Update `STORAGE_DRIVER` environment variable

## API Documentation

Once the backend is running, visit:
```
http://localhost:3000/api/docs
```

Swagger UI provides complete API documentation for all endpoints.

## Authentication

- **Registration**: Email + password, no email verification required
- **Login**: Returns JWT access token (Authorization header) + refresh token (HTTP-only cookie)
- **Token Refresh**: Automatic rotation of refresh tokens
- **Logout**: Revokes refresh token

### Default Development Credentials
After seeding, you can register new accounts or use seeded users:
- Email: `admin@archivna.dev` / Password: `DevPass123!`

## Search Implementation

The search system uses:
- PostgreSQL full-text search
- pg_trgm for partial matching
- Arabic text normalization (diacritics, alef variants, etc.)
- Server-side filtering, sorting, and pagination
- GIN indexes for performance

## Security Features

- Password hashing with bcrypt
- JWT access + refresh token authentication
- HTTP-only secure cookies for refresh tokens
- Rate limiting on all endpoints
- Helmet security headers
- CORS configuration
- Input validation (class-validator + Zod)
- File type validation (extension + MIME type)
- SQL injection protection (Prisma)
- XSS protection
- Path traversal protection

## Project Structure

```
archivna/
├── apps/
│   ├── api/           # NestJS backend
│   │   ├── prisma/    # Schema, migrations, seed
│   │   ├── src/       # Source code
│   │   └── test/      # E2E tests
│   └── web/           # React frontend
│       └── src/
│           ├── api/       # API client functions
│           ├── components/ # UI components
│           ├── hooks/     # React hooks
│           ├── i18n/      # Translations
│           ├── lib/       # Utilities
│           ├── pages/     # Page components
│           ├── routes/    # Route definitions
│           └── store/     # State management
├── packages/
│   └── tsconfig/      # Shared TypeScript configs
├── docker-compose.yml
└── package.json       # Root workspace config
```

## License

All rights reserved. Palestinian Digital Archive Initiative.
