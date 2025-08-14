import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { LogsModule } from '../logs/logs.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        PassportModule,
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
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService, UsersModule],
})
export class AuthModule {}
