import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendOtpDto } from './dto/send-otp.dto';
import {VerifyOtpDto} from "./dto/verify-otp.dto"

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.smsService.sendOtp(dto.recipients);
  }
    @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.smsService.verifyOtp(dto.phoneNumber, dto.otp);
  }


}
