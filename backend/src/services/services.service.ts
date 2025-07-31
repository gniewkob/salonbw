import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { Category } from '../catalog/category.entity';
import { Appointment } from '../appointments/appointment.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class ServicesService {
    constructor(
        @InjectRepository(ServiceEntity)
        private readonly repo: Repository<ServiceEntity>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        @InjectRepository(Category)
        private readonly categories: Repository<Category>,
        private readonly logs: LogsService,
    ) {}

    async create(dto: CreateServiceDto) {
        const category = await this.categories.findOne({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new BadRequestException('Category not found');
        }
        const exists = await this.repo.findOne({
            where: { name: dto.name, category: { id: dto.categoryId } },
        });
        if (exists) {
            throw new ConflictException('Service already exists');
        }
        const entity = this.repo.create({
            ...dto,
            category,
        });
        const saved = await this.repo.save(entity);
        await this.logs.create(
            LogAction.CreateService,
            JSON.stringify({ id: saved.id, ...dto }),
        );
        return saved;
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
            throw new NotFoundException();
        }
        const newName = dto.name ?? entity.name;
        const newCategoryId =
            dto.categoryId !== undefined
                ? dto.categoryId
                : entity.category?.id ?? null;
        if (
            (dto.name !== undefined && dto.name !== entity.name) ||
            (dto.categoryId !== undefined &&
                dto.categoryId !== entity.category?.id)
        ) {
            const exists = await this.repo.findOne({
                where: {
                    name: newName,
                    category: newCategoryId
                        ? ({ id: newCategoryId } as any)
                        : null,
                },
            });
            if (exists && exists.id !== id) {
                throw new ConflictException('Service already exists');
            }
        }
        if (dto.categoryId !== undefined) {
            entity.category = dto.categoryId
                ? ({ id: dto.categoryId } as any)
                : null;
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
        const saved = await this.repo.save(entity);
        await this.logs.create(
            LogAction.UpdateService,
            JSON.stringify({ id, ...dto }),
        );
        return saved;
    }

    async remove(id: number) {
        const entity = await this.findOne(id);
        if (!entity) {
            throw new NotFoundException();
        }
        const count = await this.appointments.count({
            where: { service: { id } },
        });
        if (count > 0) {
            throw new BadRequestException('Service has existing appointments');
        }
        const result = await this.repo.delete(id);
        await this.logs.create(LogAction.DeleteService, JSON.stringify({ id }));
        return result;
    }
}
