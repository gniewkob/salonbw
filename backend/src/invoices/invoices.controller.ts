import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class InvoicesController {
    constructor(private readonly service: InvoicesService) {}

    @Get()
    @ApiOperation({ summary: 'List invoices' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Post('generate/:reservationId')
    @ApiOperation({ summary: 'Generate invoice for reservation' })
    @ApiResponse({ status: 201 })
    generate(@Param('reservationId') id: number) {
        return this.service.generate(Number(id));
    }

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Get invoice PDF' })
    @ApiResponse({ status: 200 })
    getPdf(@Param('id') id: number) {
        return this.service.getPdf(Number(id));
    }
}
