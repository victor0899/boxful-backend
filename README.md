# Boxful Backend API

API REST para el sistema de gestión de órdenes de envío de Boxful.

## Stack Tecnológico

| Tecnología | Versión | Justificación |
|-----------|---------|---------------|
| **NestJS** | 11.x | Release estable con mejor soporte de TypeScript 5, decoradores modernos y la mejor integración con Prisma |
| **Prisma** | 6.x | MongoDB GA estable. Tipado fuerte end-to-end con TypeScript |
| **MongoDB Atlas** | M0 free | Base de datos como servicio, facilita deploy y colaboración |
| **TypeScript** | 5.x | Type safety end-to-end, mejor DX con autocompletado |
| **pnpm** | 10.x | Resolución estricta de dependencias, 3x más rápido que npm |

## Estructura del Proyecto

```
src/
  auth/           -> Autenticación (register, login, JWT)
  orders/         -> CRUD de órdenes + paginación + CSV
  webhooks/       -> Webhook para actualizar estado de órdenes
  shipping-costs/ -> Costos de envío por día de la semana
  settlement/     -> Cálculo de liquidación (COD y no-COD)
  prisma/         -> Servicio singleton de Prisma
  seed/           -> Datos iniciales (costos, usuario prueba)
```

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/victor0899/boxful-backend.git
cd boxful-backend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu connection string de MongoDB Atlas

# Generar cliente Prisma
npx prisma generate

# Ejecutar seeders (costos de envío + usuario de prueba)
pnpm run seed

# Iniciar en desarrollo
pnpm run start:dev
```

## Variables de Entorno

```env
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/boxful?retryWrites=true&w=majority"
JWT_SECRET="your-secret-key-here"
PORT=3001
```

## Seeders

Ejecutar `pnpm run seed` para crear:
- **Costos de envío**: 7 registros (Lunes-Domingo) con costos entre $3.00 y $5.00
- **Usuario de prueba**: `test@boxful.com` / `password123`

## API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (name, email, password) |
| POST | `/api/auth/login` | Login -> { accessToken } |
| GET | `/api/auth/profile` | Perfil del usuario (protegido) |

### Orders (protegido con JWT)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/orders` | Crear orden (datos cliente + paquetes + COD opcional) |
| GET | `/api/orders` | Listar órdenes con paginación y filtros |
| GET | `/api/orders/:id` | Detalle de una orden |
| GET | `/api/orders/export/csv` | Exportar órdenes a CSV |

**Filtros disponibles en GET /api/orders:**
- `?status=PENDING` - por estado (PENDING, IN_TRANSIT, DELIVERED, CANCELLED)
- `?fromDate=2026-01-01&toDate=2026-02-01` - rango de fechas
- `?search=nombre` - búsqueda por nombre de cliente
- `?isCOD=true` - solo órdenes con pago contra entrega
- `?page=1&limit=10` - paginación

### Webhooks
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/webhooks/order-status` | Actualizar estado + monto recolectado |

### Shipping Costs
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/shipping-costs` | Costos de todos los días |
| GET | `/api/shipping-costs/today` | Costo del día actual |

## Documentación Swagger

Disponible en `http://localhost:3001/api/docs` al ejecutar el servidor.

## Lógica de Liquidación (Punto Extra)

```
COD (contra entrega):
  comisión = min(montoRecolectado * 0.0001, 25)
  liquidación = montoRecolectado - costoEnvío - comisión

No COD:
  liquidación = -costoEnvío
```

## Esfuerzos Extra

- **Pago contra entrega (COD)**: Soporte completo para órdenes con monto esperado y monto recolectado
- **Webhook**: Endpoint para recibir actualizaciones de estado de las órdenes (simula servicio externo de logística)
- **Liquidación**: Cálculo automático al entregar una orden, incluyendo comisión COD
- **Costos dinámicos**: Costo de envío basado en el día de la semana, configurable desde base de datos
- **Exportación CSV**: Descarga de todas las órdenes del usuario en formato CSV
- **Swagger**: Documentación interactiva de la API completa
- **Seeders**: Script para inicializar la base de datos con datos de prueba

## Scripts Disponibles

```bash
pnpm run start:dev    # Desarrollo con hot-reload
pnpm run build        # Build de producción
pnpm run start:prod   # Ejecutar build de producción
pnpm run seed         # Ejecutar seeders
pnpm run lint         # Linting
```
