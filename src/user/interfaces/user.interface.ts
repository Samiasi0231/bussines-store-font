import { UUID } from 'crypto';
import { Tier } from '../../@common/constants/tier.constant';

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
}

export interface CachedUserProfileData extends UserProfile {
  hashedAccessToken: string;
}

export interface UserDataForProfile {
  phoneNumber: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatar: string;
  id: UUID;
}
