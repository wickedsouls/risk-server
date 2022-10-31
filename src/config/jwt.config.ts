import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { appConfig } from './app.config';

export const jwtConfig: JwtModuleAsyncOptions = {
  useFactory: () => {
    return {
      secret: appConfig().jwtKey,
      signOptions: { expiresIn: '3600s' },
    };
  },
};
