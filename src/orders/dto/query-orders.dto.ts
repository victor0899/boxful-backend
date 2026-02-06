import { IsOptional, IsString, IsNumberString, IsBooleanString } from 'class-validator';
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
}
