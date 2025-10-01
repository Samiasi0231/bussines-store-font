import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CACLookupQueryDTO } from './dtos/cac.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @UseGuards(JwtAuthGuard)
  @Get('cac/lookup')
  async lookupCACDetails(@Query() query: CACLookupQueryDTO) {
    return this.businessService.lookupCACDetails(query.regNumber);
  }
}
