import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from './role.enum';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    create(@Body() createUserDto: CreateUserDto) {
        const { email, password, name, role } = createUserDto;
        return this.usersService.createUser(email, password, name, role);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        const user = await this.usersService.findOne(req.user.id);
        if (!user) {
            return {};
        }
        const { password: _p, refreshToken: _r, ...result } = user as any;
        return result;
    }
}
