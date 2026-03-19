import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import {
    CreateTimetableTemplateDto,
    UpdateTimetableTemplateDto,
} from './dto/timetable-template.dto';
import { TimetableTemplate } from './entities/timetable-template.entity';
import {
    TimetableTemplateDay,
    TimetableTemplateDayKind,
} from './entities/timetable-template-day.entity';

@Injectable()
export class TimetableTemplatesService {
    constructor(
        @InjectRepository(TimetableTemplate)
        private readonly templateRepository: Repository<TimetableTemplate>,
        @InjectRepository(TimetableTemplateDay)
        private readonly dayRepository: Repository<TimetableTemplateDay>,
        private readonly logService: LogService,
    ) {}

    async findAll(): Promise<TimetableTemplate[]> {
        const templates = await this.templateRepository.find({
            order: { id: 'ASC', days: { dayOfWeek: 'ASC' } },
        });
        return templates.map((template) => this.normalizeTemplate(template));
    }

    async findOne(id: number): Promise<TimetableTemplate> {
        const template = await this.templateRepository.findOne({
            where: { id },
        });
        if (!template) {
            throw new NotFoundException(
                `Szablon grafiku o ID ${id} nie został znaleziony`,
            );
        }
        return this.normalizeTemplate(template);
    }

    async create(
        dto: CreateTimetableTemplateDto,
        actor: User,
    ): Promise<TimetableTemplate> {
        this.validateDays(dto.days);

        const template = this.templateRepository.create({
            name: dto.name.trim(),
            colorClass: dto.colorClass,
            days: dto.days.map((day) =>
                this.dayRepository.create({
                    dayOfWeek: day.dayOfWeek,
                    kind: day.kind,
                    startTime:
                        day.kind === TimetableTemplateDayKind.Open
                            ? (day.startTime ?? null)
                            : null,
                    endTime:
                        day.kind === TimetableTemplateDayKind.Open
                            ? (day.endTime ?? null)
                            : null,
                }),
            ),
        });

        const saved = await this.templateRepository.save(template);

        await this.logService.logAction(actor, LogAction.TIMETABLE_CREATED, {
            entity: 'timetable_template',
            timetableTemplateId: saved.id,
            name: saved.name,
        });

        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateTimetableTemplateDto,
        actor: User,
    ): Promise<TimetableTemplate> {
        const template = await this.findOne(id);

        if (dto.name !== undefined) {
            template.name = dto.name.trim();
        }
        if (dto.colorClass !== undefined) {
            template.colorClass = dto.colorClass;
        }

        await this.templateRepository.save(template);

        if (dto.days) {
            this.validateDays(dto.days);
            await this.dayRepository.delete({ templateId: id });
            await this.dayRepository.save(
                dto.days.map((day) =>
                    this.dayRepository.create({
                        templateId: id,
                        dayOfWeek: day.dayOfWeek,
                        kind: day.kind,
                        startTime:
                            day.kind === TimetableTemplateDayKind.Open
                                ? (day.startTime ?? null)
                                : null,
                        endTime:
                            day.kind === TimetableTemplateDayKind.Open
                                ? (day.endTime ?? null)
                                : null,
                    }),
                ),
            );
        }

        await this.logService.logAction(actor, LogAction.TIMETABLE_UPDATED, {
            entity: 'timetable_template',
            timetableTemplateId: id,
            changes: dto,
        });

        return this.findOne(id);
    }

    async remove(id: number, actor: User): Promise<{ success: true }> {
        const template = await this.findOne(id);
        await this.templateRepository.remove(template);

        await this.logService.logAction(actor, LogAction.TIMETABLE_DELETED, {
            entity: 'timetable_template',
            timetableTemplateId: id,
            name: template.name,
        });

        return { success: true };
    }

    private validateDays(days: CreateTimetableTemplateDto['days']) {
        if (days.length !== 7) {
            throw new BadRequestException(
                'Szablon musi zawierać dokładnie 7 dni tygodnia',
            );
        }

        const uniqueDays = new Set(days.map((day) => day.dayOfWeek));
        if (uniqueDays.size !== 7) {
            throw new BadRequestException(
                'Każdy dzień tygodnia może wystąpić tylko raz',
            );
        }

        for (const day of days) {
            if (day.kind === TimetableTemplateDayKind.Open) {
                if (!day.startTime || !day.endTime) {
                    throw new BadRequestException(
                        'Dzień otwarty wymaga godzin rozpoczęcia i zakończenia',
                    );
                }
                if (day.startTime >= day.endTime) {
                    throw new BadRequestException(
                        'Godzina rozpoczęcia musi być wcześniejsza niż zakończenia',
                    );
                }
            }
        }
    }

    private normalizeTemplate(template: TimetableTemplate): TimetableTemplate {
        template.days = [...(template.days ?? [])].sort(
            (a, b) => a.dayOfWeek - b.dayOfWeek,
        );
        return template;
    }
}
