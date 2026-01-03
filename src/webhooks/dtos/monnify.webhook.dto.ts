import { IsEnum, IsNotEmpty} from 'class-validator';

export enum MonnifyEventType {
  SUCCESSFUL_TRANSACTION = 'SUCCESSFUL_TRANSACTION',
  FAILED_TRANSACTION = 'FAILED_TRANSACTION',
  REVERSED_TRANSACTION = 'REVERSED_TRANSACTION',
  OVERPAYMENT = 'OVERPAYMENT',
}

export class MonnifyWebhookDto {
  @IsEnum(MonnifyEventType)
  @IsNotEmpty()
  eventType: MonnifyEventType;

  @IsNotEmpty()
  eventData: any;
}
