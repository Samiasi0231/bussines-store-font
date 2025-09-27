import { IsBase64, IsIn, IsString, ValidateIf } from 'class-validator';
import { Gender } from '../../@common/constants/gender.constant';
import { Transform } from 'class-transformer';

export enum IdentityVerificationType {
  BVN = 'bvn',
  NIN = 'nin',
  ADDRESS = 'address',
  BIOMETRICS_FACE = 'biometrics_face',
}

export enum VerificationType {}

export class VerifyIdentityDTO {
  @IsString()
  idNumber: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsIn(
    Object.values(IdentityVerificationType).filter(
      (type) => type !== IdentityVerificationType.BIOMETRICS_FACE,
    ),
  )
  type: IdentityVerificationType;

  @ValidateIf((object) => object.type !== IdentityVerificationType.BVN)
  @IsBase64()
  image: string;
}

export type VerifyBvnRequest = {
  bvn: string;
};

export type VerifyNINRequest = {
  nin: string;
};

export type BaseIdentityVerificationResponseData = {
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  imageBase64?: string;
  gender: Gender;
  providerResponse: Record<string, unknown>;
};

export type VerifyBvnResponseData = BaseIdentityVerificationResponseData & {
  bvn: string;
};

export type VerifyNINResponseData = BaseIdentityVerificationResponseData & {
  nin: string;
};
