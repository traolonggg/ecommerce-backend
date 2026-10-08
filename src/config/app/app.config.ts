import { registerAs } from '@nestjs/config';
import { parseEnvOrigin } from 'src/share/helpers/parse-env-origins';

export const APP_CONFIG = 'app';
export default registerAs(APP_CONFIG, () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  corsOrigins: parseEnvOrigin(
    process.env.CLIENT_URL,
    process.env.CORS_OTHER_URL,
  ),
}));
