import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentSection } from './entities/content-section.entity';

@Injectable()
export class ContentService {
    constructor(
        @InjectRepository(ContentSection)
        private readonly contentRepository: Repository<ContentSection>,
    ) {}

    async getAllSections(isActive?: boolean): Promise<ContentSection[]> {
        const where = isActive !== undefined ? { isActive } : {};
        return this.contentRepository.find({ where, order: { key: 'ASC' } });
    }

    async getSectionByKey(key: string): Promise<ContentSection> {
        const section = await this.contentRepository.findOne({
            where: { key, isActive: true },
        });
        if (!section) {
            throw new NotFoundException(`Content section '${key}' not found`);
        }
        return section;
    }

    async upsertSection(
        key: string,
        data: Record<string, unknown>,
        description?: string,
    ): Promise<ContentSection> {
        const existing = await this.contentRepository.findOne({
            where: { key },
        });
        if (existing) {
            existing.data = data;
            if (description !== undefined) {
                existing.description = description;
            }
            return this.contentRepository.save(existing);
        }
        const section = this.contentRepository.create({
            key,
            data,
            description: description || null,
        });
        return this.contentRepository.save(section);
    }
}
