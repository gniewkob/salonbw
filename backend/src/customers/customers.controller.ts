import {
    Body,
    Controller,
    Get,
    Param,
    NotFoundException,
    UseGuards,
    ParseIntPipe,
    Request,
    Put,
    Patch,
    Delete,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { UpdateCustomerDto } from '../users/dto/update-customer.dto';
import { UpdateMarketingConsentDto } from './dto/update-marketing-consent.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @Get()
    @Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
    @ApiOperation({ summary: 'List customers' })
    @ApiResponse({ status: 200 })
    async list() {
        return this.service.findAll();
    }

    @Get('me')
    @Roles(Role.Client)
    @ApiOperation({ summary: 'Get own customer profile' })
    @ApiResponse({ status: 200 })
    async getMe(@Request() req) {
        const customer = await this.service.findOne(req.user.id);
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }

    @Put('me')
    @Roles(Role.Client)
    @ApiOperation({ summary: 'Update own customer profile' })
    @ApiResponse({ status: 200 })
    async updateMe(@Request() req, @Body() dto: UpdateCustomerDto) {
        return this.service.updateProfile(req.user.id, dto);
    }

    @Get(':id')
    @Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Get customer by id' })
    @ApiResponse({ status: 200 })
    async get(@Param('id', ParseIntPipe) id: number) {
        const customer = await this.service.findOne(id);
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }

    @Patch(':id/activate')
    @Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Activate customer account' })
    @ApiResponse({ status: 200 })
    async activate(@Param('id', ParseIntPipe) id: number) {
        const customer = await this.service.setActive(id, true);
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }

    @Patch(':id/deactivate')
    @Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Deactivate customer account' })
    @ApiResponse({ status: 200 })
    async deactivate(@Param('id', ParseIntPipe) id: number) {
        const customer = await this.service.setActive(id, false);
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }

    @Patch(':id/marketing-consent')
    @Roles(Role.Admin, EmployeeRole.RECEPTIONIST)
    @ApiOperation({ summary: 'Update customer marketing consent' })
    @ApiResponse({ status: 200 })
    async updateMarketingConsent(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMarketingConsentDto,
    ) {
        const customer = await this.service.updateMarketingConsent(
            id,
            dto.marketingConsent,
        );
        if (!customer) {
            throw new NotFoundException();
        }
        return customer;
    }

    @Delete('me')
    @Roles(Role.Client)
    @ApiOperation({ summary: 'Request account deletion' })
    @ApiResponse({ status: 200 })
    async removeMe(@Request() req) {
        await this.service.forgetMe(req.user.id);
        return { success: true };
    }
}
