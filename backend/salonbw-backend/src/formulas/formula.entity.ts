import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity('formulas')
export class Formula {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()
    description: string;

    @ApiProperty()
    @Column()
    date: Date;

    @ApiProperty({ type: () => User })
    @ManyToOne(() => User, { eager: true })
    client: User;

    @ApiProperty({ required: false, type: () => Appointment })
    @ManyToOne(() => Appointment, (a) => a.formulas, {
        eager: true,
        nullable: true,
    })
    appointment?: Appointment;
}
