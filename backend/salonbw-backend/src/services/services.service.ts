import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(Service)
        private readonly servicesRepository: Repository<Service>,
    ) {}

    async create(data: Service): Promise<Service> {
        const service = this.servicesRepository.create(data);
        return this.servicesRepository.save(service);
    }

    findAll(): Promise<Service[]> {
        return this.servicesRepository.find();
    }

    async findOne(id: number): Promise<Service | null> {
        const service = await this.servicesRepository.findOne({
            where: { id },
        });
        return service ?? null;
    }

    async update(id: number, data: Partial<Service>): Promise<Service | null> {
        await this.servicesRepository.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        await this.servicesRepository.delete(id);
    }
}
