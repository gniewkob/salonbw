import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
    DefaultValuePipe,
    Res,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ReportsService } from './reports.service';
import { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
    constructor(private readonly service: ReportsService) {}

    @Get('financial')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get financial report' })
    @ApiResponse({ status: 200 })
    @ApiQuery({
        name: 'from',
        required: false,
        type: String,
        description: 'Start date in ISO format',
    })
    @ApiQuery({
        name: 'to',
        required: false,
        type: String,
        description: 'End date in ISO format',
    })
    financial(
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.service.getFinancial(from, to);
    }

    @Get('employee/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get employee report' })
    @ApiResponse({ status: 200 })
    @ApiQuery({
        name: 'from',
        required: false,
        type: String,
        description: 'Start date in ISO format',
    })
    @ApiQuery({
        name: 'to',
        required: false,
        type: String,
        description: 'End date in ISO format',
    })
    employee(
        @Param('id', ParseIntPipe) id: number,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.service.getEmployeeReport(id, from, to);
    }

    @Get('top-services')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get top services' })
    @ApiResponse({ status: 200 })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of services to return',
    })
    topServices(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.service.getTopServices(limit);
    }

    @Get('top-products')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get top products' })
    @ApiResponse({ status: 200 })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Maximum number of products to return',
    })
    topProducts(
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    ) {
        return this.service.getTopProducts(limit);
    }

    @Get('new-customers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get new customers report' })
    @ApiResponse({ status: 200 })
    @ApiQuery({
        name: 'from',
        required: false,
        type: String,
        description: 'Start date in ISO format',
    })
    @ApiQuery({
        name: 'to',
        required: false,
        type: String,
        description: 'End date in ISO format',
    })
    newCustomers(
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.service.getNewCustomers(from, to);
    }

    @Get('export/:type')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Export report' })
    @ApiResponse({ status: 200, description: 'CSV export' })
    @ApiParam({
        name: 'type',
        enum: ['financial', 'services', 'products', 'customers'],
        description: 'Type of report to export as CSV',
    })
    async export(@Param('type') type: string, @Res() res: Response) {
        const { fileName, csv } = await this.service.export(type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csv);
    }
}
