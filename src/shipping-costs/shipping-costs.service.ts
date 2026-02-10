import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getCurrentDayOfWeek } from '../common/utils/date.util';

@Injectable()
export class ShippingCostsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shippingCost.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findToday() {
    const today = getCurrentDayOfWeek();
    const cost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek: today },
    });
    return cost ?? { dayOfWeek: today, dayName: 'Desconocido', cost: 3.5 };
  }
}
