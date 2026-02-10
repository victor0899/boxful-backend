import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import puppeteerCore from 'puppeteer-core';
import puppeteerFull from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { getOrderPdfTemplate } from './templates/order-pdf.template';
import { Workbook } from 'exceljs';
import {
  parseIsoUtcDate,
  parseStartOfDayUtc,
  parseEndOfDayUtc,
  formatDate,
} from '../common/utils/date.util';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Calculate shipping cost based on SCHEDULED date, not today
    const scheduledDate = parseIsoUtcDate(dto.scheduledDate);
    const shippingCost = await this.getShippingCostForDate(scheduledDate);

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
        scheduledDate: scheduledDate,
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

    // Configurar ordenamiento con valores por defecto
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const where: any = { userId };

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = parseStartOfDayUtc(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = parseEndOfDayUtc(query.toDate);
      }
    }

    if (query.search) {
      where.clientName = { contains: query.search, mode: 'insensitive' };
    }

    if (query.isCOD !== undefined) {
      where.isCOD = query.isCOD === 'true';
    }

    // Mapear campos permitidos para ordenamiento
    const sortFieldMap: Record<string, string> = {
      clientName: 'clientName',
      clientDepartment: 'clientDepartment',
      clientMunicipality: 'clientMunicipality',
      createdAt: 'createdAt',
      status: 'status',
    };

    const dbField = sortFieldMap[sortBy] || 'createdAt';
    const orderBy: any = { [dbField]: sortOrder };

    const [orders, total, counts] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.getOrderCounts(userId),
    ]);
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

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

  async exportCsv(userId: string, query: QueryOrdersDto) {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const where: any = { userId };

    // Si hay IDs específicos, filtrar solo por esos (ignorar otros filtros)
    if (query.ids) {
      const idsArray = query.ids.split(',').map((id) => id.trim());
      where.id = { in: idsArray };
    } else {
      // Aplicar filtros normales solo si no hay IDs específicos
      if (query.status) {
        const statuses = query.status.split(',').map((s) => s.trim());
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }

      if (query.fromDate || query.toDate) {
        where.createdAt = {};
        if (query.fromDate) {
          where.createdAt.gte = parseStartOfDayUtc(query.fromDate);
        }
        if (query.toDate) {
          where.createdAt.lte = parseEndOfDayUtc(query.toDate);
        }
      }

      if (query.isCOD !== undefined) {
        where.isCOD = query.isCOD === 'true';
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

    const headers = [
      'No. Orden',
      'Fecha Creación',
      'Estado',
      'Cliente',
      'Teléfono',
      'Departamento',
      'Municipio',
      'Paquetes',
      'COD',
      'Monto Esperado',
      'Monto Cobrado',
      'Costo Envío',
      'Comisión',
      'Liquidación',
      'Fecha Entrega',
    ];

    const formatDateLocal = (date: Date | null | undefined): string => {
      if (!date) return '';
      return formatDate(date, 'es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const formatAmount = (amount: number | null | undefined): string => {
      if (amount === null || amount === undefined) return '';
      return `$${amount.toFixed(2)}`;
    };

    const rows = orders.map((order) => [
      order.id.slice(-6).toUpperCase(),
      formatDate(order.createdAt),
      order.status,
      order.clientName,
      order.clientPhone,
      order.clientDepartment,
      order.clientMunicipality,
      (order.packages as any[]).length.toString(),
      order.isCOD ? 'Sí' : 'No',
      order.isCOD ? formatAmount(order.codExpectedAmount) : '',
      order.isCOD && order.status === 'DELIVERED'
        ? formatAmount(order.codCollectedAmount)
        : '',
      formatAmount(order.shippingCost),
      order.isCOD ? formatAmount(order.codCommission) : '',
      order.isCOD && order.status === 'DELIVERED'
        ? formatAmount(order.settlementAmount)
        : '',
      order.status === 'DELIVERED' ? formatDate(order.deliveredAt) : '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csv;
  }

  async exportExcel(userId: string, query: QueryOrdersDto): Promise<Buffer> {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
    const where: any = { userId };

    // Si hay IDs específicos, filtrar solo por esos (ignorar otros filtros)
    if (query.ids) {
      const idsArray = query.ids.split(',').map((id) => id.trim());
      where.id = { in: idsArray };
    } else {
      // Aplicar filtros normales solo si no hay IDs específicos
      if (query.status) {
        const statuses = query.status.split(',').map((s) => s.trim());
        where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
      }

      if (query.fromDate || query.toDate) {
        where.createdAt = {};
        if (query.fromDate) {
          where.createdAt.gte = parseStartOfDayUtc(query.fromDate);
        }
        if (query.toDate) {
          where.createdAt.lte = parseEndOfDayUtc(query.toDate);
        }
      }

      if (query.isCOD !== undefined) {
        where.isCOD = query.isCOD === 'true';
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */

    // Crear workbook y worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Órdenes');

    // Definir columnas
    worksheet.columns = [
      { header: 'No. Orden', key: 'orderNo', width: 12 },
      { header: 'Fecha Creación', key: 'createdAt', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Cliente', key: 'client', width: 25 },
      { header: 'Teléfono', key: 'phone', width: 15 },
      { header: 'Departamento', key: 'department', width: 18 },
      { header: 'Municipio', key: 'municipality', width: 18 },
      { header: 'Paquetes', key: 'packages', width: 10 },
      { header: 'COD', key: 'isCOD', width: 8 },
      { header: 'Monto Esperado', key: 'expectedAmount', width: 15 },
      { header: 'Monto Cobrado', key: 'collectedAmount', width: 15 },
      { header: 'Costo Envío', key: 'shippingCost', width: 15 },
      { header: 'Comisión', key: 'commission', width: 12 },
      { header: 'Liquidación', key: 'settlement', width: 15 },
      { header: 'Fecha Entrega', key: 'deliveredAt', width: 15 },
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };

    // Traducir estados
    const translateStatus = (status: string): string => {
      const translations: Record<string, string> = {
        PENDING: 'Pendiente',
        IN_TRANSIT: 'En Tránsito',
        DELIVERED: 'Entregado',
        CANCELLED: 'Cancelado',
      };
      return translations[status] || status;
    };

    const formatDateLocal = (date: Date | null | undefined): string => {
      if (!date) return '';
      return formatDate(date, 'es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    // Agregar datos
    orders.forEach((order) => {
      worksheet.addRow({
        orderNo: order.id.slice(-6).toUpperCase(),
        createdAt: formatDate(order.createdAt),
        status: translateStatus(order.status),
        client: order.clientName,
        phone: order.clientPhone,
        department: order.clientDepartment,
        municipality: order.clientMunicipality,
        packages: (order.packages as any[]).length,
        isCOD: order.isCOD ? 'Sí' : 'No',
        expectedAmount: order.isCOD ? order.codExpectedAmount : null,
        collectedAmount:
          order.isCOD && order.status === 'DELIVERED'
            ? order.codCollectedAmount
            : null,
        shippingCost: order.shippingCost,
        commission: order.isCOD ? order.codCommission : null,
        settlement:
          order.isCOD && order.status === 'DELIVERED'
            ? order.settlementAmount
            : null,
        deliveredAt: order.status === 'DELIVERED' ? formatDate(order.deliveredAt) : '',
      });
    });

    // Formato de moneda para columnas 10-14 (Monto Esperado, Monto Cobrado, Costo Envío, Comisión, Liquidación)
    [10, 11, 12, 13, 14].forEach((colNum) => {
      worksheet.getColumn(colNum).numFmt = '"$"#,##0.00';
    });

    // Congelar primera fila
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Bordes para todas las celdas
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Generar buffer
    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
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

    // Use local Chromium in development, @sparticuz/chromium in production
    const isProduction = process.env.NODE_ENV === 'production';

    const browser = isProduction
      ? await puppeteerCore.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(),
          headless: true,
        })
      : await puppeteerFull.launch({
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

  async getSettlementBalance(userId: string): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        userId,
        status: 'DELIVERED',
        isCOD: true,
      },
      _sum: {
        settlementAmount: true,
      },
    });

    return result._sum.settlementAmount || 0;
  }

  private async getShippingCostForDate(date: Date): Promise<number> {
    // Get day of week (0-6, Sunday-Saturday) from the scheduled date in UTC
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 6 = Saturday

    const cost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek },
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
