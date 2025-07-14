import { Controller, Get, Request } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';

@Controller('commissions')
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
        return this.service.listForEmployee(req.user.id);
    }
}
