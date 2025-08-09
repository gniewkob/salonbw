import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('profile')
    async getProfile() {
        const user = await this.usersService.findByEmail('test@example.com');
        if (!user) {
            return { email: 'test@example.com', name: 'Test User' };
        }
        const { password, ...result } = user;
        return result;
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.createUser(createUserDto);
        const { password, ...result } = user;
        return result;
    }
}
