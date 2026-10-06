import { registerAs } from '@nestjs/config';
export const THORTLLER_CONFIG = 'throttler';
export default registerAs(THORTLLER_CONFIG, () => ({
  ttl: parseInt(process.env.THROTTLE_TTL_MS ?? '1000', 10),

  limit: parseInt(process.env.THROTTLE_LIMIT ?? '60', 10),
}));
