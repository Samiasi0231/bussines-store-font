import { Test, TestingModule } from '@nestjs/testing';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

describe('SmsController', () => {
  let controller: SmsController;
  let service: SmsService;

  beforeEach(async () => {
    const mockSmsService = {
      sendOtp: jest.fn().mockResolvedValue({ success: true }),
      verifyOtp: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsController],
      providers: [
        {
          provide: SmsService,
          useValue: mockSmsService,
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
    const dto = { recipient: '+2349095609847', purpose: 'registration' };

    const result = await controller.sendOtp(dto);

    expect(result).toEqual({ success: true });
    expect(service.sendOtp).toHaveBeenCalledWith(
      dto.recipient,
      dto.purpose,
    );
  });

  it('should verify OTP', async () => {
    const dto = {
      phoneNumber: '+2349095609847',
      otp: '1234',
      purpose: 'wallet',
    };

    const result = await controller.verifyOtp(dto);

    expect(result).toEqual({ success: true });
    expect(service.verifyOtp).toHaveBeenCalledWith(
      dto.phoneNumber,
      dto.otp,
      dto.purpose,
    );
  });
});
