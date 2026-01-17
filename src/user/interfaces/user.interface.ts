import { UUID } from 'crypto';
import { Tier } from '../../@common/constants/tier.constant';
import { Gender } from '../../@common/constants/gender.constant';
import { AdminRole } from '../../@common/constants/role.constant';
import { AdminPermission } from '../../@common/constants/permission.constant';

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
  roles?: AdminRole[];
  permissions?: AdminPermission[];
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
  roles?: AdminRole[];
  permissions?: AdminPermission[];
}
