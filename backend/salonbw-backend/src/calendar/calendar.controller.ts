import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    ParseIntPipe,
    ValidationPipe,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { CalendarService, CalendarData } from './calendar.service';
import { TimeBlock } from './entities/time-block.entity';
import {
    CalendarQueryDto,
    TimeBlockQueryDto,
    CalendarView,
} from './dto/calendar-query.dto';
import {
    CreateTimeBlockDto,
    UpdateTimeBlockDto,
} from './dto/create-time-block.dto';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get('events')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get calendar events (appointments + time blocks)',
        description:
            'Returns all events for the specified date range and employees',
    })
    @ApiResponse({ status: 200, description: 'Calendar data with events' })
    async getEvents(
        @Query(new ValidationPipe({ transform: true })) query: CalendarQueryDto,
    ): Promise<CalendarData> {
        return this.calendarService.getCalendarData(
            new Date(query.date),
            query.view ?? CalendarView.Day,
            query.employeeIds,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get('time-blocks')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get time blocks for date range' })
    @ApiResponse({ status: 200, type: TimeBlock, isArray: true })
    async getTimeBlocks(
        @Query(new ValidationPipe({ transform: true })) query: TimeBlockQueryDto,
    ): Promise<TimeBlock[]> {
        return this.calendarService.getTimeBlocks(
            new Date(query.from),
            new Date(query.to),
            query.employeeId,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Post('time-blocks')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a time block (break, vacation, etc.)' })
    @ApiResponse({ status: 201, type: TimeBlock })
    async createTimeBlock(
        @Body() dto: CreateTimeBlockDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<TimeBlock> {
        if (user.role === Role.Employee && dto.employeeId !== user.userId) {
            throw new ForbiddenException(
                'Employees can only create time blocks for themselves',
            );
        }
        return this.calendarService.createTimeBlock(dto, { id: user.userId } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Patch('time-blocks/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a time block' })
    @ApiResponse({ status: 200, type: TimeBlock })
    async updateTimeBlock(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTimeBlockDto,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<TimeBlock> {
        const timeBlock = await this.calendarService.findTimeBlockById(id);
        if (!timeBlock) {
            throw new NotFoundException(`TimeBlock with ID ${id} not found`);
        }

        if (
            user.role === Role.Employee &&
            timeBlock.employee.id !== user.userId
        ) {
            throw new ForbiddenException(
                'Employees can only update their own time blocks',
            );
        }

        return this.calendarService.updateTimeBlock(id, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Delete('time-blocks/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a time block' })
    @ApiResponse({ status: 200, description: 'Time block deleted' })
    async deleteTimeBlock(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<{ success: boolean }> {
        const timeBlock = await this.calendarService.findTimeBlockById(id);
        if (!timeBlock) {
            throw new NotFoundException(`TimeBlock with ID ${id} not found`);
        }

        if (
            user.role === Role.Employee &&
            timeBlock.employee.id !== user.userId
        ) {
            throw new ForbiddenException(
                'Employees can only delete their own time blocks',
            );
        }

        await this.calendarService.deleteTimeBlock(id);
        return { success: true };
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get('conflicts')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Check for scheduling conflicts',
        description: 'Check if a time slot conflicts with existing events',
    })
    @ApiResponse({
        status: 200,
        description: 'Conflict check result',
    })
    async checkConflicts(
        @Query('employeeId', ParseIntPipe) employeeId: number,
        @Query('startTime') startTime: string,
        @Query('endTime') endTime: string,
        @Query('excludeAppointmentId') excludeAppointmentId?: string,
    ) {
        return this.calendarService.checkConflicts(
            employeeId,
            new Date(startTime),
            new Date(endTime),
            excludeAppointmentId ? parseInt(excludeAppointmentId, 10) : undefined,
        );
    }
}
