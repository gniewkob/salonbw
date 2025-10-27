import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { RetailService } from './retail.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('retail')
@Controller('inventory')
export class InventoryController {
    constructor(private readonly retail: RetailService) {}
    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List inventory levels' })
    @ApiResponse({ status: 200, description: 'Current stock by product' })
    list() {
        return this.retail.getInventoryLevels();
    }
    @Post('adjust')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Adjust inventory (manual adjustment)' })
    @ApiResponse({ status: 200, description: 'Stock adjusted' })
    adjust(
        @Body() dto: AdjustInventoryDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.adjustInventory(dto, { id: user.userId } as User);
    }
}
