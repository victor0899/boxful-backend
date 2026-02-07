import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackageDto {
  @ApiProperty({ example: 'Caja de zapatos' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0.1)
  height: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0.1)
  width: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @Min(0.1)
  length: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  // Nuevos campos
  @ApiProperty({ example: 'Col. Escalón, Calle Principal #123' })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiPropertyOptional({ example: '2026-02-10T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '503' })
  @IsString()
  @IsNotEmpty()
  phoneCode: string;

  @ApiProperty({ example: '78901234' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'Llamar antes de llegar' })
  @IsString()
  @IsOptional()
  instructions?: string;

  // Campos existentes
  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @ApiProperty({ example: 'Col. San Benito, Calle La Reforma #456' })
  @IsString()
  @IsNotEmpty()
  clientAddress: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  @IsNotEmpty()
  clientDepartment: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  @IsNotEmpty()
  clientMunicipality: string;

  @ApiPropertyOptional({ example: 'Frente al parque central' })
  @IsString()
  @IsOptional()
  clientReference?: string;

  @ApiProperty({ type: [PackageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages: PackageDto[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isCOD?: boolean;

  @ApiPropertyOptional({ example: 50.0 })
  @IsNumber()
  @IsOptional()
  codExpectedAmount?: number;
}
