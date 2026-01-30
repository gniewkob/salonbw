import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, IsNull, And } from 'typeorm';
import { Product, ProductType } from '../products/product.entity';
import { Supplier } from './entities/supplier.entity';
import {
    GetLowStockDto,
    LowStockProductDto,
    ReorderSuggestionDto,
    StockAlertsSummaryDto,
    StockAlertsResponseDto,
} from './dto/stock-alerts.dto';

@Injectable()
export class StockAlertsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Supplier)
        private readonly supplierRepository: Repository<Supplier>,
    ) {}

    async getLowStockProducts(dto: GetLowStockDto): Promise<LowStockProductDto[]> {
        const query = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.defaultSupplier', 'supplier')
            .where('product.minQuantity IS NOT NULL')
            .andWhere('product.stock < product.minQuantity')
            .andWhere('product.isActive = :isActive', { isActive: true });

        if (dto.trackStockOnly !== false) {
            query.andWhere('product.trackStock = :trackStock', { trackStock: true });
        }

        if (dto.productType) {
            query.andWhere('product.productType = :productType', {
                productType: dto.productType,
            });
        }

        query.orderBy('(product.minQuantity - product.stock)', 'DESC');

        if (dto.limit) {
            query.limit(dto.limit);
        }

        const products = await query.getMany();

        return products.map((product) => this.mapToLowStockDto(product));
    }

    async getStockAlerts(dto: GetLowStockDto): Promise<StockAlertsResponseDto> {
        const lowStockProducts = await this.getLowStockProducts(dto);
        const reorderSuggestions = this.generateReorderSuggestions(lowStockProducts);
        const summary = this.calculateSummary(lowStockProducts, reorderSuggestions);

        return {
            summary,
            lowStockProducts,
            reorderSuggestions,
        };
    }

    async getCriticalStockProducts(): Promise<LowStockProductDto[]> {
        // Products with stock at 0 or below 25% of minQuantity
        const query = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.defaultSupplier', 'supplier')
            .where('product.minQuantity IS NOT NULL')
            .andWhere('product.minQuantity > 0')
            .andWhere('product.isActive = :isActive', { isActive: true })
            .andWhere('product.trackStock = :trackStock', { trackStock: true })
            .andWhere(
                '(product.stock = 0 OR product.stock <= product.minQuantity * 0.25)',
            )
            .orderBy('product.stock', 'ASC');

        const products = await query.getMany();
        return products.map((product) => this.mapToLowStockDto(product));
    }

    async getReorderSuggestionsBySupplierId(
        supplierId: number,
    ): Promise<ReorderSuggestionDto[]> {
        const query = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.defaultSupplier', 'supplier')
            .where('product.defaultSupplierId = :supplierId', { supplierId })
            .andWhere('product.minQuantity IS NOT NULL')
            .andWhere('product.stock < product.minQuantity')
            .andWhere('product.isActive = :isActive', { isActive: true })
            .andWhere('product.trackStock = :trackStock', { trackStock: true })
            .orderBy('(product.minQuantity - product.stock)', 'DESC');

        const products = await query.getMany();
        const lowStockDtos = products.map((p) => this.mapToLowStockDto(p));
        return this.generateReorderSuggestions(lowStockDtos);
    }

    async getStockSummary(): Promise<{
        totalProducts: number;
        trackedProducts: number;
        lowStockCount: number;
        outOfStockCount: number;
        healthyStockCount: number;
    }> {
        const totalProducts = await this.productRepository.count({
            where: { isActive: true },
        });

        const trackedProducts = await this.productRepository.count({
            where: { isActive: true, trackStock: true },
        });

        const lowStockQuery = this.productRepository
            .createQueryBuilder('product')
            .where('product.minQuantity IS NOT NULL')
            .andWhere('product.stock < product.minQuantity')
            .andWhere('product.stock > 0')
            .andWhere('product.isActive = :isActive', { isActive: true })
            .andWhere('product.trackStock = :trackStock', { trackStock: true });

        const lowStockCount = await lowStockQuery.getCount();

        const outOfStockCount = await this.productRepository.count({
            where: {
                isActive: true,
                trackStock: true,
                stock: 0,
            },
        });

        const healthyStockCount = trackedProducts - lowStockCount - outOfStockCount;

        return {
            totalProducts,
            trackedProducts,
            lowStockCount,
            outOfStockCount,
            healthyStockCount,
        };
    }

    private mapToLowStockDto(product: Product): LowStockProductDto {
        const deficit = (product.minQuantity ?? 0) - product.stock;
        const deficitPercentage =
            product.minQuantity && product.minQuantity > 0
                ? Math.round((deficit / product.minQuantity) * 100)
                : 0;

        return {
            id: product.id,
            name: product.name,
            brand: product.brand,
            sku: product.sku,
            barcode: product.barcode,
            productType: product.productType,
            stock: product.stock,
            minQuantity: product.minQuantity ?? 0,
            unit: product.unit,
            deficit,
            deficitPercentage,
            purchasePrice: product.purchasePrice,
            defaultSupplierId: product.defaultSupplierId,
            defaultSupplierName: product.defaultSupplier?.name ?? null,
        };
    }

    private generateReorderSuggestions(
        lowStockProducts: LowStockProductDto[],
    ): ReorderSuggestionDto[] {
        return lowStockProducts.map((product) => {
            // Suggest ordering enough to reach 150% of minQuantity
            const targetStock = Math.ceil(product.minQuantity * 1.5);
            const suggestedOrderQuantity = Math.max(
                targetStock - product.stock,
                product.minQuantity,
            );

            const estimatedCost = product.purchasePrice
                ? product.purchasePrice * suggestedOrderQuantity
                : null;

            const priority = this.calculatePriority(product);

            return {
                productId: product.id,
                productName: product.name,
                brand: product.brand,
                sku: product.sku,
                currentStock: product.stock,
                minQuantity: product.minQuantity,
                suggestedOrderQuantity,
                estimatedCost,
                supplierId: product.defaultSupplierId,
                supplierName: product.defaultSupplierName,
                priority,
            };
        });
    }

    private calculatePriority(
        product: LowStockProductDto,
    ): 'critical' | 'high' | 'medium' | 'low' {
        if (product.stock === 0) {
            return 'critical';
        }
        if (product.deficitPercentage >= 75) {
            return 'critical';
        }
        if (product.deficitPercentage >= 50) {
            return 'high';
        }
        if (product.deficitPercentage >= 25) {
            return 'medium';
        }
        return 'low';
    }

    private calculateSummary(
        lowStockProducts: LowStockProductDto[],
        reorderSuggestions: ReorderSuggestionDto[],
    ): StockAlertsSummaryDto {
        const criticalCount = reorderSuggestions.filter(
            (s) => s.priority === 'critical',
        ).length;
        const highCount = reorderSuggestions.filter(
            (s) => s.priority === 'high',
        ).length;
        const mediumCount = reorderSuggestions.filter(
            (s) => s.priority === 'medium',
        ).length;
        const lowCount = reorderSuggestions.filter(
            (s) => s.priority === 'low',
        ).length;

        const estimatedTotalReorderCost = reorderSuggestions.reduce(
            (sum, s) => sum + (s.estimatedCost ?? 0),
            0,
        );

        return {
            totalLowStock: lowStockProducts.length,
            criticalCount,
            highCount,
            mediumCount,
            lowCount,
            estimatedTotalReorderCost:
                estimatedTotalReorderCost > 0 ? estimatedTotalReorderCost : null,
            lastCheckedAt: new Date().toISOString(),
        };
    }
}
