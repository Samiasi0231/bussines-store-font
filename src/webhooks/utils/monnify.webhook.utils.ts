import { MonnifyEventType } from "../dtos/monnify.webhook.dto";

export interface MonnifyEventDataCustomer {
  email: string;
  name?: string;
}

export interface MonnifyEventDataProduct {
  reference: string;
  type: string;
}

export interface MonnifyEventDataTransferReceived {
  product: MonnifyEventDataProduct;
  transactionReference: string;
  paymentReference: string;
  paidOn: string;
  externalMandateReference?: string;
  paymentDescription: string;
  metaData: any;
  paymentSourceInformation: any;
  destinationAccountInformation: any;
  amountPaid: number;
  totalPayable: number;
  cardDetails: any;
  paymentMethod: string;
  currency: string;
  settlementAmount: string;
  paymentStatus: string;
  customer: MonnifyEventDataCustomer;
}

export interface MonnifyWebhookPayload {
  eventType: MonnifyEventType;
  eventData: MonnifyEventDataTransferReceived;
}
