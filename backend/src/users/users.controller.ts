import {
    Body,
    Controller,
    Get,
    Post,
    Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from './role.enum';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles(Role.Admin)
    create(@Body() createUserDto: CreateUserDto) {
        const { email, password, name, role } = createUserDto;
        return this.usersService.createUser(email, password, name, role);
    }

    @Get('profile')
    async getProfile(@Request() req) {
        const user = await this.usersService.findOne(req.user.id);
        if (!user) {
            return {};
        }
        const { password: _p, refreshToken: _r, ...result } = user as any;
        return result;
    }
}
