import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServiceResponse } from './common/utilities/response.utility';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ServiceResponse<null> {
    return this.appService.getHello();
  }
}
