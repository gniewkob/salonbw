import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET ?? 'secret',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
