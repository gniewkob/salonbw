import {
    Controller,
    Get,
    Param,
    Patch,
    UseGuards,
    ParseIntPipe,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all invoices (admin only)' })
    @ApiResponse({ status: 200, type: Invoice, isArray: true })
    findAll(): Promise<Invoice[]> {
        return this.invoicesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoices for current user' })
    @ApiResponse({ status: 200, type: Invoice, isArray: true })
    findMine(
        @CurrentUser() user: { userId: number },
    ): Promise<Invoice[]> {
        return this.invoicesService.findForClient(user.userId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get invoice by ID' })
    @ApiResponse({ status: 200, type: Invoice })
    @ApiResponse({ status: 404, description: 'Invoice not found' })
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<Invoice> {
        const invoice = await this.invoicesService.findOne(id);
        if (!invoice) {
            throw new NotFoundException();
        }
        // Non-admins can only view their own invoices
        if (user.role !== Role.Admin && invoice.client.id !== user.userId) {
            throw new NotFoundException();
        }
        return invoice;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id/paid')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark invoice as paid' })
    @ApiResponse({ status: 200, type: Invoice })
    async markAsPaid(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Invoice> {
        const invoice = await this.invoicesService.markAsPaid(id);
        if (!invoice) {
            throw new NotFoundException();
        }
        return invoice;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id/cancel')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel invoice' })
    @ApiResponse({ status: 200, type: Invoice })
    async cancel(@Param('id', ParseIntPipe) id: number): Promise<Invoice> {
        const invoice = await this.invoicesService.cancel(id);
        if (!invoice) {
            throw new NotFoundException();
        }
        return invoice;
    }
}
