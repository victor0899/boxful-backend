import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const shippingCost = await this.getShippingCostForToday();

    // Calcular clientName y clientPhone automáticamente
    const clientName = `${dto.firstName} ${dto.lastName}`;
    const clientPhone = `+${dto.phoneCode} ${dto.phoneNumber}`;

    let settlementAmount: number | undefined;
    let codCommission: number | undefined;

    if (dto.isCOD && dto.codExpectedAmount) {
      codCommission = 0;
      settlementAmount = -shippingCost;
    } else {
      settlementAmount = -shippingCost;
    }

    return this.prisma.order.create({
      data: {
        userId,
        // Nuevos campos
        pickupAddress: dto.pickupAddress,
        scheduledDate: new Date(dto.scheduledDate),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneCode: dto.phoneCode,
        phoneNumber: dto.phoneNumber,
        instructions: dto.instructions,
        // Campos calculados automáticamente
        clientName,
        clientPhone,
        // Campos existentes
        clientEmail: dto.clientEmail,
        clientAddress: dto.clientAddress,
        clientDepartment: dto.clientDepartment,
        clientMunicipality: dto.clientMunicipality,
        clientReference: dto.clientReference,
        packages: dto.packages,
        isCOD: dto.isCOD ?? false,
        codExpectedAmount: dto.codExpectedAmount,
        shippingCost,
        codCommission,
        settlementAmount,
      },
    });
  }

  async findAll(userId: string, query: QueryOrdersDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.status) {
      const statuses = query.status.split(',').map(s => s.trim());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate + 'T23:59:59.999Z');
      }
    }

    if (query.search) {
      where.clientName = { contains: query.search, mode: 'insensitive' };
    }

    if (query.isCOD !== undefined) {
      where.isCOD = query.isCOD === 'true';
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async exportCsv(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Cliente',
      'Teléfono',
      'Dirección',
      'Departamento',
      'Municipio',
      'Estado',
      'COD',
      'Monto Esperado',
      'Monto Recolectado',
      'Costo Envío',
      'Comisión',
      'Liquidación',
      'Fecha Creación',
    ];

    const rows = orders.map((order) => [
      order.id,
      order.clientName,
      order.clientPhone,
      order.clientAddress,
      order.clientDepartment,
      order.clientMunicipality,
      order.status,
      order.isCOD ? 'Sí' : 'No',
      order.codExpectedAmount ?? '',
      order.codCollectedAmount ?? '',
      order.shippingCost ?? '',
      order.codCommission ?? '',
      order.settlementAmount ?? '',
      order.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }

  private async getShippingCostForToday(): Promise<number> {
    const today = new Date().getDay();
    const cost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek: today },
    });
    return cost?.cost ?? 3.5;
  }
}
