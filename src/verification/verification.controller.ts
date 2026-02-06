import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('send-code')
  @ApiOperation({ summary: 'Enviar código de verificación por email' })
  sendCode(@Body() dto: SendCodeDto) {
    return this.verificationService.sendVerificationCode(dto.email);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'Verificar código de email' })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.verificationService.verifyCode(dto.email, dto.code);
  }
}
