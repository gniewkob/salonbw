import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceCategory } from './entities/service-category.entity';
import {
    CreateServiceCategoryDto,
    UpdateServiceCategoryDto,
    ReorderCategoriesDto,
} from './dto/service-category.dto';
import { AppCacheService } from '../cache/cache.service';

const ALL_CATEGORIES_CACHE_KEY = 'service-categories:all';
const CATEGORY_TREE_CACHE_KEY = 'service-categories:tree';
const categoryCacheKey = (id: number) => `service-categories:${id}`;

@Injectable()
export class ServiceCategoriesService {
    constructor(
        @InjectRepository(ServiceCategory)
        private readonly categoryRepository: Repository<ServiceCategory>,
        private readonly cache: AppCacheService,
    ) {}

    async create(dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
        if (dto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new BadRequestException('Parent category not found');
            }
        }

        const category = this.categoryRepository.create(dto);
        const saved = await this.categoryRepository.save(category);
        await this.invalidateCache();
        return saved;
    }

    async findAll(): Promise<ServiceCategory[]> {
        return this.cache.wrap<ServiceCategory[]>(
            ALL_CATEGORIES_CACHE_KEY,
            () =>
                this.categoryRepository.find({
                    relations: ['parent', 'children'],
                    order: { sortOrder: 'ASC', name: 'ASC' },
                }),
        );
    }

    async findTree(): Promise<ServiceCategory[]> {
        return this.cache.wrap<ServiceCategory[]>(
            CATEGORY_TREE_CACHE_KEY,
            async () => {
                // Get root categories (no parent)
                const roots = await this.categoryRepository.find({
                    where: { parentId: IsNull() },
                    relations: ['children', 'children.children', 'services'],
                    order: { sortOrder: 'ASC', name: 'ASC' },
                });
                return roots;
            },
        );
    }

    async findOne(id: number): Promise<ServiceCategory> {
        const cached = await this.cache.get<ServiceCategory>(
            categoryCacheKey(id),
        );
        if (cached) {
            return cached;
        }

        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['parent', 'children', 'services'],
        });

        if (!category) {
            throw new NotFoundException('Service category not found');
        }

        await this.cache.set(categoryCacheKey(id), category);
        return category;
    }

    async update(
        id: number,
        dto: UpdateServiceCategoryDto,
    ): Promise<ServiceCategory> {
        const category = await this.findOne(id);

        // Prevent circular reference
        if (dto.parentId && dto.parentId === id) {
            throw new BadRequestException('Category cannot be its own parent');
        }

        // Check if new parent exists
        if (dto.parentId) {
            const parent = await this.categoryRepository.findOne({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new BadRequestException('Parent category not found');
            }
            // Prevent setting a child as parent (would create cycle)
            if (await this.isDescendant(dto.parentId, id)) {
                throw new BadRequestException(
                    'Cannot set a descendant as parent (would create cycle)',
                );
            }
        }

        await this.categoryRepository.update(id, dto);
        await this.invalidateCache(id);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const category = await this.findOne(id);

        // Move children to parent if any
        if (category.children?.length > 0) {
            await this.categoryRepository.update(
                { parentId: id },
                { parentId: category.parentId || undefined },
            );
        }

        await this.categoryRepository.delete(id);
        await this.invalidateCache(id);
    }

    async reorder(dto: ReorderCategoriesDto): Promise<void> {
        const updates = dto.categoryIds.map((categoryId, index) =>
            this.categoryRepository.update(categoryId, { sortOrder: index }),
        );
        await Promise.all(updates);
        await this.invalidateCache();
    }

    private async isDescendant(
        potentialDescendantId: number,
        ancestorId: number,
    ): Promise<boolean> {
        const descendant = await this.categoryRepository.findOne({
            where: { id: potentialDescendantId },
            relations: ['parent'],
        });

        if (!descendant || !descendant.parentId) {
            return false;
        }

        if (descendant.parentId === ancestorId) {
            return true;
        }

        return this.isDescendant(descendant.parentId, ancestorId);
    }

    private async invalidateCache(id?: number): Promise<void> {
        const keys = [ALL_CATEGORIES_CACHE_KEY, CATEGORY_TREE_CACHE_KEY];
        if (id) {
            keys.push(categoryCacheKey(id));
        }
        await Promise.all(keys.map((key) => this.cache.del(key)));
    }
}
