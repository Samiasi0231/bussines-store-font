export const SystemSettingKey = {
  PROVIDERS: 'providers',
  DEFAULT_PRODUCT_COLLECTIONS: 'default-product-collections',
} as const;

export type SystemSettingKey =
  (typeof SystemSettingKey)[keyof typeof SystemSettingKey];
