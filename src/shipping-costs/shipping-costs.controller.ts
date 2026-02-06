import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingCostsService } from './shipping-costs.service';

@ApiTags('Shipping Costs')
@Controller('shipping-costs')
export class ShippingCostsController {
  constructor(private shippingCostsService: ShippingCostsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener costos de envío por día de la semana' })
  findAll() {
    return this.shippingCostsService.findAll();
  }

  @Get('today')
  @ApiOperation({ summary: 'Obtener costo de envío del día actual' })
  findToday() {
    return this.shippingCostsService.findToday();
  }
}
