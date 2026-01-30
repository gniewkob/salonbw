import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { AppCacheService } from '../cache/cache.service';

const ALL_SERVICES_CACHE_KEY = 'services:all';
const SERVICES_WITH_RELATIONS_CACHE_KEY = 'services:all:relations';
const serviceCacheKey = (id: number) => `services:${id}`;

export interface ServiceQueryOptions {
    categoryId?: number;
    isActive?: boolean;
    onlineBooking?: boolean;
    includeVariants?: boolean;
    includeCategory?: boolean;
}

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        private readonly logService: LogService,
        private readonly cache: AppCacheService,
    ) {}

    async create(dto: CreateServiceDto, user: User): Promise<Service> {
        const service = this.servicesRepository.create(dto);
        const saved = await this.servicesRepository.save(service);
        try {
            await this.logService.logAction(user, LogAction.SERVICE_CREATED, {
                serviceId: saved.id,
                name: saved.name,
            });
        } catch (error) {
            console.error('Failed to log service creation action', error);
        }
        await this.invalidateCache(saved.id);
        return saved;
    }

    async findAll(options?: ServiceQueryOptions): Promise<Service[]> {
        // Simple cache for basic findAll without filters
        if (!options || Object.keys(options).length === 0) {
            return this.cache.wrap<Service[]>(ALL_SERVICES_CACHE_KEY, () =>
                this.servicesRepository.find({
                    order: { sortOrder: 'ASC', name: 'ASC' },
                }),
            );
        }

        // Build query with filters
        const qb = this.servicesRepository.createQueryBuilder('service');

        if (options.includeCategory) {
            qb.leftJoinAndSelect('service.categoryRelation', 'category');
        }

        if (options.includeVariants) {
            qb.leftJoinAndSelect('service.variants', 'variants');
        }

        if (options.categoryId !== undefined) {
            qb.andWhere('service.categoryId = :categoryId', {
                categoryId: options.categoryId,
            });
        }

        if (options.isActive !== undefined) {
            qb.andWhere('service.isActive = :isActive', {
                isActive: options.isActive,
            });
        }

        if (options.onlineBooking !== undefined) {
            qb.andWhere('service.onlineBooking = :onlineBooking', {
                onlineBooking: options.onlineBooking,
            });
        }

        qb.orderBy('service.sortOrder', 'ASC');
        qb.addOrderBy('service.name', 'ASC');

        return qb.getMany();
    }

    async findAllWithRelations(): Promise<Service[]> {
        return this.cache.wrap<Service[]>(
            SERVICES_WITH_RELATIONS_CACHE_KEY,
            () =>
                this.servicesRepository.find({
                    relations: ['categoryRelation', 'variants'],
                    order: { sortOrder: 'ASC', name: 'ASC' },
                }),
        );
    }

    async findOne(id: number): Promise<Service> {
        const cached = await this.cache.get<Service>(serviceCacheKey(id));
        if (cached) {
            return cached;
        }
        const service = await this.servicesRepository.findOne({
            where: { id },
            relations: ['categoryRelation', 'variants', 'employeeServices'],
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }
        await this.cache.set(serviceCacheKey(id), service);
        return service;
    }

    async findByCategory(categoryId: number): Promise<Service[]> {
        return this.servicesRepository.find({
            where: { categoryId },
            relations: ['variants'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findActiveForOnlineBooking(): Promise<Service[]> {
        return this.servicesRepository.find({
            where: { isActive: true, onlineBooking: true },
            relations: ['categoryRelation', 'variants'],
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async update(
        id: number,
        dto: UpdateServiceDto,
        user: User,
    ): Promise<Service> {
        await this.servicesRepository.update(id, dto);
        const updated = await this.findOne(id);
        try {
            await this.logService.logAction(user, LogAction.SERVICE_UPDATED, {
                serviceId: updated.id,
                name: updated.name,
            });
        } catch (error) {
            console.error('Failed to log service update action', error);
        }
        await this.invalidateCache(id);
        return updated;
    }

    async remove(id: number, user: User): Promise<void> {
        const service = await this.findOne(id);
        await this.servicesRepository.delete(id);
        try {
            await this.logService.logAction(user, LogAction.SERVICE_DELETED, {
                serviceId: service.id,
                name: service.name,
            });
        } catch (error) {
            console.error('Failed to log service deletion action', error);
        }
        await this.invalidateCache(id);
    }

    async reorder(serviceIds: number[]): Promise<void> {
        const updates = serviceIds.map((serviceId, index) =>
            this.servicesRepository.update(serviceId, { sortOrder: index }),
        );
        await Promise.all(updates);
        await this.invalidateCache();
    }

    private async invalidateCache(id?: number): Promise<void> {
        const keys = [ALL_SERVICES_CACHE_KEY, SERVICES_WITH_RELATIONS_CACHE_KEY];
        if (id) {
            keys.push(serviceCacheKey(id));
        }
        await Promise.all(keys.map((key) => this.cache.del(key)));
    }
}
