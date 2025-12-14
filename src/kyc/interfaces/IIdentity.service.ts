import { IResponse } from '../../@common/response';
import { CACLookupData } from '../dtos/cac.dto';
import {
  VerifyBvnRequest,
  VerifyBvnResponseData,
  VerifyNINRequest,
  VerifyNINResponseData,
} from '../dtos/identity.dto';

export abstract class IIdentityService {
  abstract verifyBVN(
    payload: VerifyBvnRequest,
  ): Promise<IResponse<VerifyBvnResponseData>>;

  abstract verifyNIN(
    payload: VerifyNINRequest,
  ): Promise<IResponse<VerifyNINResponseData>>;

  abstract lookupCAC(
    regNumber: string,
    companyType?: string,
  ): Promise<IResponse<CACLookupData>>;
}
