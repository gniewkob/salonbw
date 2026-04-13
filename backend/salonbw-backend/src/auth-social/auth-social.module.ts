import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { SocialAuthService } from './social-auth.service';
import { AuthSocialController } from './auth-social.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        ObservabilityModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    providers: [
        SocialAuthService,
        GoogleStrategy,
        FacebookStrategy,
    ],
    controllers: [AuthSocialController],
    exports: [SocialAuthService],
})
export class AuthSocialModule {}
