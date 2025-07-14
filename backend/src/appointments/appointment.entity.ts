import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    OneToMany,
    Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../catalog/service.entity';
import { Formula } from '../formulas/formula.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Completed = 'completed',
    Cancelled = 'cancelled',
}
@Index(['employee', 'startTime'], { unique: true })
@Entity()
export class Appointment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    client: User;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @Column()
    startTime: Date;

    @Column({ nullable: true })
    endTime: Date;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Service, { eager: true })
    service: Service;

    @OneToMany(() => Formula, (formula) => formula.appointment)
    formulas: Formula[];

    @Column({ type: 'simple-enum', enum: AppointmentStatus, default: AppointmentStatus.Scheduled })
    status: AppointmentStatus;
}
