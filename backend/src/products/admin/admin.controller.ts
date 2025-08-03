import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../users/role.enum';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { BulkUpdateStockDto } from '../dto/bulk-update-stock.dto';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
    user: { id: number };
}

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

    @Patch('bulk-stock')
    @ApiOperation({
        summary: 'Bulk update product stock',
        description:
            'Adjusts stock levels for multiple products. Each change is logged with usageType STOCK_CORRECTION.',
    })
    @ApiResponse({ status: 200 })
    @ApiBody({
        type: BulkUpdateStockDto,
        description: 'Stock levels to apply. Logged as usageType STOCK_CORRECTION.',
    })
    bulkUpdateStock(
        @Body() body: BulkUpdateStockDto,
        @Request() req: AuthRequest,
    ) {
        return this.service.bulkUpdateStock(body.entries, req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update product' })
    @ApiResponse({ status: 200 })
    update(@Param('id') id: number, @Body() dto: UpdateProductDto) {
        return this.service.update(Number(id), dto);
    }

    @Patch(':id/stock')
    @ApiOperation({
        summary: 'Adjust product stock',
        description: 'Increments or decrements stock. Logged with usageType STOCK_CORRECTION.',
    })
    @ApiResponse({ status: 200 })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                amount: {
                    type: 'integer',
                    description:
                        'Change in stock (positive or negative). Logged as usageType STOCK_CORRECTION.',
                },
            },
        },
    })
    updateStock(
        @Param('id') id: number,
        @Body('amount') amount: number,
        @Request() req: AuthRequest,
    ) {
        return this.service.updateStock(
            Number(id),
            Number(amount),
            req.user.id,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete product' })
    @ApiResponse({ status: 200 })
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
