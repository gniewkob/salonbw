import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
    constructor(private readonly service: CategoriesService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List categories' })
    list() {
        return this.service.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get category by id' })
    async get(@Param('id') id: number) {
        const cat = await this.service.findOne(Number(id));
        if (!cat) {
            throw new NotFoundException();
        }
        return cat;
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create category' })
    create(@Body() dto: CreateCategoryDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Update category' })
    update(@Param('id') id: number, @Body() dto: UpdateCategoryDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete category' })
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
