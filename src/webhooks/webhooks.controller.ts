import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('order-status')
  @ApiOperation({ summary: 'Actualizar estado de orden (simulación webhook)' })
  updateOrderStatus(@Body() dto: UpdateOrderStatusDto) {
    return this.webhooksService.updateOrderStatus(dto);
  }
}
