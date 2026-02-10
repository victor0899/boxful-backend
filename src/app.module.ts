import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ShippingCostsModule } from './shipping-costs/shipping-costs.module';
import { SettlementModule } from './settlement/settlement.module';
import { VerificationModule } from './verification/verification.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true, // Allow other env vars not in schema
        abortEarly: false, // Show all validation errors at once
      },
    }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    WebhooksModule,
    ShippingCostsModule,
    SettlementModule,
    VerificationModule,
  ],
})
export class AppModule {}
