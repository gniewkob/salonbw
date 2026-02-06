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
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) {}

    @Get()
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Lista wszystkich dostawców' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    findAll(@Query('includeInactive') includeInactive?: string) {
        return this.suppliersService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Pobierz dostawcę po ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.suppliersService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Utwórz nowego dostawcę' })
    create(@Body() dto: CreateSupplierDto, @CurrentUser() user: User) {
        return this.suppliersService.create(dto, user);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj dostawcę' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateSupplierDto,
        @CurrentUser() user: User,
    ) {
        return this.suppliersService.update(id, dto, user);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Usuń dostawcę' })
    remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.suppliersService.remove(id, user);
    }
}
