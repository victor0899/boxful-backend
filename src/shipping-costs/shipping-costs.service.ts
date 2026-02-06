import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShippingCostsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.shippingCost.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findToday() {
    const today = new Date().getDay();
    const cost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek: today },
    });
    return cost ?? { dayOfWeek: today, dayName: 'Desconocido', cost: 3.5 };
  }
}
