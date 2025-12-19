import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import config from '../@common/config/app.config';
import { CacheService } from '../@common/cache/cache.service';

@Injectable()
export class SmsService {
  private readonly baseUrl: string;
  private readonly authToken: string;
  private readonly senderId: string;
  private readonly userId: string;
  private readonly otpTtl: number;
  private readonly otpLength: number;

  constructor(private cacheService: CacheService) {
    const appConfig = config();
    const vasBb = appConfig.vasBb;

    this.baseUrl = vasBb.baseUrl;
    this.authToken = vasBb.authToken;
    this.senderId = vasBb.senderId;
    this.userId = vasBb.userId;

    this.otpTtl = appConfig.otp.ttlSeconds;
    this.otpLength = appConfig.otp.length;
  }

  private generateOtp(length = this.otpLength) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendOtp(recipient: string, purpose: string) {
    if (!recipient) {
      throw new HttpException('recipient cannot be empty', HttpStatus.BAD_REQUEST);
    }

    if (!purpose) {
      throw new HttpException('purpose is required', HttpStatus.BAD_REQUEST);
    }

    const otp = this.generateOtp();

    await this.cacheService.set(
      `otp:${recipient}:${purpose}`,
      otp,
      this.otpTtl,
    );

    const messageText = `Your OTP for ${purpose} is ${otp}. It expires in ${this.otpTtl / 60} minutes.`;

    const payload = {
      recipients: [recipient], 
      userId: this.userId,
      recipientInputMode: 'manual_input',
      message: messageText,
      messageType: 'promotional',
      senderId: this.senderId,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/smsModule/sms/send/singleMessage`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        message: 'OTP sent successfully',
        otp,
        purpose,
        response: response.data,
      };
    } catch (error: any) {
      console.error('SMS sending error:', error.response ?? error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to send SMS',
        error.response?.status || 500,
      );
    }
  }

  async verifyOtp(phoneNumber: string, otp: string, purpose: string) {
    const key = `otp:${phoneNumber}:${purpose}`;

    const storedOtp = await this.cacheService.get(key);

    if (!storedOtp) {
      throw new HttpException(
        'OTP expired or not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (storedOtp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    await this.cacheService.del(key);

    return {
      success: true,
      message: `${purpose} OTP verified successfully`,
    };
  }
}
