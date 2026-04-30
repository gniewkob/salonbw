import { Module, DynamicModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthSocialController } from './auth-social.controller';
import { SocialAuthService } from './social-auth.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';

@Module({})
export class AuthSocialModule {
    static register(): DynamicModule {
        const providers: Array<any> = [SocialAuthService];

        // Conditionally register strategies based on env vars
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
        const facebookId = process.env.FACEBOOK_APP_ID;
        const facebookSecret = process.env.FACEBOOK_APP_SECRET;

        if (googleClientId && googleSecret) {
            providers.push(GoogleStrategy);
        }

        if (facebookId && facebookSecret) {
            providers.push(FacebookStrategy);
        }

        return {
            module: AuthSocialModule,
            imports: [
                PassportModule.register({ defaultStrategy: 'jwt' }),
                UsersModule,
                AuthModule,
            ],
            controllers: [AuthSocialController],
            providers: providers,
            exports: [SocialAuthService],
        };
    }
}
