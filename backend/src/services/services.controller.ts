import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
    constructor(private readonly service: ServicesService) {}

    @Get()
    @Roles(Role.Admin, Role.Client)
    @ApiOperation({ summary: 'List all services' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create service' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateServiceDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Update service' })
    update(@Param('id') id: number, @Body() dto: UpdateServiceDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete service' })
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
