import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ServicesService } from './services.service';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all services' })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findAll(): Promise<Service[]> {
        return this.servicesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service by id' })
    @ApiResponse({ status: 200, type: Service })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Service> {
        return this.servicesService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service' })
    @ApiResponse({ status: 201, type: Service })
    create(
        @Body() createServiceDto: CreateServiceDto,
        @CurrentUser() user: { userId: number },
    ): Promise<Service> {
        return this.servicesService.create(createServiceDto, {
            id: user.userId,
        } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service' })
    @ApiResponse({ status: 200, type: Service })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateServiceDto: UpdateServiceDto,
        @CurrentUser() user: { userId: number },
    ): Promise<Service> {
        return this.servicesService.update(id, updateServiceDto, {
            id: user.userId,
        } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove service' })
    @ApiResponse({ status: 200, description: 'Service removed' })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number },
    ): Promise<void> {
        return this.servicesService.remove(id, { id: user.userId } as User);
    }
}
