import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import type { Response } from 'express';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva orden de envío' })
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes con filtros y paginación' })
  findAll(@Req() req: any, @Query() query: QueryOrdersDto) {
    return this.ordersService.findAll(req.user.userId, query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar órdenes a CSV' })
  async exportCsv(@Req() req: any, @Res() res: Response) {
    const csv = await this.ordersService.exportCsv(req.user.userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ordenes.csv');
    res.send(csv);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generar PDF de una orden' })
  async generatePdf(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.ordersService.generatePdf(req.user.userId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="orden-${id.slice(-6)}.pdf"`,
    );
    res.send(pdf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una orden' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.userId, id);
  }
}
