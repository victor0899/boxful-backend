import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ShippingCostsModule } from './shipping-costs/shipping-costs.module';
import { SettlementModule } from './settlement/settlement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    WebhooksModule,
    ShippingCostsModule,
    SettlementModule,
  ],
})
export class AppModule {}
