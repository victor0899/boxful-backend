# Boxful Backend

## Project Overview
API REST para gestión de órdenes de envío. NestJS 11 + Prisma 6 + MongoDB Atlas.

## Tech Stack
- **Runtime:** Node.js with TypeScript 5 (strict: noImplicitAny, strictNullChecks, isolatedModules)
- **Framework:** NestJS 11 (CommonJS, decorators, module system)
- **ORM:** Prisma 6 with `prisma-client-js` generator (NOT `prisma-client` which outputs ESM)
- **Database:** MongoDB Atlas (M0 free tier)
- **Auth:** JWT via @nestjs/passport + passport-jwt
- **Validation:** class-validator + class-transformer
- **Docs:** Swagger via @nestjs/swagger
- **Package Manager:** pnpm 10

## Commands
- `pnpm run start:dev` - Development server with watch mode (port 3001)
- `pnpm run build` - Production build (outputs to dist/)
- `pnpm run start:prod` - Run production build
- `pnpm run seed` - Seed database (shipping costs + test user)
- `pnpm run lint` - ESLint with Prettier
- `npx prisma generate` - Regenerate Prisma client after schema changes
- `npx prisma db push` - Push schema to MongoDB (no migrations for MongoDB)

## Architecture
All API routes are prefixed with `/api`. Modules follow NestJS convention: controller + service + module + DTOs.

```
src/
  main.ts              -> Bootstrap: CORS, ValidationPipe, Swagger, global prefix /api
  app.module.ts        -> Root module importing all feature modules
  prisma/              -> Global PrismaService (extends PrismaClient, singleton)
  auth/                -> Register, login, JWT strategy, JwtAuthGuard
  verification/        -> Email verification with Resend (6-digit codes, 10min expiry)
  orders/              -> CRUD + pagination + filters + CSV export
  webhooks/            -> POST /webhooks/order-status (status + COD amount updates)
  shipping-costs/      -> GET costs per day of week
  settlement/          -> Business logic: COD commission = min(amount * 0.0001, 25)
  seed/                -> ts-node script, run directly (not a NestJS module)
```

## Key Patterns
- **PrismaModule is @Global()** - no need to import it in feature modules
- **JwtAuthGuard** applied at controller level on protected routes (orders)
- **Webhooks controller is NOT protected** - simulates external service
- Express `Request` type causes TS1272 with `isolatedModules` + `emitDecoratorMetadata` - use `any` for `@Req()` params or `import type` for `@Res()`
- `passport-jwt` secretOrKey requires non-undefined string - use `|| 'fallback'`
- MongoDB with Prisma: no migrations, use `db push`. Embedded types use `type` keyword.

## Verification Module
- **Resend** for sending emails (API key in `RESEND_API_KEY` env var)
- Sender: `Boxful <onboarding@resend.dev>` (Resend free tier)
- Codes stored in-memory (Map), expire after 10 minutes
- **Master code `000000`** always passes verification (for dev/demo)
- Endpoints: `POST /api/verification/send-code`, `POST /api/verification/verify-code`

## Database Schema (prisma/schema.prisma)
- **User**: id, firstName, lastName, gender, birthDate, whatsappCode, whatsappNumber, email (unique), password (bcrypt), orders[] — mapped to `users` collection
- **Order**: client data, packages[] (embedded Package type), status, COD fields, shipping/settlement amounts
- **Package** (embedded type): description, weight, height, width, length, quantity
- **ShippingCost**: dayOfWeek (0-6, unique), dayName, cost

## Environment Variables
- `DATABASE_URL` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default 3001)
- `FRONTEND_URL` - Additional CORS origin (optional)
- `RESEND_API_KEY` - Resend API key for email verification

## Important Notes
- Do NOT mention AI tools anywhere in code, commits, or documentation
- Import Prisma client from `@prisma/client`, NOT from `../../generated/prisma`
- The `generated/` directory is gitignored - Prisma client lives in node_modules
