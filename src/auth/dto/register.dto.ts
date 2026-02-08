import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotFutureDate } from './validators/is-not-future-date.validator';

export class RegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'M', enum: ['M', 'F', 'O'] })
  @IsString()
  @IsIn(['M', 'F', 'O'])
  gender: string;

  @ApiProperty({ example: '1990-01-15' })
  @IsDateString()
  @IsNotFutureDate()
  birthDate: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+503' })
  @IsString()
  @IsNotEmpty()
  whatsappCode: string;

  @ApiProperty({ example: '70001234' })
  @IsString()
  @IsNotEmpty()
  whatsappNumber: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
