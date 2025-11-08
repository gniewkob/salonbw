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
const serviceCacheKey = (id: number) => `services:${id}`;

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

    async findAll(): Promise<Service[]> {
        return this.cache.wrap<Service[]>(ALL_SERVICES_CACHE_KEY, () =>
            this.servicesRepository.find(),
        );
    }

    async findOne(id: number): Promise<Service> {
        const cached = await this.cache.get<Service>(serviceCacheKey(id));
        if (cached) {
            return cached;
        }
        const service = await this.servicesRepository.findOne({
            where: { id },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }
        await this.cache.set(serviceCacheKey(id), service);
        return service;
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

    private async invalidateCache(id: number): Promise<void> {
        await Promise.all([
            this.cache.del(ALL_SERVICES_CACHE_KEY),
            this.cache.del(serviceCacheKey(id)),
        ]);
    }
}
