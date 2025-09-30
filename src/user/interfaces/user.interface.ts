import { UUID } from 'crypto';
import { Tier } from '../../@common/constants/tier.constant';
import { Gender } from '../../@common/constants/gender.constant';

export interface UserProfile {
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  id: UUID;
  isProfileComplete: boolean;
  bvnVerified: boolean;
  nonBvnIdentityDocumentVerified: boolean;
  identityVerified: boolean;
  tier: Tier;
  addressVerified: boolean;
  gender: Gender;
  phoneVerified: boolean;
  emailVerified: boolean;
}

export interface CachedUserProfileData extends UserProfile {
  hashedAccessToken: string;
}

export interface UserDataForProfile {
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  id: UUID;
  gender: Gender;
  phoneVerifiedAt: Date;
  emailVerifiedAt: Date;
  isProfileComplete: boolean;
}
