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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCategoriesService } from './product-categories.service';
import {
    CreateProductCategoryDto,
    UpdateProductCategoryDto,
} from './dto/product-category.dto';

@ApiTags('product-categories')
@Controller('product-categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProductCategoriesController {
    constructor(
        private readonly productCategoriesService: ProductCategoriesService,
    ) {}

    @Roles(Role.Admin, Role.Employee)
    @Get()
    @ApiOperation({ summary: 'List product categories' })
    @ApiResponse({ status: 200, type: ProductCategory, isArray: true })
    findAll() {
        return this.productCategoriesService.findAll();
    }

    @Roles(Role.Admin, Role.Employee)
    @Get('tree')
    @SkipThrottle()
    @ApiOperation({ summary: 'Get product categories as tree' })
    @ApiResponse({ status: 200, type: ProductCategory, isArray: true })
    findTree() {
        return this.productCategoriesService.findTree();
    }

    @Roles(Role.Admin, Role.Employee)
    @Get(':id')
    @ApiOperation({ summary: 'Get product category by id' })
    @ApiResponse({ status: 200, type: ProductCategory })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productCategoriesService.findOne(id);
    }

    @Roles(Role.Admin)
    @Post()
    @ApiOperation({ summary: 'Create product category' })
    @ApiResponse({ status: 201, type: ProductCategory })
    create(@Body() dto: CreateProductCategoryDto) {
        return this.productCategoriesService.create(dto);
    }

    @Roles(Role.Admin)
    @Patch(':id')
    @ApiOperation({ summary: 'Update product category' })
    @ApiResponse({ status: 200, type: ProductCategory })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductCategoryDto,
    ) {
        return this.productCategoriesService.update(id, dto);
    }

    @Roles(Role.Admin)
    @Delete(':id')
    @ApiOperation({ summary: 'Delete product category' })
    @ApiResponse({ status: 200, description: 'Product category removed' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.productCategoriesService.remove(id);
        return { status: 'ok' };
    }
}
