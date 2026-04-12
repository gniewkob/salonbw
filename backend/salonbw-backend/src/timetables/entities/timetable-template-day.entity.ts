import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from 'typeorm';
import { DayOfWeek } from './timetable-slot.entity';
import { TimetableTemplate } from './timetable-template.entity';

export enum TimetableTemplateDayKind {
    Open = 'open',
    DayOff = 'dayoff',
    Closed = 'closed',
}

@Entity('timetable_template_days')
export class TimetableTemplateDay {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    templateId: number;

    @ManyToOne(() => TimetableTemplate, (template) => template.days, {
        onDelete: 'CASCADE',
    })
    template: TimetableTemplate;

    @Column({
        type: 'smallint',
        comment: '0=Monday, 6=Sunday (ISO week)',
    })
    dayOfWeek: DayOfWeek;

    @Column({
        type: 'simple-enum',
        enum: TimetableTemplateDayKind,
        default: TimetableTemplateDayKind.Open,
    })
    kind: TimetableTemplateDayKind;

    @Column({ type: 'time', nullable: true })
    startTime?: string | null;

    @Column({ type: 'time', nullable: true })
    endTime?: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
