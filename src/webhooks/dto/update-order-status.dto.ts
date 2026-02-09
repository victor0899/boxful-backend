import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    example: 'DELIVERED',
    enum: ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsNumber()
  @IsOptional()
  codCollectedAmount?: number;
}
