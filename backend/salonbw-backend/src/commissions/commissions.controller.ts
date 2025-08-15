import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommissionsService } from './commissions.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { Commission } from './commission.entity';

@Controller('commissions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CommissionsController {
    constructor(private readonly commissionsService: CommissionsService) {}

    @Roles(Role.Employee, Role.Admin)
    @Get('me')
    findMine(@CurrentUser() user: { userId: number }): Promise<Commission[]> {
        return this.commissionsService.findForUser(user.userId);
    }

    @Roles(Role.Admin)
    @Get('employees/:id')
    findForEmployee(
        @Param('id', ParseIntPipe) id: number,
    ): Promise<Commission[]> {
        return this.commissionsService.findForUser(id);
    }

    @Roles(Role.Admin)
    @Get('employees/:id/commissions/summary')
    getSummaryForEmployee(
        @Param('id', ParseIntPipe) id: number,
        @Query('from') from: string,
        @Query('to') to: string,
    ): Promise<{ amount: number }> {
        return this.commissionsService
            .sumForUser(id, new Date(from), new Date(to))
            .then((amount) => ({ amount }));
    }

    @Roles(Role.Admin)
    @Get()
    findAll(): Promise<Commission[]> {
        return this.commissionsService.findAll();
    }
}
