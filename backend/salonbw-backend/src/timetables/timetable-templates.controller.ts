import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import {
    CreateTimetableTemplateDto,
    UpdateTimetableTemplateDto,
} from './dto/timetable-template.dto';
import { TimetableTemplatesService } from './timetable-templates.service';

@ApiTags('timetable-templates')
@ApiBearerAuth()
@Controller('timetable-templates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TimetableTemplatesController {
    constructor(
        private readonly timetableTemplatesService: TimetableTemplatesService,
    ) {}

    @Get()
    @Roles(Role.Admin, Role.Receptionist)
    @ApiOperation({ summary: 'Lista szablonów grafików' })
    findAll() {
        return this.timetableTemplatesService.findAll();
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Receptionist)
    @ApiOperation({ summary: 'Pobierz szablon grafiku po ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.timetableTemplatesService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Utwórz szablon grafiku' })
    create(
        @Body(new ValidationPipe({ transform: true }))
        dto: CreateTimetableTemplateDto,
        @CurrentUser() user: User,
    ) {
        return this.timetableTemplatesService.create(dto, user);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj szablon grafiku' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true }))
        dto: UpdateTimetableTemplateDto,
        @CurrentUser() user: User,
    ) {
        return this.timetableTemplatesService.update(id, dto, user);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Usuń szablon grafiku' })
    remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.timetableTemplatesService.remove(id, user);
    }
}
