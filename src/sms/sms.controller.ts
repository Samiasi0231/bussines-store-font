import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendOtpDto } from './dto/send-otp.dto';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.smsService.sendOtp(dto.recipients);
  }
}
