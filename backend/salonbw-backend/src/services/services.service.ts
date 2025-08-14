import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
        private readonly logService: LogService,
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
        return saved;
    }

    findAll(): Promise<Service[]> {
        return this.servicesRepository.find();
    }

    async findOne(id: number): Promise<Service> {
        const service = await this.servicesRepository.findOne({
            where: { id },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }
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
    }
}
