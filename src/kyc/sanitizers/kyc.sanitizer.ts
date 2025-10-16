import { Injectable } from '@nestjs/common';
import { Address } from '../../entities/address.entity';
import { UUID } from 'crypto';

export type AddressData = {
  id: UUID;
  buildingNumber: string;
  lga: string;
  state: string;
  street: string;
  city: string;
};

@Injectable()
export class KycSanitizer {
  constructor() {}

  formatAddress(address: Address): AddressData {
    return {
      id: address.id,
      buildingNumber: address.buildingNumber,
      lga: address.lga,
      state: address.state,
      street: address.street,
      city: address.city,
    };
  }
}
