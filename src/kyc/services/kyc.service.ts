import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IIdentityService } from '../interfaces/IIdentity.service';
import { ConfigService } from '@nestjs/config';
import { Provider } from '../../@common/constants/providers.constant';
import { DojahService } from './dojah.service';
import { IResponse, ResponseService } from '../../@common/response';
import { Util } from '../../@common/utilities/helpers.utility';
import {
  ErrorMessage,
  SuccessMessage,
} from '../../@common/constants/message.constant';
import { UserRepository } from '../../repositories/user.repository';
import {
  IdentityVerificationType,
  VerifyBvnResponseData,
  VerifyIdentityDTO,
  VerifyNINResponseData,
} from '../dtos/identity.dto';
import { UUID } from 'crypto';
import dayjs from 'dayjs';
import { Status } from '../../@common/constants/status.constant';
import { IdentityVerificationRepository } from '../../repositories/identity-verification.repository';
import { User } from '../../entities/user.entity';
import { ImageRecognitionService } from '../../image-recognition/services/image-recognition.service';
import { KycRepository } from '../../repositories/kyc.repository';
import { Tier } from '../../@common/constants/tier.constant';

@Injectable()
export class KycService {
  private readonly logger: Logger;
  private identityProvider: IIdentityService;
  private identityProviderName: Provider;
  private isProduction: boolean;

  constructor(
    private readonly dojahService: DojahService,
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
    private readonly userRepository: UserRepository,
    private readonly identityVerificationRepository: IdentityVerificationRepository,
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly kycRepository: KycRepository,
  ) {
    this.logger = new Logger(KycService.name);
    //TODO: move to system settings
    this.identityProviderName = this.configService.get<Provider>(
      'IDENTITY_PROVIDER',
      Provider.DOJAH,
    );
    this.identityProvider = this.getIdentityProvider();
    this.isProduction = Util.isProduction();
  }

  private getIdentityProvider(): IIdentityService {
    let provider: IIdentityService;
    switch (this.identityProviderName) {
      case Provider.DOJAH:
        provider = this.dojahService;
        break;
      default:
        ///TODO: log error
        throw new BadRequestException(ErrorMessage.AN_ERROR_OCCURRED);
    }

    return provider;
  }

  async verifyIdentity(
    payload: VerifyIdentityDTO & { userId: UUID },
  ): Promise<
    IResponse<
      Record<string, never> | VerifyBvnResponseData | VerifyNINResponseData
    >
  > {
    let response: IResponse<VerifyBvnResponseData | VerifyNINResponseData>;
    const { type, userId, idNumber, image: userImage } = payload;

    const user = await this.userRepository.findById(userId);

    if (!user)
      return this.responseService.sendError(
        ErrorMessage.USER_NOT_FOUND,
        {},
        HttpStatus.NOT_FOUND,
      );

    switch (type) {
      case IdentityVerificationType.BVN:
        response = await this.identityProvider.verifyBVN({ bvn: idNumber });
        break;
      case IdentityVerificationType.NIN:
        response = await this.identityProvider.verifyNIN({ nin: idNumber });
        break;
    }

    const baseIdentityVerificationData = {
      provider: this.identityProviderName,
      type,
      verificationData: { document_number: idNumber },
      user: { id: userId } as User,
      providerResponse: response.data?.providerResponse,
    };

    if (!response.success) {
      await this.identityVerificationRepository.createStrict({
        ...baseIdentityVerificationData,
        status: Status.FAILED,
      });
      return response;
    }

    const responseData = response.data;

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      otherName: user.otherName,
      phone: user.phoneNumber,
      dateOfBirth: dayjs(user.dateOfBirth).format('YYYY-MM-DD'),
    };

    const providerResponseData = {
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      dateOfBirth: dayjs(responseData.dateOfBirth).format('YYYY-MM-DD'),
      otherName: responseData.middleName,
    };

    const identityValidation = this.validateIdentity(
      userData,
      providerResponseData,
    );

    const namesMismatch = identityValidation.namesStatus !== Status.VERIFIED;
    const dobMismatch =
      identityValidation.dateOfBirthStatus !== Status.VERIFIED;

    if (namesMismatch || dobMismatch) {
      await this.identityVerificationRepository.createStrict({
        ...baseIdentityVerificationData,
        status: Status.FAILED,
        invalidData: {
          ...(namesMismatch && {
            name: {
              expected: {
                firstName: userData.firstName,
                otherName: userData.otherName,
                lastName: userData.lastName,
              },
              provided: {
                firstName: responseData.firstName,
                otherName: responseData.middleName,
                lastName: responseData.lastName,
              },
            },
          }),
          ...(dobMismatch && {
            dateOfBirth: {
              expected: userData.dateOfBirth,
              provided: providerResponseData.dateOfBirth,
            },
          }),
        },
      });

      if (namesMismatch && dobMismatch)
        return this.responseService.sendError(
          ErrorMessage.IDENTITY_VERIFICATION_NAMES_AND_DOB_MISMATCH,
        );

      if (dobMismatch)
        return this.responseService.sendError(
          ErrorMessage.IDENTITY_VERIFICATION_DOB_MISMATCH,
        );

      if (namesMismatch)
        return this.responseService.sendError(
          ErrorMessage.IDENTITY_VERIFICATION_NAMES_MISMATCH,
        );
    }

    await this.identityVerificationRepository.createStrict({
      ...baseIdentityVerificationData,
      status: Status.VERIFIED,
    });

    const providerImage = responseData.imageBase64;
    const faceComparisonResponse = await this.verifyFace(
      userImage,
      providerImage,
      user,
    );

    if (!faceComparisonResponse.success)
      return this.responseService.sendError(faceComparisonResponse.message);

    let kyc = await this.kycRepository.findOne({
      where: { user: userId },
    });

    if (!kyc) kyc = await this.kycRepository.createStrict({ user: userId });

    const canUpgradeToTierOne =
      kyc.isProfileComplete &&
      [
        kyc.bvnVerificationStatus,
        kyc.faceVerificationStatus,
        kyc.identityVerificationStatus,
      ].every((status) => status === Status.VERIFIED);

    let tier = kyc.tier;

    if (canUpgradeToTierOne) tier = Tier.ONE;

    if (type === IdentityVerificationType.BVN)
      await this.kycRepository.findbyIdAndUpdate(kyc.id, {
        bvn: idNumber,
        bvnVerificationStatus: Status.VERIFIED,
        faceVerificationStatus: Status.VERIFIED,
        tier,
      });
    else
      await this.kycRepository.findbyIdAndUpdate(kyc.id, {
        identityDocumentNumber: idNumber,
        identityVerificationStatus: Status.VERIFIED,
        identityVerificationType: type,
        faceVerificationStatus: Status.VERIFIED,
        tier,
      });

    return this.responseService.sendSuccess(
      SuccessMessage.GENERIC_IDENTITY_VERIFICATION,
    );
  }

  validateIdentity(
    userData: {
      firstName: string;
      lastName: string;
      otherName?: string;
      dateOfBirth: string;
    },
    providerResponse: {
      firstName: string;
      lastName: string;
      otherName?: string;
      dateOfBirth: string;
    },
  ): {
    namesStatus: Status;
    dateOfBirthStatus: Status;
  } {
    if (!this.isProduction) {
      return {
        namesStatus: Status.VERIFIED,
        dateOfBirthStatus: Status.VERIFIED,
      };
    }

    const allUserNames = [
      userData.firstName?.trim()?.toLowerCase(),
      userData.lastName?.trim()?.toLowerCase(),
      ...(userData.otherName ? [userData.otherName?.trim().toLowerCase()] : []),
    ].filter((name) => !!name);

    const userDateOfBirth = userData.dateOfBirth;

    const allProviderNames = [
      providerResponse.firstName?.trim()?.toLowerCase(),
      providerResponse.lastName?.trim()?.toLowerCase(),
      ...(providerResponse.otherName
        ? [providerResponse.otherName?.trim()?.toLowerCase()]
        : []),
    ].filter((name) => !!name);

    const providerDateOfBirth = providerResponse.dateOfBirth;

    const response = {
      // check that each of the provider names are in the user identity data
      namesStatus: allUserNames.every((name) => allProviderNames.includes(name))
        ? Status.VERIFIED
        : Status.FAILED,
      dateOfBirthStatus:
        providerDateOfBirth === userDateOfBirth
          ? Status.VERIFIED
          : Status.FAILED,
    };

    return response;
  }

  async verifyFace(sourceImage: string, targetImage: string, user: User) {
    const faceComparisonResponse =
      await this.imageRecognitionService.compareFaces(sourceImage, targetImage);

    const baseIdentityVerificationData = {
      provider: this.identityProviderName,
      type: IdentityVerificationType.BIOMETRICS_FACE,
      verificationData: { image: sourceImage },
      user: { id: user.id } as User,
      providerResponse: faceComparisonResponse.data
        ?.providerResponse as unknown as Record<string, unknown>,
    };

    if (!faceComparisonResponse.success) {
      await this.identityVerificationRepository.createStrict({
        ...baseIdentityVerificationData,
        invalidData: { face: { expected: sourceImage, provided: targetImage } },
        status: Status.FAILED,
      });

      return faceComparisonResponse;
    }

    await this.identityVerificationRepository.createStrict({
      ...baseIdentityVerificationData,
      status: Status.VERIFIED,
    });

    return faceComparisonResponse;
  }
}
