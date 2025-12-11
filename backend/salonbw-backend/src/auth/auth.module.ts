import { Module, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { CsrfMiddleware } from './csrf.middleware';
import { LoginAttempt } from './login-attempt.entity';
import { LoginAttemptsService } from './login-attempts.service';
import { RefreshToken } from './refresh-token.entity';

@Module({
    imports: [
        PassportModule,
        TypeOrmModule.forFeature([LoginAttempt, RefreshToken]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');
                void refreshSecret;
                return {
                    secret: config.get<string>('JWT_SECRET'),
                    signOptions: { expiresIn: '1h' },
                };
            },
        }),
        UsersModule,
        LogsModule,
    ],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        RefreshJwtStrategy,
        LoginAttemptsService,
    ],
    controllers: [AuthController],
    exports: [AuthService, UsersModule],
})
export class AuthModule {
    configure(consumer: MiddlewareConsumer) {
        // Protect all routes with CSRF middleware
        consumer.apply(CsrfMiddleware).forRoutes('*');
    }
}
