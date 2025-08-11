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
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ServicesService } from './services.service';
import { Service } from './service.entity';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get()
    findAll(): Promise<Service[]> {
        return this.servicesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get(':id')
    findOne(@Param('id') id: string): Promise<Service | null> {
        return this.servicesService.findOne(Number(id));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    create(@Body() body: Service): Promise<Service> {
        return this.servicesService.create(body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() body: Partial<Service>,
    ): Promise<Service | null> {
        return this.servicesService.update(Number(id), body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.servicesService.remove(Number(id));
    }
}
