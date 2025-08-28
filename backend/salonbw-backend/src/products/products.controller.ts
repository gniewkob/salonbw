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
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all products' })
    @ApiResponse({ status: 200, type: Product, isArray: true })
    findAll(): Promise<Product[]> {
        return this.productsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get product by id' })
    @ApiResponse({ status: 200, type: Product })
    findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
        return this.productsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create product' })
    @ApiResponse({ status: 201, type: Product })
    create(
        @Body() body: CreateProductDto,
        @CurrentUser() user: { userId: number },
    ): Promise<Product> {
        return this.productsService.create(body, { id: user.userId } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update product' })
    @ApiResponse({ status: 200, type: Product })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateProductDto,
        @CurrentUser() user: { userId: number },
    ): Promise<Product> {
        return this.productsService.update(id, body, {
            id: user.userId,
        } as User);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove product' })
    @ApiResponse({ status: 200, description: 'Product removed' })
    remove(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number },
    ): Promise<void> {
        return this.productsService.remove(id, { id: user.userId } as User);
    }
}
