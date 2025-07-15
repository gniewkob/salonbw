import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        UsersModule,
        LogsModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'secret',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    controllers: [AuthController],
})
export class AuthModule {}
