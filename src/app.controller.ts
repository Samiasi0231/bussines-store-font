import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IResponse } from './@common/response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): IResponse<null> {
    return this.appService.getHello();
  }
}
