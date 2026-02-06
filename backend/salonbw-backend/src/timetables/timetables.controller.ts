import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { TimetablesService } from './timetables.service';
import {
    CreateTimetableDto,
    UpdateTimetableDto,
    CreateExceptionDto,
    UpdateExceptionDto,
    GetAvailabilityDto,
} from './dto/timetable.dto';
import { ExceptionType } from './entities/timetable-exception.entity';

@ApiTags('timetables')
@ApiBearerAuth()
@Controller('timetables')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TimetablesController {
    constructor(private readonly timetablesService: TimetablesService) {}

    @Get()
    @Roles(Role.Admin, Role.Receptionist)
    @ApiOperation({ summary: 'Lista wszystkich grafików' })
    @ApiQuery({ name: 'employeeId', required: false, type: Number })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    findAll(
        @Query('employeeId') employeeId?: string,
        @Query('isActive') isActive?: string,
    ) {
        return this.timetablesService.findAll({
            employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
            isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });
    }

    @Get('availability')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @ApiOperation({ summary: 'Pobierz dostępność pracownika w zakresie dat' })
    @ApiResponse({ status: 200, description: 'Availability slots' })
    async getAvailability(
        @Query(new ValidationPipe({ transform: true }))
        query: GetAvailabilityDto,
    ) {
        return this.timetablesService.getAvailability(
            query.employeeId,
            new Date(query.from),
            new Date(query.to),
        );
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @ApiOperation({ summary: 'Pobierz grafik po ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.timetablesService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Utwórz nowy grafik' })
    create(
        @Body(new ValidationPipe({ transform: true })) dto: CreateTimetableDto,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.create(dto, user);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj grafik' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateTimetableDto,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.update(id, dto, user);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Usuń grafik' })
    remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.timetablesService.remove(id, user);
    }

    // Exceptions
    @Get(':id/exceptions')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    @ApiOperation({ summary: 'Lista wyjątków dla grafiku' })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    @ApiQuery({ name: 'type', required: false, enum: ExceptionType })
    findExceptions(
        @Param('id', ParseIntPipe) timetableId: number,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('type') type?: ExceptionType,
    ) {
        return this.timetablesService.findExceptions(timetableId, {
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            type,
        });
    }

    @Post(':id/exceptions')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Dodaj wyjątek (urlop, wolne, etc.)' })
    createException(
        @Param('id', ParseIntPipe) timetableId: number,
        @Body(new ValidationPipe({ transform: true })) dto: CreateExceptionDto,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.createException(timetableId, dto, user);
    }

    @Patch('exceptions/:exceptionId')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj wyjątek' })
    updateException(
        @Param('exceptionId', ParseIntPipe) exceptionId: number,
        @Body(new ValidationPipe({ transform: true })) dto: UpdateExceptionDto,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.updateException(exceptionId, dto, user);
    }

    @Delete('exceptions/:exceptionId')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Usuń wyjątek' })
    removeException(
        @Param('exceptionId', ParseIntPipe) exceptionId: number,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.removeException(exceptionId, user);
    }

    @Post('exceptions/:exceptionId/approve')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Zatwierdź wniosek urlopowy' })
    approveException(
        @Param('exceptionId', ParseIntPipe) exceptionId: number,
        @CurrentUser() user: User,
    ) {
        return this.timetablesService.approveException(exceptionId, user);
    }
}
