export interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  setAndKeepTTL(key: string, value: any): Promise<void>;
  exists(key: string): Promise<boolean>;
  remember<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>;
  getOrSet<T>(
    key: string,
    ttl: number,
    valueOrFn: T | (() => Promise<T>),
  ): Promise<T>;
}

