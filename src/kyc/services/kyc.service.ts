import { HttpStatus, Injectable, Logger } from '@nestjs/common';
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
import { ImageRecognitionService } from '../../image-recognition/services/image-recognition.service';
import { KycRepository } from '../../repositories/kyc.repository';
import { Tier } from '../../@common/constants/tier.constant';
import { DbTransactionManager } from '../../@common/database/database-transaction.manager';
import { WalletService } from '../../wallet/wallet.service';
import { AddressVerificationDTO } from '../dtos/address.dto';
import { AddressRepository } from '../../repositories/address.repository';
import { EmailService } from '../../notification/services/email.service';
import { EmailTemplate } from '../../@common/constants/email.constant';
import {
  DefaultProviderConfig,
  SystemSettingsService,
} from '../../system-settings/system-settings.service';
import { CacheService } from '../../@common/cache/cache.service';
import { DEFAULT_PROVIDER_RESPONSE_CACHE_TTL } from '../../@common/constants/cache.constant';

@Injectable()
export class KycService {
  private readonly logger: Logger;
  private _identityProviderName: Provider;
  private isProduction: boolean;

  constructor(
    private readonly dojahService: DojahService,
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
    private readonly userRepository: UserRepository,
    private readonly identityVerificationRepository: IdentityVerificationRepository,
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly kycRepository: KycRepository,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly walletService: WalletService,
    private readonly addressRepository: AddressRepository,
    private readonly emailService: EmailService,
    private readonly systemSettingsSevice: SystemSettingsService,
    private readonly cacheService: CacheService,
  ) {
    this.logger = new Logger(KycService.name);
    this.isProduction = Util.isProduction();
  }

  public get identityProvider(): IIdentityService {
    let provider: IIdentityService;
    switch (this.identityProviderName) {
      case Provider.DOJAH:
        provider = this.dojahService;
        break;
      default:
        provider = this.dojahService;
        break;
    }

    return provider;
  }

  public get identityProviderName(): Provider {
    this._identityProviderName = this.systemSettingsSevice.getDefaultProvider(
      DefaultProviderConfig.IDENTITY,
    );
    return this._identityProviderName;
  }



  // async verifyIdentity(
  //   payload: VerifyIdentityDTO & { userId: UUID },
  // ): Promise<
  //   IResponse<
  //     | Record<string, never>
  //     | null
  //     | VerifyBvnResponseData
  //     | VerifyNINResponseData
  //   >
  // > {
  //   let providerResponse: IResponse<
  //     VerifyBvnResponseData | VerifyNINResponseData
  //   >;
  //   const { type, userId, idNumber, image: userImage } = payload;

  //   const user = await this.userRepository.findById(userId);

  //   if (!user)
  //     return this.responseService.sendError(
  //       ErrorMessage.USER_NOT_FOUND,
  //       {},
  //       HttpStatus.NOT_FOUND,
  //     );

  //   const kyc = await this.kycRepository.findByUserId(userId);

  //   if (
  //     type === IdentityVerificationType.BVN &&
  //     kyc.bvnVerificationStatus === Status.VERIFIED
  //   )
  //     return this.responseService.sendError(ErrorMessage.ALREADY_VERIFIED_BVN);

  //   if (
  //     type !== IdentityVerificationType.BVN &&
  //     kyc.identityVerificationStatus === Status.VERIFIED
  //   )
  //     return this.responseService.sendError(
  //       ErrorMessage.ALREADY_VERIFIED_IDENTITY,
  //     );

  //   switch (type) {
  //     case IdentityVerificationType.BVN:
  //       providerResponse = await this.cacheService.remember(
  //         `BVN:${idNumber}`,
  //         DEFAULT_PROVIDER_RESPONSE_CACHE_TTL,
  //         () =>
  //           this.identityProvider.verifyBVN({
  //             bvn: idNumber,
  //           }),
  //       );
  //       break;
  //     case IdentityVerificationType.NIN:
  //       providerResponse = await this.cacheService.remember(
  //         `NIN:${idNumber}`,
  //         DEFAULT_PROVIDER_RESPONSE_CACHE_TTL,
  //         () =>
  //           this.identityProvider.verifyNIN({
  //             nin: idNumber,
  //           }),
  //       );
  //       break;
  //   }

  //   const baseIdentityVerificationData = {
  //     provider: this.identityProviderName,
  //     type,
  //     verificationData: { document_number: idNumber },
  //     user: userId as UUID,
  //     providerResponse: providerResponse.data?.providerResponse,
  //   };

  //   if (!providerResponse.success) {
  //     await this.identityVerificationRepository.createStrict({
  //       ...baseIdentityVerificationData,
  //       status: Status.FAILED,
  //     });
  //     return this.responseService.sendError(
  //       providerResponse.message,
  //       null,
  //       providerResponse.status,
  //     );
  //   }

  //   const responseData = providerResponse.data;

  //   const userData = {
  //     firstName: user.firstName,
  //     lastName: user.lastName,
  //     otherName: user.otherName,
  //     dateOfBirth: dayjs(user.dateOfBirth).format('YYYY-MM-DD'),
  //   };

  //   const providerResponseData = {
  //     firstName: responseData.firstName,
  //     lastName: responseData.lastName,
  //     dateOfBirth: dayjs(responseData.dateOfBirth).format('YYYY-MM-DD'),
  //     otherName: responseData.middleName,
  //   };

  //   const identityValidation = this.validateIdentity(
  //     userData,
  //     providerResponseData,
  //   );

  //   // Calculate verification score with weights
  //   const VERIFICATION_WEIGHTS = {
  //     firstName: 30,
  //     lastName: 35,
  //     middleName: 10,
  //     dateOfBirth: 25,
  //   };

  //   const MINIMUM_VERIFICATION_SCORE = 85;

  //   let verificationScore = 0;
  //   const scoreBreakdown: Record<string, { matched: boolean; weight: number }> = {};

  //   // First name check (20%)
  //   const firstNameMatch = identityValidation.namesStatus === Status.VERIFIED;
  //   if (firstNameMatch) {
  //     verificationScore += VERIFICATION_WEIGHTS.firstName;
  //   }
  //   scoreBreakdown.firstName = {
  //     matched: firstNameMatch,
  //     weight: VERIFICATION_WEIGHTS.firstName
  //   };

  //   // Last name check (20%)
  //   const lastNameMatch =
  //     userData.lastName?.toLowerCase().trim() ===
  //     providerResponseData.lastName?.toLowerCase().trim();
  //   if (lastNameMatch) {
  //     verificationScore += VERIFICATION_WEIGHTS.lastName;
  //   }
  //   scoreBreakdown.lastName = {
  //     matched: lastNameMatch,
  //     weight: VERIFICATION_WEIGHTS.lastName
  //   };

  //   // Middle name check (10%)
  //   const middleNameMatch =
  //     userData.otherName?.toLowerCase().trim() ===
  //     providerResponseData.otherName?.toLowerCase().trim();
  //   if (middleNameMatch) {
  //     verificationScore += VERIFICATION_WEIGHTS.middleName;
  //   }
  //   scoreBreakdown.middleName = {
  //     matched: middleNameMatch,
  //     weight: VERIFICATION_WEIGHTS.middleName
  //   };

  //   // Date of birth check (50%)
  //   const dobMatch = identityValidation.dateOfBirthStatus === Status.VERIFIED;
  //   if (dobMatch) {
  //     verificationScore += VERIFICATION_WEIGHTS.dateOfBirth;
  //   }
  //   scoreBreakdown.dateOfBirth = {
  //     matched: dobMatch,
  //     weight: VERIFICATION_WEIGHTS.dateOfBirth
  //   };

  //   console.log('Verification Score Breakdown:', scoreBreakdown);
  //   console.log('Total Verification Score:', verificationScore);
  //   console.log('Minimum Required Score:', MINIMUM_VERIFICATION_SCORE);

  //   // Check if verification score meets minimum threshold
  //   if (verificationScore < MINIMUM_VERIFICATION_SCORE) {
  //     const failedFields: string[] = [];

  //     if (!firstNameMatch) failedFields.push('First Name');
  //     if (!lastNameMatch) failedFields.push('Last Name');
  //     if (!middleNameMatch) failedFields.push('Middle Name');
  //     if (!dobMatch) failedFields.push('Date of Birth');

  //     await this.identityVerificationRepository.createStrict({
  //       ...baseIdentityVerificationData,
  //       status: Status.FAILED,
  //       invalidData: {

  //         name: {
  //           expected: {
  //             firstName: userData.firstName,
  //             otherName: userData.otherName,
  //             lastName: userData.lastName,
  //           },
  //           provided: {
  //             firstName: responseData.firstName,
  //             otherName: responseData.middleName,
  //             lastName: responseData.lastName,
  //           },
  //         },
  //         dateOfBirth: {
  //           expected: userData.dateOfBirth,
  //           provided: providerResponseData.dateOfBirth,
  //         },
  //       },
  //     });

  //     return this.responseService.sendError(
  //       `Identity verification failed. Verification score: ${verificationScore}% (minimum required: ${MINIMUM_VERIFICATION_SCORE}%). Failed fields: ${failedFields.join(', ')}`,
  //       null,
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   const response = await this.dbTransactionManager.transaction<
  //     IResponse<null>
  //   >(async (manager) => {
  //     const entityManager = manager.entityManager;

  //     let kyc = await this.kycRepository.withManager(entityManager).findOne({
  //       where: { user: userId },
  //       lock: { mode: 'pessimistic_write' },
  //     });

  //     if (!kyc)
  //       kyc = await this.kycRepository
  //         .withManager(entityManager)
  //         .createStrict({ user: userId });

  //     await this.identityVerificationRepository
  //       .withManager(entityManager)
  //       .createStrict({
  //         ...baseIdentityVerificationData,
  //         status: Status.VERIFIED,
  //       });

  //     // ============================================
  //     // FACE VERIFICATION SECTION - POSSIBLE TIMEOUT
  //     // ============================================
  //     // TODO: This section might be timing out. Consider:
  //     // 1. Adding timeout handling
  //     // 2. Making it async/background job
  //     // 3. Implementing retry logic
  //     // 4. Adding progress updates
  //     // ============================================
  //     if (type === IdentityVerificationType.BVN) {
  //       const providerImage = responseData.imageBase64;

  //       // ⚠️ POTENTIAL TIMEOUT: Face verification can take time
  //       // Consider adding timeout wrapper: Promise.race([faceVerification, timeoutPromise])
  //       const faceComparisonResponse = await this.verifyFace(
  //         userImage,
  //         providerImage,
  //         userId,
  //       );

  //       const baseFaceVerificationData = {
  //         provider: faceComparisonResponse.data?.provider,
  //         type: IdentityVerificationType.BIOMETRICS_FACE,
  //         verificationData: { image: userImage },
  //         user: userId as UUID,
  //         invalidData: {
  //           face: { expected: providerImage, provided: userImage },
  //         },
  //         providerResponse: faceComparisonResponse.data
  //           ?.providerResponse as any,
  //       };

  //       if (!faceComparisonResponse.success) {
  //         await this.identityVerificationRepository
  //           .withManager(entityManager)
  //           .createStrict({
  //             ...baseFaceVerificationData,
  //             status: Status.FAILED,
  //           });
  //         return this.responseService.sendError(faceComparisonResponse.message);
  //       }

  //       await this.identityVerificationRepository
  //         .withManager(entityManager)
  //         .createStrict({
  //           ...baseFaceVerificationData,
  //           status: Status.VERIFIED,
  //         });

  //       await this.kycRepository
  //         .withManager(entityManager)
  //         .findbyIdAndUpdate(kyc.id, {
  //           faceVerificationStatus: Status.VERIFIED,
  //         });
  //     }
  //     // ============================================

  //     if (type === IdentityVerificationType.BVN)
  //       await this.kycRepository
  //         .withManager(entityManager)
  //         .findbyIdAndUpdate(kyc.id, {
  //           bvn: idNumber,
  //           bvnVerificationStatus: Status.VERIFIED,
  //         });
  //     else
  //       await this.kycRepository
  //         .withManager(entityManager)
  //         .findbyIdAndUpdate(kyc.id, {
  //           identityDocumentNumber: idNumber,
  //           identityVerificationStatus: Status.VERIFIED,
  //           identityVerificationType: type,
  //         });

  //     const updatedKyc = await this.kycRepository
  //       .withManager(entityManager)
  //       .findById(kyc.id);

  //     const canUpgradeToTierTwo =
  //       user.isProfileComplete &&
  //       [
  //         updatedKyc.bvnVerificationStatus,
  //         updatedKyc.faceVerificationStatus,
  //         updatedKyc.identityVerificationStatus,
  //       ].every((status) => status === Status.VERIFIED);

  //     if (canUpgradeToTierTwo) {
  //       const tier = Tier.TWO;
  //       await this.kycRepository
  //         .withManager(entityManager)
  //         .findbyIdAndUpdate(kyc.id, {
  //           tier,
  //         });

  //       await this.walletService.setWalletLimits({
  //         userId,
  //         entityManager,
  //         tier,
  //       });
  //     }

  //     return this.responseService.sendSuccess(
  //       SuccessMessage.GENERIC_IDENTITY_VERIFICATION,
  //     );
  //   });

  //   return response;
  // }


  async verifyIdentity(
    payload: VerifyIdentityDTO & { userId: UUID },
  ): Promise<
    IResponse<
      | Record<string, never>
      | null
      | VerifyBvnResponseData
      | VerifyNINResponseData
    >
  > {
    let providerResponse: IResponse<
      VerifyBvnResponseData | VerifyNINResponseData
    >;
    const { type, userId, idNumber } = payload; // Removed image parameter

    this.logger.log(
      `Starting identity verification - Type: ${type}, UserId: ${userId}, DocumentNumber: ${idNumber?.substring(0, 3)}***`,
    );

    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.warn(`User not found for identity verification - UserId: ${userId}`);
      return this.responseService.sendError(
        ErrorMessage.USER_NOT_FOUND,
        {},
        HttpStatus.NOT_FOUND,
      );
    }

    const kyc = await this.kycRepository.findByUserId(userId);

    if (
      type === IdentityVerificationType.BVN &&
      kyc.bvnVerificationStatus === Status.VERIFIED
    ) {
      this.logger.warn(`BVN already verified for user - UserId: ${userId}`);
      return this.responseService.sendError(ErrorMessage.ALREADY_VERIFIED_BVN);
    }

    if (
      type !== IdentityVerificationType.BVN &&
      kyc.identityVerificationStatus === Status.VERIFIED
    ) {
      this.logger.warn(`Identity already verified for user - UserId: ${userId}, Type: ${type}`);
      return this.responseService.sendError(
        ErrorMessage.ALREADY_VERIFIED_IDENTITY,
      );
    }

    this.logger.log(`Calling identity provider - Type: ${type}, Provider: ${this.identityProviderName}`);
    const providerStartTime = Date.now();

    switch (type) {
      case IdentityVerificationType.BVN:
        providerResponse = await this.cacheService.remember(
          `BVN:${idNumber}`,
          DEFAULT_PROVIDER_RESPONSE_CACHE_TTL,
          () => {
            this.logger.log(`Calling Dojah BVN verification API for BVN: ${idNumber?.substring(0, 3)}***`);
            return this.identityProvider.verifyBVN({
              bvn: idNumber,
            });
          },
        );
        break;
      case IdentityVerificationType.NIN:
        providerResponse = await this.cacheService.remember(
          `NIN:${idNumber}`,
          DEFAULT_PROVIDER_RESPONSE_CACHE_TTL,
          () => {
            this.logger.log(`Calling Dojah NIN verification API for NIN: ${idNumber?.substring(0, 3)}***`);
            return this.identityProvider.verifyNIN({
              nin: idNumber,
            });
          },
        );
        break;
    }

    const providerDuration = Date.now() - providerStartTime;
    this.logger.log(
      `Provider response received - Type: ${type}, Success: ${providerResponse.success}, Duration: ${providerDuration}ms`,
    );

    const baseIdentityVerificationData = {
      provider: this.identityProviderName,
      type,
      verificationData: { document_number: idNumber },
      user: userId as UUID,
      providerResponse: providerResponse.data?.providerResponse,
    };

    if (!providerResponse.success) {
      this.logger.error(
        `Provider verification failed - Type: ${type}, UserId: ${userId}, Message: ${providerResponse.message}, Status: ${providerResponse.status}`,
      );
      await this.identityVerificationRepository.createStrict({
        ...baseIdentityVerificationData,
        status: Status.FAILED,
      });
      return this.responseService.sendError(
        providerResponse.message,
        null,
        providerResponse.status,
      );
    }

    const responseData = providerResponse.data;

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      otherName: user.otherName,
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

    // Calculate verification score with weights
    const VERIFICATION_WEIGHTS = {
      firstName: 30,
      lastName: 35,
      middleName: 10,
      dateOfBirth: 25,
    };

    const MINIMUM_VERIFICATION_SCORE = 85;

    let verificationScore = 0;
    const scoreBreakdown: Record<string, { matched: boolean; weight: number }> = {};

    // First name check (20%)
    const firstNameMatch = identityValidation.namesStatus === Status.VERIFIED;
    if (firstNameMatch) {
      verificationScore += VERIFICATION_WEIGHTS.firstName;
    }
    scoreBreakdown.firstName = {
      matched: firstNameMatch,
      weight: VERIFICATION_WEIGHTS.firstName
    };

    // Last name check (20%)
    const lastNameMatch =
      userData.lastName?.toLowerCase().trim() ===
      providerResponseData.lastName?.toLowerCase().trim();
    if (lastNameMatch) {
      verificationScore += VERIFICATION_WEIGHTS.lastName;
    }
    scoreBreakdown.lastName = {
      matched: lastNameMatch,
      weight: VERIFICATION_WEIGHTS.lastName
    };

    // Middle name check (10%)
    const middleNameMatch =
      userData.otherName?.toLowerCase().trim() ===
      providerResponseData.otherName?.toLowerCase().trim();
    if (middleNameMatch) {
      verificationScore += VERIFICATION_WEIGHTS.middleName;
    }
    scoreBreakdown.middleName = {
      matched: middleNameMatch,
      weight: VERIFICATION_WEIGHTS.middleName
    };

    // Date of birth check (50%)
    const dobMatch = identityValidation.dateOfBirthStatus === Status.VERIFIED;
    if (dobMatch) {
      verificationScore += VERIFICATION_WEIGHTS.dateOfBirth;
    }
    scoreBreakdown.dateOfBirth = {
      matched: dobMatch,
      weight: VERIFICATION_WEIGHTS.dateOfBirth
    };

    this.logger.log(
      `Identity validation completed - Type: ${type}, UserId: ${userId}, Score: ${verificationScore}%, Minimum: ${MINIMUM_VERIFICATION_SCORE}%`,
      { scoreBreakdown },
    );

    // Check if verification score meets minimum threshold
    if (verificationScore < MINIMUM_VERIFICATION_SCORE) {
      const failedFields: string[] = [];

      if (!firstNameMatch) failedFields.push('First Name');
      if (!lastNameMatch) failedFields.push('Last Name');
      if (!middleNameMatch) failedFields.push('Middle Name');
      if (!dobMatch) failedFields.push('Date of Birth');

      this.logger.warn(
        `Identity verification failed - Type: ${type}, UserId: ${userId}, Score: ${verificationScore}%, FailedFields: ${failedFields.join(', ')}`,
        {
          userData,
          providerResponseData,
          scoreBreakdown,
        },
      );

      await this.identityVerificationRepository.createStrict({
        ...baseIdentityVerificationData,
        status: Status.FAILED,
        invalidData: {
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
          dateOfBirth: {
            expected: userData.dateOfBirth,
            provided: providerResponseData.dateOfBirth,
          },
        },
      });

      return this.responseService.sendError(
        `Identity verification failed. Verification score: ${verificationScore}% (minimum required: ${MINIMUM_VERIFICATION_SCORE}%). Failed fields: ${failedFields.join(', ')}`,
        null,
        HttpStatus.BAD_REQUEST,
      );
    }

    const response = await this.dbTransactionManager.transaction<
      IResponse<null>
    >(async (manager) => {
      const entityManager = manager.entityManager;

      let kyc = await this.kycRepository.withManager(entityManager).findOne({
        where: { user: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!kyc)
        kyc = await this.kycRepository
          .withManager(entityManager)
          .createStrict({ user: userId });

      await this.identityVerificationRepository
        .withManager(entityManager)
        .createStrict({
          ...baseIdentityVerificationData,
          status: Status.VERIFIED,
        });

      // BVN verification logic (without face verification)
      if (type === IdentityVerificationType.BVN) {
        this.logger.log(
          `Updating BVN in database - UserId: ${userId}, KYCId: ${kyc.id}, BVN: ${idNumber?.substring(0, 3)}***`,
        );
        await this.kycRepository
          .withManager(entityManager)
          .findbyIdAndUpdate(kyc.id, {
            bvn: idNumber,
            bvnVerificationStatus: Status.VERIFIED,
          });
        this.logger.log(`BVN successfully updated and verified - UserId: ${userId}`);
      } else {
        // NIN or other identity verification
        this.logger.log(
          `Updating identity document in database - UserId: ${userId}, KYCId: ${kyc.id}, Type: ${type}, DocumentNumber: ${idNumber?.substring(0, 3)}***`,
        );
        await this.kycRepository
          .withManager(entityManager)
          .findbyIdAndUpdate(kyc.id, {
            identityDocumentNumber: idNumber,
            identityVerificationStatus: Status.VERIFIED,
            identityVerificationType: type,
          });
        this.logger.log(`Identity document successfully updated and verified - UserId: ${userId}, Type: ${type}`);
      }

      const updatedKyc = await this.kycRepository
        .withManager(entityManager)
        .findById(kyc.id);

      // Updated tier upgrade logic (removed faceVerificationStatus check)
      const canUpgradeToTierTwo =
        user.isProfileComplete &&
        [
          updatedKyc.bvnVerificationStatus,
          updatedKyc.identityVerificationStatus,
        ].every((status) => status === Status.VERIFIED);

      if (canUpgradeToTierTwo) {
        const tier = Tier.TWO;
        this.logger.log(`Upgrading user to Tier ${tier} - UserId: ${userId}`);
        await this.kycRepository
          .withManager(entityManager)
          .findbyIdAndUpdate(kyc.id, {
            tier,
          });

        await this.walletService.setWalletLimits({
          userId,
          entityManager,
          tier,
        });
        this.logger.log(`User successfully upgraded to Tier ${tier} - UserId: ${userId}`);
      }

      this.logger.log(
        `Identity verification completed successfully - Type: ${type}, UserId: ${userId}`,
      );

      return this.responseService.sendSuccess(
        SuccessMessage.GENERIC_IDENTITY_VERIFICATION,
      );
    });

    return response;
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
    if (!this.isProduction && userData.dateOfBirth !== '2000-01-01') {
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

  async verifyFace(
    sourceImage: string,
    targetImage: string,
    userId: UUID | string,
  ) {
    const faceComparisonResponse =
      await this.imageRecognitionService.compareFaces(sourceImage, targetImage);

    const baseIdentityVerificationData = {
      provider: this.identityProviderName,
      type: IdentityVerificationType.BIOMETRICS_FACE,
      verificationData: { image: sourceImage },
      user: userId as UUID,
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

  async submitAddress(data: { userId: string } & AddressVerificationDTO) {
    const {
      state,
      street,
      lga,
      country,
      city,
      buildingNumber,
      utilityBill,
      userId,
      utilityBillType,
    } = data;

    await this.dbTransactionManager.transaction(async (manager) => {
      const entityManager = manager.entityManager;
      let kyc = await this.kycRepository
        .withManager(entityManager)
        .findByUserId(userId as UUID, { lock: { mode: 'pessimistic_write' } });

      if (!kyc)
        kyc = await this.kycRepository.createStrict({ user: userId as UUID });

      await this.addressRepository.withManager(entityManager).createStrict({
        lga,
        buildingNumber,
        city,
        state,
        street,
        country,
        user: userId as UUID,
        kycId: kyc.id,
        utilityBill,
        utilityBillType,
      });

      await this.identityVerificationRepository
        .withManager(entityManager)
        .createStrict({
          type: IdentityVerificationType.ADDRESS,
          verificationData: { utilityBill },
          user: userId as UUID,
        });

      manager.on('committed', () => {
        const adminEmail = this.configService.get<string>('appEmail.address');

        this.emailService.sendEmailWithTemplate({
          templateKey:
            EmailTemplate.ADMIN_NOTIFICATION_FOR_ADDRESS_VERIFICATION,
          email: adminEmail,
          context: { userId },
        });
      });
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }
}
