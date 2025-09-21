import { Environment } from '../constants/environment.constant';
import argon2 from 'argon2';

export class Util {
  static isProduction(): boolean {
    return Environment.PRODUCTION === String(process.env.ENV).toLowerCase();
  }

  static hash(value: string): Promise<string> {
    return argon2.hash(value);
  }

  /**
   * Asynchronously tests a value[password] against a hash.
   * @param  hash     Hash to test against
   * @param  value value to test
   *
   * @return Promise, boolean
   */

  static async verifyHash(hash: string, value: string): Promise<boolean> {
    return argon2.verify(hash, value);
  }
}
