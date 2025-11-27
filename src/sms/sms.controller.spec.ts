import { Test, TestingModule } from '@nestjs/testing';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

describe('SmsController', () => {
  let controller: SmsController;
  let service: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsController],
      providers: [
        {
          provide: SmsService,
          useValue: {
            sendOtp: jest.fn().mockResolvedValue({ success: true }),
          },
        },
      ],
    }).compile();

    controller = module.get<SmsController>(SmsController);
    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should send OTP', async () => {
    const result = await controller.sendOtp({ recipients: ['+2349095609847'] });
    expect(result).toEqual({ success: true });
    expect(service.sendOtp).toHaveBeenCalledWith(['+2349095609847']);
  });
});
