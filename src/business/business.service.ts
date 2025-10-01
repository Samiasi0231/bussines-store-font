import { Injectable } from '@nestjs/common';
import { KycService } from '../kyc/services/kyc.service';
import { ResponseService } from '../@common/response';

@Injectable()
export class BusinessService {
  constructor(
    private readonly kycService: KycService,
    private readonly responseService: ResponseService,
  ) {}

  async lookupCACDetails(regNumber: string) {
    const response =
      await this.kycService.identityProvider.lookupCAC(regNumber);

    if (!response.success)
      return this.responseService.sendError(
        response.message,
        null,
        response.status,
      );

    return response;
  }
}
