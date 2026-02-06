import {
    Controller,
    Get,
    Query,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { StockAlertsService } from './stock-alerts.service';
import {
    GetLowStockDto,
    LowStockProductDto,
    ReorderSuggestionDto,
    StockAlertsResponseDto,
} from './dto/stock-alerts.dto';

@Controller('stock-alerts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StockAlertsController {
    constructor(private readonly stockAlertsService: StockAlertsService) {}

    /**
     * Get full stock alerts report with summary, low stock products, and reorder suggestions
     */
    @Get()
    @Roles(Role.Admin)
    async getStockAlerts(
        @Query() dto: GetLowStockDto,
    ): Promise<StockAlertsResponseDto> {
        return this.stockAlertsService.getStockAlerts(dto);
    }

    /**
     * Get list of low stock products only
     */
    @Get('low-stock')
    @Roles(Role.Admin)
    async getLowStockProducts(
        @Query() dto: GetLowStockDto,
    ): Promise<LowStockProductDto[]> {
        return this.stockAlertsService.getLowStockProducts(dto);
    }

    /**
     * Get critical stock products (out of stock or below 25% of minQuantity)
     */
    @Get('critical')
    @Roles(Role.Admin)
    async getCriticalStockProducts(): Promise<LowStockProductDto[]> {
        return this.stockAlertsService.getCriticalStockProducts();
    }

    /**
     * Get stock summary (counts of products by stock status)
     */
    @Get('summary')
    @Roles(Role.Admin)
    async getStockSummary() {
        return this.stockAlertsService.getStockSummary();
    }

    /**
     * Get reorder suggestions for a specific supplier
     */
    @Get('suppliers/:supplierId/reorder')
    @Roles(Role.Admin)
    async getReorderSuggestionsBySupplier(
        @Param('supplierId', ParseIntPipe) supplierId: number,
    ): Promise<ReorderSuggestionDto[]> {
        return this.stockAlertsService.getReorderSuggestionsBySupplierId(
            supplierId,
        );
    }
}
