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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
    constructor(private readonly service: ServicesService) {}

    @Get()
    @Roles(Role.Admin, Role.Client)
    list() {
        return this.service.findAll();
    }

    @Post()
    @Roles(Role.Admin)
    create(@Body() dto: CreateServiceDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    update(@Param('id') id: number, @Body() dto: UpdateServiceDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
