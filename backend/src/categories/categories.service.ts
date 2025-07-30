import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../catalog/category.entity';
import { Service as ServiceEntity } from '../catalog/service.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly repo: Repository<Category>,
        @InjectRepository(ServiceEntity)
        private readonly services: Repository<ServiceEntity>,
        private readonly logs: LogsService,
    ) {}

    async create(dto: CreateCategoryDto) {
        const exists = await this.repo.findOne({ where: { name: dto.name } });
        if (exists) {
            throw new ConflictException('Category name must be unique');
        }
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        await this.logs.create(
            LogAction.CreateCategory,
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

    async update(id: number, dto: UpdateCategoryDto) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) return undefined;
        if (dto.name && dto.name !== entity.name) {
            const exists = await this.repo.findOne({
                where: { name: dto.name },
            });
            if (exists && exists.id !== id) {
                throw new ConflictException('Category name must be unique');
            }
        }
        Object.assign(entity, dto);
        const saved = await this.repo.save(entity);
        await this.logs.create(
            LogAction.UpdateCategory,
            JSON.stringify({ id, ...dto }),
        );
        return saved;
    }

    async remove(id: number) {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException();
        const count = await this.services.count({
            where: { category: { id } },
        });
        if (count > 0) {
            throw new ConflictException('Category has services');
        }
        await this.repo.delete(id);
        await this.logs.create(
            LogAction.DeleteCategory,
            JSON.stringify({ id }),
        );
        return { deleted: true };
    }
}
