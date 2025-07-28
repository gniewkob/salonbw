import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
    constructor(private readonly service: CommissionsService) {}

    @Get('admin')
    @Roles(Role.Admin)
    listAll() {
        return this.service.listAll();
    }

    @Get('employee')
    @Roles(Role.Employee)
    listOwn(@Request() req) {
        return this.service.listForEmployee(Number(req.user.id));
    }
}
