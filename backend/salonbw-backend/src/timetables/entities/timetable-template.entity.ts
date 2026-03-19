import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { TimetableTemplateDay } from './timetable-template-day.entity';

@Entity('timetable_templates')
export class TimetableTemplate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 20, default: 'color1' })
    colorClass: string;

    @OneToMany(() => TimetableTemplateDay, (day) => day.template, {
        cascade: true,
        eager: true,
    })
    days: TimetableTemplateDay[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
