import { Injectable } from '@nestjs/common';
import { UserProfile } from '../interfaces/user.interface';

@Injectable()
export class UserSanitizer {
  constructor() {}

  formatUserProfileData(data: UserProfile): UserProfile {
    return {
      firstName: data.firstName,
      id: data.id,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      avatar: data.avatar,
    };
  }
}
