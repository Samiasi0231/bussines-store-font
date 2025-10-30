import { Test, TestingModule } from '@nestjs/testing';
import { StoreFrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

describe('StoreFrontController', () => {
  let controller: StoreFrontController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreFrontController],
      providers: [StorefrontService],
    }).compile();

    controller = module.get<StoreFrontController>(StoreFrontController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
