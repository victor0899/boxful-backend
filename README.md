# Boxful Backend - Prueba Técnica

API REST para gestión de órdenes de envío con soporte para pago contra entrega (COD), webhooks y cálculo automático de liquidación.

## Tecnologías Utilizadas

- **NestJS 11** - Framework backend con TypeScript
- **Prisma 6** - ORM con soporte para MongoDB
- **MongoDB Atlas** - Base de datos (M0 free tier)
- **JWT** - Autenticación con @nestjs/passport
- **Luxon** - Manejo de fechas en UTC
- **Joi** - Validación de variables de entorno

## Requisitos Implementados

### Requisitos Básicos

- Autenticación con JWT (tokens válidos 24 horas)
- Órdenes guardadas en MongoDB con Prisma
- Filtros para búsquedas (estado, fechas, COD, nombre cliente)
- Paginación y ordenamiento
- Exportación de datos

### Punto Extra - Módulo de Liquidación

- Gestión de órdenes COD con monto esperado y monto real recolectado
- Webhook para actualizar estado de órdenes y montos
- Costos de envío configurables por día de la semana
- Cálculo automático de liquidación:
  - COD: Monto Recolectado - Costo Envío - Comisión (0.01%, máx. $25)
  - No COD: -Costo Envío (valor negativo)
- Soporte para diferencia entre monto esperado y monto real

### Funcionalidades Adicionales

- Verificación de email con códigos de 6 dígitos (Resend)
- Exportación a Excel con formato profesional
- Generación de PDFs para etiquetas de orden
- Validación automática de variables de entorno con Joi
- Manejo consistente de fechas en UTC con Luxon
- Documentación Swagger interactiva
- Cálculo de costo basado en fecha programada de entrega

## Instalación y Configuración

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/victor0899/boxful-backend.git
cd boxful-backend
pnpm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` con las siguientes variables:

```env
DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/boxful"
JWT_SECRET="tu-secret-key-minimo-10-caracteres"
PORT=3001
RESEND_API_KEY="tu-api-key-de-resend"
FRONTEND_URL="http://localhost:3000"
```

Nota: El sistema valida que todas las variables requeridas existan al iniciar.

### 3. Generar Prisma Client y ejecutar seeders

```bash
npx prisma generate
pnpm run seed
```

El seed crea:
- 7 registros de costos de envío (Domingo: $5.00, Lunes-Martes: $3.00, etc.)
- Usuario de prueba: `test@boxful.com` / `password123`

### 4. Iniciar servidor

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

El servidor inicia en `http://localhost:3001`

## Documentación de la API

### Swagger UI

Disponible en `http://localhost:3001/api/docs` con todas las rutas documentadas y probables directamente desde el navegador.

### Endpoints Principales

#### Autenticación

```
POST   /api/auth/register      Registro de usuario
POST   /api/auth/login         Login (retorna JWT token)
GET    /api/auth/profile       Perfil del usuario autenticado
POST   /api/verification/send-code    Enviar código de verificación
POST   /api/verification/verify-code  Verificar código
```

#### Órdenes (requieren autenticación)

```
POST   /api/orders                    Crear orden
GET    /api/orders                    Listar con filtros y paginación
GET    /api/orders/:id                Detalle de orden
GET    /api/orders/export/csv         Exportar a CSV
GET    /api/orders/export/excel       Exportar a Excel
GET    /api/orders/:id/pdf            Generar PDF de orden
GET    /api/orders/settlement-balance Balance de liquidación
```

**Filtros disponibles:**
- `status` - PENDING, IN_TRANSIT, DELIVERED, CANCELLED
- `fromDate` / `toDate` - Rango de fechas (formato: YYYY-MM-DD)
- `search` - Búsqueda por nombre de cliente
- `isCOD` - true/false
- `page` / `limit` - Paginación
- `sortBy` / `sortOrder` - Ordenamiento

#### Webhooks (no requieren autenticación)

```
POST   /api/webhooks/order-status     Actualizar estado y monto recolectado
```

Payload ejemplo:
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "status": "DELIVERED",
  "codCollectedAmount": 150.00
}
```

#### Costos de Envío

```
GET    /api/shipping-costs            Todos los costos
GET    /api/shipping-costs/today      Costo del día actual
```

## Estructura del Proyecto

```
src/
├── auth/              JWT, registro, login, estrategias
├── verification/      Códigos de verificación por email
├── orders/            CRUD, filtros, exportación, PDFs
├── webhooks/          Actualización de estado de órdenes
├── shipping-costs/    Costos por día de semana
├── settlement/        Cálculo de liquidación COD
├── config/            Validación de variables de entorno
├── common/utils/      Utilidades (fechas en UTC con Luxon)
├── prisma/            Servicio global de Prisma
└── seed/              Datos iniciales
```

## Modelo de Datos

### User
Información del comercio: nombre, email, contraseña (bcrypt), WhatsApp, fecha de nacimiento.

### Order
- Información de recogida: dirección, fecha programada, instrucciones
- Datos del destinatario: nombre, teléfono, dirección, departamento, municipio
- Paquetes: array de objetos con descripción, peso, dimensiones, cantidad
- COD: flags y montos (esperado vs recolectado)
- Montos calculados: costo de envío, comisión, liquidación
- Estados: PENDING, IN_TRANSIT, DELIVERED, CANCELLED
- Timestamps: creación, actualización, entrega

### ShippingCost
Costos por día de semana (0-6), donde 0 = Domingo, 6 = Sábado.

## Lógica de Negocio

### Cálculo de Costo de Envío
El costo se determina según el día programado de entrega (scheduledDate), no el día actual. Esto permite que el costo refleje correctamente los costos operativos del día de la entrega.

### Cálculo de Liquidación (ejecutado automáticamente al marcar orden como DELIVERED)

**Para órdenes COD:**
```
Comisión = min(MontoRecolectado * 0.0001, 25)
Liquidación = MontoRecolectado - CostoEnvío - Comisión
```

**Para órdenes sin COD:**
```
Liquidación = -CostoEnvío
```

El monto de liquidación puede ser negativo, representando la deuda del comercio con el servicio de envíos.

### Manejo de Fechas
Todas las fechas se almacenan en UTC en la base de datos usando Luxon. El frontend debe convertir a la zona horaria local del usuario para visualización.

## Seguridad

- Contraseñas hasheadas con bcrypt (10 salt rounds)
- Tokens JWT firmados con secret desde variables de entorno
- Guards de autenticación en todas las rutas protegidas
- Validación de datos con class-validator y class-transformer
- Validación de variables de entorno en startup (fail-fast)
- CORS configurado para dominios permitidos

## Scripts Disponibles

```bash
pnpm run start:dev     # Desarrollo con hot-reload
pnpm run build         # Build para producción
pnpm run start:prod    # Ejecutar build de producción
pnpm run seed          # Poblar base de datos
pnpm run lint          # Linting con ESLint
```

## Notas de Implementación

- **Prisma Client**: Se genera automáticamente en `postinstall`
- **MongoDB**: No requiere migraciones, se usa `db push` para sincronizar schema
- **Puppeteer**: En desarrollo usa Chromium local, en producción usa @sparticuz/chromium para compatibilidad con entornos serverless
- **Tipos TypeScript**: Strict mode habilitado (noImplicitAny, strictNullChecks)

## Consideraciones de Producción

El proyecto está configurado para desplegarse en entornos serverless (Render, AWS Lambda) con:
- Variables de entorno validadas automáticamente
- Chromium optimizado para serverless
- MongoDB Atlas como base de datos administrada
- Logs estructurados para debugging

## Contacto

Para consultas sobre la implementación: victor0899
