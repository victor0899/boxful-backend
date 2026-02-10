# Boxful Backend

## Project Overview
API REST para gestión de órdenes de envío. NestJS 11 + Prisma 6 + MongoDB Atlas.

## Tech Stack
- **Runtime:** Node.js with TypeScript 5 (strict: noImplicitAny, strictNullChecks, isolatedModules)
- **Framework:** NestJS 11 (CommonJS, decorators, module system)
- **ORM:** Prisma 6 with `prisma-client-js` generator (NOT `prisma-client` which outputs ESM)
- **Database:** MongoDB Atlas (M0 free tier)
- **Auth:** JWT via @nestjs/passport + passport-jwt
- **Validation:** class-validator + class-transformer + Joi (env validation)
- **Docs:** Swagger via @nestjs/swagger
- **Date/Time:** Luxon for consistent UTC handling
- **PDF Generation:** puppeteer-core + @sparticuz/chromium (serverless-optimized)
- **Excel Export:** exceljs
- **Email:** Resend for verification codes
- **Package Manager:** pnpm 10

## Commands
- `pnpm run start:dev` - Development server with watch mode (port 3001)
- `pnpm run build` - Production build (outputs to dist/)
- `pnpm run start:prod` - Run production build (uses node dist/src/main.js)
- `pnpm run seed` - Seed database (shipping costs + test user)
- `pnpm run lint` - ESLint with Prettier
- `npx prisma generate` - Regenerate Prisma client after schema changes (runs automatically on postinstall)
- `npx prisma db push` - Push schema to MongoDB (no migrations for MongoDB)

## Architecture
All API routes are prefixed with `/api`. Modules follow NestJS convention: controller + service + module + DTOs.

```
src/
  main.ts              -> Bootstrap: CORS (allows *.vercel.app), ValidationPipe, Swagger, global prefix /api
  app.module.ts        -> Root module importing all feature modules + env validation
  config/              -> Environment validation schema (Joi)
    env.validation.ts  -> Joi schema for required env vars
  prisma/              -> Global PrismaService (extends PrismaClient, singleton)
  auth/                -> Register, login, JWT strategy, JwtAuthGuard
  verification/        -> Email verification with Resend (6-digit codes, 10min expiry)
  orders/              -> CRUD + pagination + filters + Excel/PDF export
    templates/         -> PDF generation templates (puppeteer HTML templates)
  webhooks/            -> POST /webhooks/order-status (status + COD amount updates)
  shipping-costs/      -> GET costs per day of week
  settlement/          -> Business logic: COD commission = min(amount * 0.0001, 25)
  users/               -> User-related functionality
  common/              -> Shared utilities and helpers
    utils/date.util.ts -> Luxon-based date utilities (all dates in UTC)
  types/               -> TypeScript type definitions
  assets/              -> Static resources (logos, images for PDFs)
  seed/                -> ts-node script, run directly (not a NestJS module)
```

## Key Patterns
- **PrismaModule is @Global()** - no need to import it in feature modules
- **JwtAuthGuard** applied at controller level on protected routes (orders)
- **Webhooks controller is NOT protected** - simulates external service
- Express `Request` type causes TS1272 with `isolatedModules` + `emitDecoratorMetadata` - use `any` for `@Req()` params or `import type` for `@Res()`
- `passport-jwt` secretOrKey requires non-undefined string - use `|| 'fallback'`
- MongoDB with Prisma: no migrations, use `db push`. Embedded types use `type` keyword.
- **CORS**: main.ts allows localhost:3000, all *.vercel.app domains, and FRONTEND_URL env var
- **Chromium for serverless**: Use @sparticuz/chromium instead of full Chrome for Puppeteer in production

## Date/Time Handling (UTC Standard)
**IMPORTANT: All dates are stored in UTC in the database. Always use Luxon utilities from `common/utils/date.util.ts`**

### Core Principles
- **Never use `new Date()` directly** - use Luxon utilities instead
- **Always store dates in UTC** - MongoDB stores dates in UTC by default
- **Convert to user timezone in frontend** - API returns ISO strings, frontend converts
- **Use helper functions** - import from `src/common/utils/date.util.ts`

### Key Utilities
```typescript
import {
  nowUtcDate,           // Current time as Date object (for Prisma)
  parseIsoUtcDate,      // Parse ISO string to Date (for Prisma)
  parseStartOfDayUtc,   // Start of day (00:00:00) for date ranges
  parseEndOfDayUtc,     // End of day (23:59:59.999) for date ranges
  getCurrentDayOfWeek,  // 0-6 (Sun-Sat), compatible with JS getDay()
  formatDate,           // Format Date to localized string
  isFutureDate,         // Check if date is in future
  isPastDate,           // Check if date is in past
} from '../common/utils/date.util';
```

### Usage Examples
```typescript
// Creating dates (Prisma)
scheduledDate: parseIsoUtcDate(dto.scheduledDate)
deliveredAt: nowUtcDate()

// Date range queries
where.createdAt.gte = parseStartOfDayUtc(query.fromDate);
where.createdAt.lte = parseEndOfDayUtc(query.toDate);

// Formatting for display
const formatted = formatDate(order.createdAt, 'es-GT');

// Day of week
const today = getCurrentDayOfWeek(); // 0-6
```

## Environment Variables Validation
**All environment variables are validated at startup using Joi schema (`src/config/env.validation.ts`)**

### Validation Schema
- `NODE_ENV`: Must be 'development', 'production', or 'test' (default: 'development')
- `PORT`: Number (default: 3001)
- `DATABASE_URL`: Required string (MongoDB connection)
- `JWT_SECRET`: Required string, min 10 characters
- `RESEND_API_KEY`: Required string (for email verification)
- `FRONTEND_URL`: Optional URI

### Using ConfigService
```typescript
constructor(private configService: ConfigService) {}

const port = this.configService.get<number>('PORT'); // Type-safe access
const jwtSecret = this.configService.get<string>('JWT_SECRET');
```

**Note:** App will fail to start if required env vars are missing or invalid (fail-fast pattern)

## Verification Module
- **Resend** for sending emails (API key in `RESEND_API_KEY` env var)
- Sender: `Boxful <onboarding@resend.dev>` (Resend free tier)
- Codes stored in-memory (Map), expire after 10 minutes
- **Master code `000000`** always passes verification (for dev/demo)
- Endpoints: `POST /api/verification/send-code`, `POST /api/verification/verify-code`

## Orders Module - Export Features
- **PDF Export**: Generates professional order labels using puppeteer-core
  - Template: `src/orders/templates/order-pdf.template.ts` (HTML/CSS template)
  - Uses @sparticuz/chromium for serverless compatibility (Render.com deployment)
  - Endpoint: `GET /api/orders/:id/pdf`
- **Excel Export**: Exports filtered orders to .xlsx format using exceljs
  - Includes all order fields, packages, and calculated amounts
  - Endpoint: `GET /api/orders/export/excel` (accepts query filters)

## Database Schema (prisma/schema.prisma)
- **User**: id, firstName, lastName, gender, birthDate, whatsappCode, whatsappNumber, email (unique), password (bcrypt), orders[], createdAt, updatedAt — mapped to `users` collection
- **Order**: Core fields include:
  - **Pickup info**: pickupAddress, scheduledDate, instructions (optional)
  - **Recipient info**: firstName, lastName, phoneCode, phoneNumber (used to auto-calculate clientName and clientPhone)
  - **Legacy client fields**: clientName, clientEmail, clientPhone, clientAddress, clientDepartment, clientMunicipality, clientReference
  - **Packages**: packages[] (embedded Package type)
  - **Status tracking**: status (default "PENDING"), deliveredAt (optional)
  - **COD fields**: isCOD, codExpectedAmount, codCollectedAmount
  - **Financial**: shippingCost, codCommission, settlementAmount
  - **Metadata**: userId, createdAt, updatedAt
- **Package** (embedded type): description, weight, height, width, length, quantity (default 1)
- **ShippingCost**: dayOfWeek (0-6, unique), dayName, cost

## Environment Variables (Validated with Joi)
- `DATABASE_URL` - MongoDB Atlas connection string (required)
- `JWT_SECRET` - JWT signing secret, min 10 chars (required)
- `PORT` - Server port (default: 3001)
- `FRONTEND_URL` - Additional CORS origin (optional, must be valid URI)
- `RESEND_API_KEY` - Resend API key for email verification (required)
- `NODE_ENV` - Environment: 'development', 'production', or 'test' (default: 'development')

## Important Notes
- Do NOT mention AI tools anywhere in code, commits, or documentation
- Import Prisma client from `@prisma/client`, NOT from `../../generated/prisma`
- The `generated/` directory is gitignored - Prisma client lives in node_modules
