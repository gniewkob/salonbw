import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceVariant } from './entities/service-variant.entity';
import { Service } from './service.entity';
import {
    CreateServiceVariantDto,
    UpdateServiceVariantDto,
    ReorderVariantsDto,
} from './dto/service-variant.dto';
import { AppCacheService } from '../cache/cache.service';

const serviceVariantsCacheKey = (serviceId: number) =>
    `service-variants:service:${serviceId}`;
const variantCacheKey = (id: number) => `service-variants:${id}`;

@Injectable()
export class ServiceVariantsService {
    constructor(
        @InjectRepository(ServiceVariant)
        private readonly variantRepository: Repository<ServiceVariant>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        private readonly cache: AppCacheService,
    ) {}

    async create(
        serviceId: number,
        dto: CreateServiceVariantDto,
    ): Promise<ServiceVariant> {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }

        const variant = this.variantRepository.create({
            ...dto,
            serviceId,
        });
        const saved = await this.variantRepository.save(variant);
        await this.invalidateCache(serviceId);
        return saved;
    }

    async findByService(serviceId: number): Promise<ServiceVariant[]> {
        return this.cache.wrap<ServiceVariant[]>(
            serviceVariantsCacheKey(serviceId),
            () =>
                this.variantRepository.find({
                    where: { serviceId },
                    order: { sortOrder: 'ASC', name: 'ASC' },
                }),
        );
    }

    async findOne(id: number): Promise<ServiceVariant> {
        const cached = await this.cache.get<ServiceVariant>(
            variantCacheKey(id),
        );
        if (cached) {
            return cached;
        }

        const variant = await this.variantRepository.findOne({
            where: { id },
            relations: ['service'],
        });

        if (!variant) {
            throw new NotFoundException('Service variant not found');
        }

        await this.cache.set(variantCacheKey(id), variant);
        return variant;
    }

    async update(
        id: number,
        dto: UpdateServiceVariantDto,
    ): Promise<ServiceVariant> {
        const variant = await this.findOne(id);
        await this.variantRepository.update(id, dto);
        await this.invalidateCache(variant.serviceId, id);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const variant = await this.findOne(id);
        await this.variantRepository.delete(id);
        await this.invalidateCache(variant.serviceId, id);
    }

    async reorder(serviceId: number, dto: ReorderVariantsDto): Promise<void> {
        const updates = dto.variantIds.map((variantId, index) =>
            this.variantRepository.update(variantId, { sortOrder: index }),
        );
        await Promise.all(updates);
        await this.invalidateCache(serviceId);
    }

    private async invalidateCache(
        serviceId: number,
        variantId?: number,
    ): Promise<void> {
        const keys = [serviceVariantsCacheKey(serviceId)];
        if (variantId) {
            keys.push(variantCacheKey(variantId));
        }
        await Promise.all(keys.map((key) => this.cache.del(key)));
    }
}
