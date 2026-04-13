import {
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Body,
    UseGuards,
    ParseIntPipe,
    NotFoundException,
    Res,
    HttpStatus,
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
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { JpkService } from './jpk.service';
import { JpkExportDto, JpkSingleExportDto } from './dto/jpk-export.dto';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
    constructor(
        private readonly invoicesService: InvoicesService,
        private readonly jpkService: JpkService,
    ) {}

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
    findMine(@CurrentUser() user: { userId: number }): Promise<Invoice[]> {
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
    async markAsPaid(@Param('id', ParseIntPipe) id: number): Promise<Invoice> {
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

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post('jpk/export')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Export invoices to JPK FA (period)' })
    @ApiResponse({ status: 200, description: 'Returns JPK FA XML' })
    async exportJpkPeriod(
        @Body() dto: JpkExportDto,
        @Res() res: Response,
    ): Promise<void> {
        const xml = await this.jpkService.generateJpkFa(
            new Date(dto.startDate),
            new Date(dto.endDate),
            {
                nip: dto.nip,
                name: dto.companyName,
                email: dto.email,
                address: dto.address,
                taxOfficeCode: dto.taxOfficeCode,
            },
        );

        res.set({
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="JPK_FA_${dto.startDate}_${dto.endDate}.xml"`,
        });
        res.send(xml);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post(':id/jpk')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Export single invoice to JPK FA' })
    @ApiResponse({ status: 200, description: 'Returns JPK FA XML for single invoice' })
    async exportJpkSingle(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: JpkSingleExportDto,
        @Res() res: Response,
    ): Promise<void> {
        const xml = await this.jpkService.generateJpkFaForInvoice(id, {
            nip: dto.nip,
            name: dto.companyName,
            email: dto.email,
            address: dto.address,
            taxOfficeCode: dto.taxOfficeCode,
        });

        res.set({
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="JPK_FA_invoice_${id}.xml"`,
        });
        res.send(xml);
    }
}
