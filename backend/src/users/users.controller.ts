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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from './role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

interface AuthRequest {
    user: { id: number };
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create a new user (admin only)' })
    @ApiResponse({ status: 201, description: 'User created' })
    create(@Body() createUserDto: CreateUserDto) {
        const { email, password, name, role } = createUserDto;
        return this.usersService.createUser(email, password, name, role);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200 })
    async getProfile(@Request() req) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const user = await this.usersService.findOne(req.user.id);
        if (!user) {
            return {};
        }
        const { password: _p, refreshToken: _r, ...result } = user as any;
        return result;
    }

    @Patch('customers/:id')
    @Roles(EmployeeRole.RECEPCJA, EmployeeRole.ADMIN, Role.Admin)
    @ApiOperation({ summary: 'Update customer data' })
    @ApiResponse({ status: 200 })
    updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
         
        return this.usersService.updateCustomer(Number(id), dto);
    }

    @Delete('customers/:id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete customer' })
    @ApiResponse({ status: 200 })
    removeCustomer(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
         
        return this.usersService.removeCustomer(Number(id), req.user.id);
    }

    @Delete('employees/:id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete employee' })
    @ApiResponse({ status: 200 })
    removeEmployee(
        @Param('id') id: string,
        @Request() req: AuthRequest,
    ) {
         
        return this.usersService.removeEmployee(Number(id), req.user.id);
    }
}
