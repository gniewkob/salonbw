import {
    Controller,
    Get,
    Param,
    NotFoundException,
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
import { Public } from '../../auth/public.decorator';
import { Role } from '../../users/role.enum';
import { ProductsService } from '../products.service';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublicController {
    constructor(private readonly service: ProductsService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all products' })
    list() {
        return this.service.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get product by id' })
    @ApiResponse({ status: 200 })
    @ApiResponse({ status: 404 })
    async get(@Param('id') id: number) {
        const prod = await this.service.findOne(Number(id));
        if (!prod) {
            throw new NotFoundException();
        }
        return prod;
    }

    @Get('low-stock')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'List low stock products' })
    listLowStock() {
        return this.service.findLowStock();
    }
}
