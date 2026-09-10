import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType, Service } from '../service.entity';
import { PriceType as VariantPriceType } from '../entities/service-variant.entity';

class ServiceCatalogCategoryDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    description?: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    color?: string | null;

    @ApiProperty()
    sortOrder: number;

    @ApiProperty()
    isActive: boolean;

    @ApiPropertyOptional({ type: Number, nullable: true })
    parentId?: number | null;
}

class ServiceCatalogVariantDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    serviceId: number;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    description?: string | null;

    @ApiProperty()
    duration: number;

    @ApiProperty()
    price: number;

    @ApiProperty({ enum: VariantPriceType })
    priceType: VariantPriceType;

    @ApiProperty()
    sortOrder: number;

    @ApiProperty()
    isActive: boolean;
}

export class ServiceCatalogResponseDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional({ type: String, nullable: true })
    description?: string | null;

    @ApiPropertyOptional({ type: String, nullable: true })
    publicDescription?: string | null;

    @ApiProperty()
    duration: number;

    @ApiProperty()
    price: number;

    @ApiProperty({ enum: PriceType })
    priceType: PriceType;

    @ApiPropertyOptional({ type: Number, nullable: true })
    vatRate?: number | null;

    @ApiProperty()
    durationBefore: number;

    @ApiProperty()
    durationAfter: number;

    @ApiProperty()
    breakOffset: number;

    @ApiProperty()
    breakDuration: number;

    @ApiProperty()
    isFeatured: boolean;

    @ApiPropertyOptional({ type: String, nullable: true })
    category?: string | null;

    @ApiPropertyOptional({ type: Number, nullable: true })
    categoryId?: number | null;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    onlineBooking: boolean;

    @ApiProperty()
    sortOrder: number;

    @ApiPropertyOptional({ type: ServiceCatalogCategoryDto })
    categoryRelation?: ServiceCatalogCategoryDto;

    @ApiPropertyOptional({ type: [ServiceCatalogVariantDto] })
    variants?: ServiceCatalogVariantDto[];

    static from(service: Service): ServiceCatalogResponseDto {
        return {
            id: service.id,
            name: service.name,
            description: service.description,
            publicDescription: service.publicDescription,
            duration: service.duration,
            price: service.price,
            priceType: service.priceType,
            vatRate: service.vatRate,
            durationBefore: service.durationBefore,
            durationAfter: service.durationAfter,
            breakOffset: service.breakOffset,
            breakDuration: service.breakDuration,
            isFeatured: service.isFeatured,
            category: service.category,
            categoryId: service.categoryId,
            isActive: service.isActive,
            onlineBooking: service.onlineBooking,
            sortOrder: service.sortOrder,
            categoryRelation: service.categoryRelation
                ? {
                      id: service.categoryRelation.id,
                      name: service.categoryRelation.name,
                      description: service.categoryRelation.description,
                      color: service.categoryRelation.color,
                      sortOrder: service.categoryRelation.sortOrder,
                      isActive: service.categoryRelation.isActive,
                      parentId: service.categoryRelation.parentId,
                  }
                : undefined,
            variants: service.variants?.map((variant) => ({
                id: variant.id,
                serviceId: variant.serviceId,
                name: variant.name,
                description: variant.description,
                duration: variant.duration,
                price: variant.price,
                priceType: variant.priceType,
                sortOrder: variant.sortOrder,
                isActive: variant.isActive,
            })),
        };
    }
}

export class AdminServiceResponseDto extends ServiceCatalogResponseDto {
    @ApiPropertyOptional({ type: String, nullable: true })
    privateDescription?: string | null;

    @ApiPropertyOptional({ type: Number, nullable: true })
    commissionPercent?: number | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    static from(service: Service): AdminServiceResponseDto {
        return {
            ...ServiceCatalogResponseDto.from(service),
            privateDescription: service.privateDescription ?? null,
            commissionPercent: service.commissionPercent ?? null,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        };
    }
}
