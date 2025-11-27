import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import config from '../@common/config/app.config';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class SmsService {
  private readonly baseUrl: string;
  private readonly authToken: string;
  private readonly senderId: string;
  private readonly userId: string;
  private readonly otpTtl: number;
  private readonly otpLength: number;

  constructor(private redisService: RedisService) {
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
  async sendOtp(recipients: string[]) {
    if (!recipients || recipients.length === 0) {
      throw new HttpException('Recipients cannot be empty', HttpStatus.BAD_REQUEST);
    }

    const otp = this.generateOtp();

    await this.redisService.set(`otp:${recipients[0]}`, otp, this.otpTtl);

    const messageText = `Your Bizvantage OTP is ${otp}. It expires in ${this.otpTtl / 60} minutes.`;

    const payload = {
      recipients,
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
        response: response.data,
      };
    } catch (error: any) {
      console.error('SMS sending error:', error.response ?? error);

      const statusCode = Number(error.response?.status) || HttpStatus.INTERNAL_SERVER_ERROR;

      let errMessage = 'Failed to send SMS';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errMessage = error.response.data;
        } else if (error.response.data.message) {
          errMessage = error.response.data.message;
        } else {
          errMessage = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errMessage = error.message;
      }

      throw new HttpException(errMessage, statusCode);
    }
  }
}
