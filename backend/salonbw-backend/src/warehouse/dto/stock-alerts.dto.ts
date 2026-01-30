import { IsOptional, IsBoolean, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../products/product.entity';

export class GetLowStockDto {
    @IsOptional()
    @IsEnum(ProductType)
    productType?: ProductType;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    trackStockOnly?: boolean = true;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    limit?: number;
}

export class LowStockProductDto {
    id: number;
    name: string;
    brand: string | null;
    sku: string | null;
    barcode: string | null;
    productType: ProductType;
    stock: number;
    minQuantity: number;
    unit: string | null;
    deficit: number;
    deficitPercentage: number;
    purchasePrice: number | null;
    defaultSupplierId: number | null;
    defaultSupplierName: string | null;
}

export class ReorderSuggestionDto {
    productId: number;
    productName: string;
    brand: string | null;
    sku: string | null;
    currentStock: number;
    minQuantity: number;
    suggestedOrderQuantity: number;
    estimatedCost: number | null;
    supplierId: number | null;
    supplierName: string | null;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

export class StockAlertsSummaryDto {
    totalLowStock: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    estimatedTotalReorderCost: number | null;
    lastCheckedAt: string;
}

export class StockAlertsResponseDto {
    summary: StockAlertsSummaryDto;
    lowStockProducts: LowStockProductDto[];
    reorderSuggestions: ReorderSuggestionDto[];
}
