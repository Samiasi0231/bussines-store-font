import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  InitiateVerificationDTO,
  VerifyVerificationDTO,
} from './dtos/verification.dto';
import { IResponse, ResponseService } from '../@common/response';
import { Verification } from '../entities/verification.entity';
import { VerificationRepository } from '../repositories/verification.repository';
import { Util } from '../@common/utilities/helpers.utility';
import { generate } from 'randomstring';
import { Status } from '../@common/constants/status.constant';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { ConfigService } from '@nestjs/config';
import {
  VerificationChannel,
  VerificationIntent,
} from '../@common/constants/verification.constant';
import { EmailTemplate } from '../@common/constants/email.constant';
import { EmailService } from '../notification/services/email.service';
import dayjs from 'dayjs';
import { UserService } from '../user/user.service';
import { UserRepository } from '../repositories/user.repository';
import { name } from 'ejs';
import { UUID } from 'crypto';

@Injectable()
export class VerificationService {
  private DEFAULT_VERIFICATION_EXPIRATION_TIME: number;

  constructor(
    private readonly verificationRepository: VerificationRepository,
    private readonly responseService: ResponseService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
  ) {
    //TODO: move to system settings
    this.DEFAULT_VERIFICATION_EXPIRATION_TIME = this.configService.get<number>(
      'DEFAULT_VERIFICATION_EXPIRATION_TIME',
      60 * 5,
    );
  }

  async initiateVerification(
    payload: InitiateVerificationDTO,
  ): Promise<IResponse<Partial<Verification>>> {
    const { intent, entityId, channel } = payload;

    const verificationCode = this.generateOTPCode();
    const hashedVerificationCode = await Util.hash(verificationCode);

    const durationInSeconds = this.DEFAULT_VERIFICATION_EXPIRATION_TIME;
    const durationInMinutes = durationInSeconds / 60;

    const verification = await this.verificationRepository.createStrict({
      entityId,
      status: Status.PENDING,
      channel,
      intent,
      verificationData: hashedVerificationCode,
      expiresAt: dayjs().add(durationInSeconds, 'seconds').toDate(),
    });

    switch (channel) {
      case VerificationChannel.EMAIL:
        let email: string;
        let name = '';
        if (
          [
            VerificationIntent.PASSWORD_RESET,
            VerificationIntent.EMAIL_ADDRESS,
          ].includes(intent)
        )
          email = entityId;

        this.sendEmail(intent, entityId, verificationCode, {
          duration: durationInMinutes,
          name,
        });
        break;
      default:
        break;
    }

    return this.responseService.sendSuccess(
      SuccessMessage.INITIATE_VERIFICATION,
      {
        id: verification.id,
      },
    );
  }

  async verifyVerification(data: VerifyVerificationDTO) {
    const { intent, entityId, verificationData } = data;

    const verification = await this.verificationRepository.findOne({
      where: { entityId, intent, status: Status.PENDING },
      order: { createdAt: 'desc' },
    });

    if (!verification)
      return this.responseService.sendError(ErrorMessage.INVALID_VERIFICATION);

    if (verification.expiresAt < new Date()) {
      await this.verificationRepository.delete(verification.id);

      return this.responseService.sendError(ErrorMessage.EXPIRED_VERIFICATION);
    }

    const compareVerifcationData = await Util.verifyHash(
      verification.verificationData,
      verificationData,
    );

    if (compareVerifcationData) {
      await this.verificationRepository.delete(verification.id);
      await this.processPostVerififcationTasks(intent, entityId);
      return this.responseService.sendSuccess(
        SuccessMessage.SUCCESSFUL_VERIFICATION,
      );
    } else
      return this.responseService.sendError(ErrorMessage.INVALID_VERIFICATION);
  }

  async processPostVerififcationTasks(
    intent: VerificationIntent,
    entityId: string,
  ) {
    switch (intent) {
      case VerificationIntent.EMAIL_ADDRESS:
        await this.userService.verifyEmail({ email: entityId });
        break;
      default:
        break;
    }
  }

  async sendEmail(
    intent: VerificationIntent,
    email: string,
    verificationData: string,
    data: Record<string, unknown>,
  ) {
    let templateKey: EmailTemplate;
    switch (intent) {
      case VerificationIntent.PASSWORD_RESET:
        templateKey = EmailTemplate.PASSWORD_RESET;
        break;
      default:
        templateKey = EmailTemplate.OTP;
        break;
    }

    this.emailService.sendEmailWithTemplate({
      templateKey,
      email,
      context: {
        otp: verificationData,
        name: data.name,
        duration: data.duration,
      },
    });
  }

  private generateOTPCode(length = 6): string {
    if (!Util.isProduction()) {
      return '000000';
    }

    return generate({
      length,
      charset: 'numeric',
    });
  }
}
