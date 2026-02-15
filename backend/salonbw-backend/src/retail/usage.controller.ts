import {
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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { RetailService } from './retail.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { CreateUsageDto } from './dto/create-usage.dto';

@ApiTags('retail')
@Controller('usage')
export class UsageController {
    constructor(private readonly retail: RetailService) {}

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create product usage (material consumption)' })
    @ApiResponse({ status: 201, description: 'Usage recorded' })
    createUsage(
        @Body() dto: CreateUsageDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.retail.createUsage(dto, { id: user.userId } as User);
    }

    @Get('planned')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List planned product usage records' })
    @ApiResponse({ status: 200, description: 'Planned usage records' })
    findPlannedUsage() {
        return this.retail.listUsage('planned');
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List product usage records' })
    @ApiResponse({ status: 200, description: 'Usage records' })
    findUsageByScope(
        @Query('scope')
        scope?: 'all' | 'planned' | 'completed',
    ) {
        return this.retail.listUsage(scope ?? 'all');
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Employee, Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get usage details' })
    @ApiResponse({ status: 200, description: 'Usage details' })
    findOneUsage(@Param('id', ParseIntPipe) id: number) {
        return this.retail.getUsageDetails(id);
    }
}
