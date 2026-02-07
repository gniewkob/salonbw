import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { VersumCompatService } from './versum-compat.service';

@ApiTags('versum-compat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller()
export class VersumCompatController {
    constructor(private readonly versumCompatService: VersumCompatService) {}

    @Get(['events', 'salonblackandwhite/events'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getEvents(@Req() req: Request) {
        const query = req.query as unknown as Record<string, unknown>;
        const userIds = this.parseIdList(query, 'user_ids');
        const start = this.parseDate(query.start, new Date());
        const end = this.parseDate(
            query.end,
            new Date(start.getTime() + 24 * 60 * 60 * 1000),
        );

        return this.versumCompatService.getEvents({
            start,
            end,
            userIds,
        });
    }

    @Get([
        'events/:id/screen_data',
        'salonblackandwhite/events/:id/screen_data',
    ])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    getScreenData(@Param('id', ParseIntPipe) id: number) {
        return this.versumCompatService.getEventScreenData(id);
    }

    @Post(['events/:id/finalize', 'salonblackandwhite/events/:id/finalize'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    finalizeEvent(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: Record<string, unknown>,
        @CurrentUser() user: { userId: number },
    ) {
        return this.versumCompatService.finalizeEvent(
            id,
            { id: user.userId } as User,
            body,
        );
    }

    @Get([
        'settings/timetable/schedules/:id',
        'salonblackandwhite/settings/timetable/schedules/:id',
    ])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    getSchedules(@Query() query: Record<string, unknown>) {
        const employeeIds = this.parseIdList(query, 'employee_ids');
        const date = this.parseDate(query.date, new Date());
        const period =
            typeof query.period === 'string' ? query.period : 'agendaResource';

        return this.versumCompatService.getSchedules({
            date,
            period,
            employeeIds,
        });
    }

    @Get(['track_new_events.json', 'salonblackandwhite/track_new_events.json'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    trackNewEvents() {
        return this.versumCompatService.getTrackNewEvents();
    }

    @Post(['graphql', 'salonblackandwhite/graphql'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    graphql(
        @Body()
        body: {
            operationName?: string;
            variables?: Record<string, unknown>;
        },
    ) {
        return this.versumCompatService.graphql(body);
    }

    // ============================================================================
    // CUSTOMERS (Klienci) - Versum Compat Endpoints
    // ============================================================================

    @Get(['customers', 'salonblackandwhite/customers'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomers(@Query() query: Record<string, unknown>) {
        return this.versumCompatService.getCustomers({
            search: typeof query.search === 'string' ? query.search : undefined,
            groupId: typeof query.group_id === 'string' ? Number(query.group_id) : undefined,
            page: typeof query.page === 'string' ? Number(query.page) : undefined,
            perPage: typeof query.per_page === 'string' ? Number(query.per_page) : undefined,
        });
    }

    @Get(['customers/:id', 'salonblackandwhite/customers/:id'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomer(@Param('id', ParseIntPipe) id: number) {
        return this.versumCompatService.getCustomer(id);
    }

    @Get(['customer_groups', 'salonblackandwhite/customer_groups'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomerGroups() {
        return this.versumCompatService.getCustomerGroups();
    }

    @Get(['customers/:id/notes', 'salonblackandwhite/customers/:id/notes'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomerNotes(@Param('id', ParseIntPipe) id: number) {
        return this.versumCompatService.getCustomerNotes(id);
    }

    @Get(['customers/:id/tags', 'salonblackandwhite/customers/:id/tags'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomerTags(@Param('id', ParseIntPipe) id: number) {
        return this.versumCompatService.getCustomerTags(id);
    }

    @Get(['customers/:id/history', 'salonblackandwhite/customers/:id/history'])
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    async getCustomerHistory(@Param('id', ParseIntPipe) id: number) {
        return this.versumCompatService.getCustomerHistory(id);
    }

    private parseDate(value: unknown, fallback: Date) {
        if (typeof value === 'string' && value.trim().length > 0) {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        return fallback;
    }

    private parseIdList(query: Record<string, unknown>, keyBase: string) {
        const raw =
            query[`${keyBase}[]`] ??
            query[keyBase] ??
            query[`${keyBase}%5B%5D`];

        if (Array.isArray(raw)) {
            return raw
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value));
        }

        if (typeof raw === 'string') {
            return raw
                .split(',')
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isFinite(value));
        }

        if (typeof raw === 'number' && Number.isFinite(raw)) {
            return [raw];
        }

        return [];
    }
}
