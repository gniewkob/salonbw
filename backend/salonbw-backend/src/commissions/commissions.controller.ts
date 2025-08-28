import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { Commission } from './commission.entity';
import { GetSummaryDto } from './dto/get-summary.dto';

@ApiTags('commissions')
@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommissionsController {
    constructor(private readonly commissionsService: CommissionsService) {}

    @Roles(Role.Employee, Role.Admin)
    @Get('commissions/me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commissions for current user' })
    @ApiResponse({ status: 200, type: Commission, isArray: true })
    findMine(@CurrentUser() user: { userId: number }): Promise<Commission[]> {
        return this.commissionsService.findForUser(user.userId);
    }

    @Roles(Role.Admin)
    @Get('commissions/employees/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commissions for employee' })
    @ApiResponse({ status: 200, type: Commission, isArray: true })
    findForEmployee(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Commission[]> {
        return this.commissionsService.findForUser(id);
    }

    @Roles(Role.Admin)
    @Get('employees/:id/commissions/summary')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get commission summary for employee' })
    @ApiResponse({
        status: 200,
        description: 'Summary amount',
        schema: { example: { amount: 0 } },
    })
    getSummaryForEmployee(
        @Param('id', ParseIntPipe) id: number,
        @Query() { from, to }: GetSummaryDto,
    ): Promise<{ amount: number }> {
        return this.commissionsService
            .sumForUser(id, new Date(from), new Date(to))
            .then((amount) => ({ amount }));
    }

    @Roles(Role.Admin)
    @Get('commissions')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all commissions' })
    @ApiResponse({ status: 200, type: Commission, isArray: true })
    findAll(): Promise<Commission[]> {
        return this.commissionsService.findAll();
    }
}
