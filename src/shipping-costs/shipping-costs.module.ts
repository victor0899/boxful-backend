import { Module } from '@nestjs/common';
import { ShippingCostsService } from './shipping-costs.service';
import { ShippingCostsController } from './shipping-costs.controller';

@Module({
  controllers: [ShippingCostsController],
  providers: [ShippingCostsService],
})
export class ShippingCostsModule {}
