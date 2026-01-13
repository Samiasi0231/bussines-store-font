import { Injectable } from '@nestjs/common';
import {
  CachedUserProfileData,
  UserDataForProfile,
  UserProfile,
} from '../interfaces/user.interface';
import { Kyc } from '../../entities/kyc.entity';
import { Status } from '../../@common/constants/status.constant';

@Injectable()
export class UserSanitizer {
  constructor() {}

  formatUserProfileData(userData: UserDataForProfile, kyc: Kyc): UserProfile {
    return {
      firstName: userData.firstName,
      id: userData.id,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      avatar: userData.avatar,
      tier: kyc.tier,
      bvnVerified: kyc.bvnVerificationStatus === Status.VERIFIED,
      nonBvnIdentityDocumentVerified:
        kyc.identityVerificationStatus === Status.VERIFIED,
      identityVerified: kyc.identityVerificationStatus === Status.VERIFIED,
      isProfileComplete: userData.isProfileComplete,
      addressVerified: kyc.addressVerificationStatus === Status.VERIFIED,
      gender: userData.gender,
      phoneVerified: !!userData.phoneVerifiedAt,
      emailVerified: !!userData.emailVerifiedAt,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
    };
  }

  sanitizeCachedUserData(data: CachedUserProfileData): UserProfile {
    delete data.hashedAccessToken;
    return data;
  }
}
