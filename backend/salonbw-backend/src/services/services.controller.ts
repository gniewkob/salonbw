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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ServicesService, ServiceQueryOptions } from './services.service';
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
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all services with optional filters' })
    @ApiQuery({ name: 'categoryId', required: false, type: Number })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'onlineBooking', required: false, type: Boolean })
    @ApiQuery({ name: 'includeVariants', required: false, type: Boolean })
    @ApiQuery({ name: 'includeCategory', required: false, type: Boolean })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findAll(
        @Query('categoryId') categoryId?: string,
        @Query('isActive') isActive?: string,
        @Query('onlineBooking') onlineBooking?: string,
        @Query('includeVariants') includeVariants?: string,
        @Query('includeCategory') includeCategory?: string,
    ): Promise<Service[]> {
        const options: ServiceQueryOptions = {};

        if (categoryId) {
            options.categoryId = parseInt(categoryId, 10);
        }
        if (isActive !== undefined && isActive !== '') {
            options.isActive = isActive === 'true';
        }
        if (onlineBooking !== undefined && onlineBooking !== '') {
            options.onlineBooking = onlineBooking === 'true';
        }
        if (includeVariants === 'true') {
            options.includeVariants = true;
        }
        if (includeCategory === 'true') {
            options.includeCategory = true;
        }

        return this.servicesService.findAll(options);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('with-relations')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all services with categories and variants' })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findAllWithRelations(): Promise<Service[]> {
        return this.servicesService.findAllWithRelations();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('online-booking')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get services available for online booking' })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findActiveForOnlineBooking(): Promise<Service[]> {
        return this.servicesService.findActiveForOnlineBooking();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('by-category/:categoryId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get services by category' })
    @ApiResponse({ status: 200, type: Service, isArray: true })
    findByCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
    ): Promise<Service[]> {
        return this.servicesService.findByCategory(categoryId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
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
    @Patch('reorder')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder services (drag & drop)' })
    @ApiResponse({ status: 200, description: 'Services reordered' })
    reorder(@Body() body: { serviceIds: number[] }): Promise<void> {
        return this.servicesService.reorder(body.serviceIds);
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
