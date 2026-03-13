import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ReverseSaleDto } from './dto/reverse-sale.dto';
import { RetailService } from './retail.service';
import { User } from '../users/user.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('retail')
@Controller('sales')
export class SalesController {
    constructor(private readonly retail: RetailService) {}
    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a product sale' })
    @ApiResponse({
        status: 201,
        description: 'Sale recorded (or stock adjusted)',
    })
    createSale(
        @Body() dto: CreateSaleDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.createSale(dto, { id: user.userId } as User);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List warehouse sales' })
    @ApiResponse({ status: 200, description: 'Warehouse sales list' })
    findSales() {
        return this.retail.listSales();
    }

    @Get('summary')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Sales summary for a period' })
    @ApiQuery({ name: 'from', required: false, description: 'ISO date' })
    @ApiQuery({ name: 'to', required: false, description: 'ISO date' })
    @ApiResponse({
        status: 200,
        description: 'Aggregated units and revenue if available',
    })
    getSummary(@Query('from') from?: string, @Query('to') to?: string) {
        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;
        if (fromDate && isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid from date');
        }
        if (toDate && isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid to date');
        }
        return this.retail.getSalesSummary({ from: fromDate, to: toDate });
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get warehouse sale details' })
    @ApiResponse({ status: 200, description: 'Warehouse sale details' })
    findSale(@Param('id', ParseIntPipe) id: number) {
        return this.retail.getSaleDetails(id);
    }

    @Post(':id/void')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Void a sale by creating a full reversal entry' })
    voidSale(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReverseSaleDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.voidSale(id, dto, { id: user.userId } as User);
    }

    @Post(':id/refund')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Refund selected sale lines by creating a reversal entry',
    })
    refundSale(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReverseSaleDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.refundSale(id, dto, { id: user.userId } as User);
    }

    @Post(':id/correction')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Create a correction entry for selected sale lines',
    })
    correctSale(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReverseSaleDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.correctSale(id, dto, { id: user.userId } as User);
    }
}
