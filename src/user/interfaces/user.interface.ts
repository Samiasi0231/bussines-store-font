import { UUID } from 'crypto';

export interface UserProfile {
  phoneNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  id: UUID;
}

export interface CachedUserProfileData extends UserProfile {
  containsCompleteData?: boolean;
  hashedAccessToken: string;
}
