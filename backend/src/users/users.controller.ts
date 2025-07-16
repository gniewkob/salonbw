import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    Delete,
    Param,
    Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from './role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

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

    @Patch('customers/:id')
    @Roles(EmployeeRole.RECEPCJA, EmployeeRole.ADMIN, Role.Admin)
    updateCustomer(@Param('id') id: number, @Body() dto: UpdateCustomerDto) {
        return this.usersService.updateCustomer(Number(id), dto);
    }

    @Delete('customers/:id')
    @Roles(Role.Admin)
    removeCustomer(@Param('id') id: number, @Request() req) {
        return this.usersService.removeCustomer(Number(id), req.user.id);
    }

    @Delete('employees/:id')
    @Roles(Role.Admin)
    removeEmployee(@Param('id') id: number, @Request() req) {
        return this.usersService.removeEmployee(Number(id), req.user.id);
    }
}
