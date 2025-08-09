import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request as ExpressRequest } from 'express';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private readonly jwtService: JwtService) {}

    @UseGuards(AuthGuard('local'))
    @Post('login')
    login(@Request() req: ExpressRequest & { user: Omit<User, 'password'> }) {
        const payload = { sub: req.user.id, role: req.user.role };
        return { access_token: this.jwtService.sign(payload) };
    }
}
