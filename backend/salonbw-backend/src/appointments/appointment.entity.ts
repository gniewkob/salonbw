import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Formula } from '../formulas/formula.entity';

export enum AppointmentStatus {
    Scheduled = 'scheduled',
    Cancelled = 'cancelled',
    Completed = 'completed',
}

@Entity('appointments')
export class Appointment {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ type: () => User })
    @ManyToOne(() => User, { eager: true })
    client: User;

    @ApiProperty({ type: () => User })
    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ApiProperty({ type: () => Service })
    @ManyToOne(() => Service, { eager: true })
    service: Service;

    @ApiProperty()
    @Column()
    startTime: Date;

    @ApiProperty()
    @Column()
    endTime: Date;

    @ApiProperty({ enum: AppointmentStatus })
    @Column({
        type: 'simple-enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.Scheduled,
    })
    status: AppointmentStatus;

    @ApiProperty({ required: false })
    @Column({ nullable: true })
    notes?: string;

    @ApiProperty({ type: () => [Formula] })
    @OneToMany(() => Formula, (f) => f.appointment)
    formulas: Formula[];
}
