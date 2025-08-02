import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ProductUsageService } from './product-usage.service';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiQuery,
} from '@nestjs/swagger';
import { UsageType } from './usage-type.enum';

@ApiTags('Product Usage')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductUsageController {
    constructor(private readonly usage: ProductUsageService) {}

    @Get(':id/usage-history')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'List usage history for product' })
    @ApiResponse({ status: 200 })
    @ApiQuery({ name: 'usageType', required: false, enum: UsageType })
    list(
        @Param('id') id: string,
        @Query('usageType') usageType?: UsageType,
    ) {
        return this.usage.findForProduct(Number(id), usageType);
    }
}
