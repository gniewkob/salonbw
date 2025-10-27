import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto } from './dto/create-sale.dto';
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
        return this.retail.getSalesSummary({ from: fromDate, to: toDate });
    }
}
