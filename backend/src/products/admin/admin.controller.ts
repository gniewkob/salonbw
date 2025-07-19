import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Param,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/role.enum';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminController {
    constructor(private readonly service: ProductsService) {}

    @Get()
    @ApiOperation({ summary: 'List all products' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Post()
    @ApiOperation({ summary: 'Create product' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateProductDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update product' })
    update(@Param('id') id: number, @Body() dto: UpdateProductDto) {
        return this.service.update(Number(id), dto);
    }
}
