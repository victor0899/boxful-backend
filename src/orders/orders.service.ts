import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import puppeteer from 'puppeteer';
import { getOrderPdfTemplate } from './templates/order-pdf.template';

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

    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const where: any = { userId };

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
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

    const [orders, total, counts] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.getOrderCounts(userId),
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts,
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

  async generatePdf(userId: string, orderId: string): Promise<Uint8Array> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const html = getOrderPdfTemplate(order);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    await browser.close();

    return pdf;
  }

  private async getShippingCostForToday(): Promise<number> {
    const today = new Date().getDay();
    const cost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek: today },
    });
    return cost?.cost ?? 3.5;
  }

  private async getOrderCounts(userId: string) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    const counts = {
      pending: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0,
    };

    statuses.forEach((s) => {
      const status = s.status.toUpperCase();
      if (status === 'PENDING') counts.pending = s._count;
      else if (status === 'IN_TRANSIT') counts.inTransit = s._count;
      else if (status === 'DELIVERED') counts.delivered = s._count;
      else if (status === 'CANCELLED') counts.cancelled = s._count;
    });

    return {
      ...counts,
      pendingTotal: counts.pending + counts.inTransit + counts.cancelled,
      deliveredTotal: counts.delivered,
    };
  }
}
