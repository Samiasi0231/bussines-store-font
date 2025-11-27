import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { Tier } from '../../@common/constants/tier.constant';
import { Gender } from '../../@common/constants/gender.constant';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: UUID;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+2348012345678' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Avatar URL or base64', example: 'data:image/png;base64,...' })
  avatar?: string;

  @ApiProperty({ description: 'User tier', enum: Tier, example: Tier.ZERO })
  tier: Tier;

  @ApiProperty({ description: 'BVN verification status', example: true })
  bvnVerified: boolean;

  @ApiProperty({ description: 'Non-BVN identity document verification status', example: false })
  nonBvnIdentityDocumentVerified: boolean;

  @ApiProperty({ description: 'Identity verification status', example: true })
  identityVerified: boolean;

  @ApiProperty({ description: 'Profile completion status', example: true })
  isProfileComplete: boolean;

  @ApiProperty({ description: 'Address verification status', example: false })
  addressVerified: boolean;

  @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.MALE })
  gender: Gender;

  @ApiProperty({ description: 'Phone verification status', example: true })
  phoneVerified: boolean;

  @ApiProperty({ description: 'Email verification status', example: true })
  emailVerified: boolean;
}

export class AddressResponseDto {
  @ApiProperty({ description: 'Address ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: UUID;

  @ApiProperty({ description: 'Street address', example: '123 Main Street' })
  street: string;

  @ApiProperty({ description: 'City', example: 'Lagos' })
  city: string;

  @ApiProperty({ description: 'State', example: 'Lagos' })
  state: string;

  @ApiProperty({ description: 'Country', example: 'Nigeria' })
  country: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '100001' })
  postalCode?: string;

  @ApiProperty({ description: 'Is this the default address?', example: true })
  isDefault: boolean;
}

