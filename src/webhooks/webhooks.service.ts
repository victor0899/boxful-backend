import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementService } from '../settlement/settlement.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private settlementService: SettlementService,
  ) {}

  async updateOrderStatus(dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (dto.codCollectedAmount !== undefined) {
      updateData.codCollectedAmount = dto.codCollectedAmount;
    }

    if (dto.status === 'DELIVERED' && order.shippingCost !== null) {
      const collectedAmount =
        dto.codCollectedAmount ?? order.codCollectedAmount ?? 0;
      const settlement = this.settlementService.calculateSettlement({
        isCOD: order.isCOD,
        codCollectedAmount: collectedAmount,
        shippingCost: order.shippingCost,
      });
      updateData.codCommission = settlement.codCommission;
      updateData.settlementAmount = settlement.settlementAmount;
    }

    return this.prisma.order.update({
      where: { id: dto.orderId },
      data: updateData,
    });
  }
}
