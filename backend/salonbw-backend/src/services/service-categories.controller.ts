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
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategory } from './entities/service-category.entity';
import {
    CreateServiceCategoryDto,
    UpdateServiceCategoryDto,
    ReorderCategoriesDto,
} from './dto/service-category.dto';

@ApiTags('service-categories')
@Controller('service-categories')
export class ServiceCategoriesController {
    constructor(
        private readonly categoriesService: ServiceCategoriesService,
    ) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all service categories' })
    @ApiResponse({ status: 200, type: ServiceCategory, isArray: true })
    findAll(): Promise<ServiceCategory[]> {
        return this.categoriesService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get('tree')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get category tree (hierarchical structure)' })
    @ApiResponse({ status: 200, type: ServiceCategory, isArray: true })
    findTree(): Promise<ServiceCategory[]> {
        return this.categoriesService.findTree();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service category by ID' })
    @ApiResponse({ status: 200, type: ServiceCategory })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<ServiceCategory> {
        return this.categoriesService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service category' })
    @ApiResponse({ status: 201, type: ServiceCategory })
    create(@Body() dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
        return this.categoriesService.create(dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch('reorder')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder categories (drag & drop)' })
    @ApiResponse({ status: 200, description: 'Categories reordered' })
    reorder(@Body() dto: ReorderCategoriesDto): Promise<void> {
        return this.categoriesService.reorder(dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service category' })
    @ApiResponse({ status: 200, type: ServiceCategory })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateServiceCategoryDto,
    ): Promise<ServiceCategory> {
        return this.categoriesService.update(id, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service category' })
    @ApiResponse({ status: 200, description: 'Category deleted' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.categoriesService.remove(id);
    }
}
