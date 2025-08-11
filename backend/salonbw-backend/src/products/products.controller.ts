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
import { ProductsService } from './products.service';
import { Product } from './product.entity';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get()
    findAll(): Promise<Product[]> {
        return this.productsService.findAll();
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Employee)
    @Get(':id')
    findOne(@Param('id') id: string): Promise<Product | null> {
        return this.productsService.findOne(Number(id));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    create(@Body() body: Product): Promise<Product> {
        return this.productsService.create(body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() body: Partial<Product>,
    ): Promise<Product | null> {
        return this.productsService.update(Number(id), body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    remove(@Param('id') id: string): Promise<void> {
        return this.productsService.remove(Number(id));
    }
}
