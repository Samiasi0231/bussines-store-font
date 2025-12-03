export default () => ({
  db: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    connectionString: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '5', 10),
    retryDelay: parseInt(process.env.DB_RETRY_DELAY || '3000', 10), 
    synchronize: process.env.DB_SYNCHRONIZE === 'true', 
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  dojah: {
    baseUrl: process.env.DOJAH_BASE_URL,
    headers: {
      Authorization: process.env.DOJAH_API_KEY,
      AppId: process.env.DOJAH_APP_ID,
    },
    urls: {
      nin: '/v1/kyc/nin?nin=',
      bvn: '/v1/kyc/bvn/full?bvn=',
      cac: '/v1/kyc/cac/basic?rc_number=',
    },
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_BUCKET_NAME,
    defaultFolder: process.env.UPLOAD_DEFAULT_FOLDER || 'uploads',
    maxFileSize: parseInt(process.env.MAX_UPLOAD_FILE_SIZE, 10) || 52428800,
  },
  smtp: {
    password: process.env.SMTP_PASSWORD,
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    port: process.env.SMTP_PORT,
    service: process.env.SMTP_SERVICE,
  },
  appEmail: {
    name: process.env.SENDER_EMAIL_NAME,
    address: process.env.SENDER_EMAIL_ADDRESS,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  vasBb: {
    baseUrl: process.env.VAS_BB_BASE_URL || 'https://vas.broadbased.net',
    authToken: process.env.VAS_BB_AUTH_TOKEN || '',
    senderId: process.env.VAS_BB_SENDER_ID || '',
    userId: process.env.VAS_BB_USER_ID || '',
  },
  rmq: {
    url: process.env.RMQ_URL,
  },
  otp: {
    ttlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
    length: Number(process.env.OTP_LENGTH || 6),
  },
  cache: {
    type: process.env.CACHE_TYPE || 'memory', 
    redis: {
      enabled: process.env.REDIS_ENABLED === 'true',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  },
  queue: {
    type: process.env.QUEUE_TYPE || 'memory', 
    rabbitmq: {
      enabled: process.env.RABBITMQ_ENABLED === 'true',
    },
  },
});
