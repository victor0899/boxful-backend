import {
  IsOptional,
  IsString,
  IsNumberString,
  IsBooleanString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryOrdersDto {
  @ApiPropertyOptional({ example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'María' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsBooleanString()
  isCOD?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description:
      'Campo por el cual ordenar (clientName, clientDepartment, clientMunicipality, createdAt, status)',
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'clientName',
    'clientDepartment',
    'clientMunicipality',
    'createdAt',
    'status',
  ])
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Dirección del ordenamiento (asc o desc)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    example: 'abc123,def456,ghi789',
    description: 'IDs específicos de órdenes separados por coma',
  })
  @IsOptional()
  @IsString()
  ids?: string;
}
