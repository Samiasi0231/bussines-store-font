import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { IResponse, ResponseService } from './@common/response';
import { HealthCheck } from '@nestjs/terminus';
import { SuccessMessage } from './@common/constants/message.constant';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  getHello(): IResponse<null> {
    return this.appService.getHello();
  }

  @Get('health')
  @HealthCheck()
  check() {
    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
    );
  }
}
