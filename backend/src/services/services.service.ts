import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(ServiceEntity)
        private readonly repo: Repository<ServiceEntity>,
    ) {}

    create(dto: CreateServiceDto) {
        const entity = this.repo.create({
            ...dto,
            category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
        });
        return this.repo.save(entity);
    }

    findAll() {
        return this.repo.find();
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, dto: UpdateServiceDto) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) {
            return undefined;
        }
        if (dto.categoryId !== undefined) {
            entity.category = dto.categoryId ? ({ id: dto.categoryId } as any) : null;
        }
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        if (dto.description !== undefined) {
            entity.description = dto.description;
        }
        if (dto.duration !== undefined) {
            entity.duration = dto.duration;
        }
        if (dto.price !== undefined) {
            entity.price = dto.price;
        }
        if (dto.defaultCommissionPercent !== undefined) {
            entity.defaultCommissionPercent = dto.defaultCommissionPercent;
        }
        return this.repo.save(entity);
    }

    remove(id: number) {
        return this.repo.delete(id);
    }
}
