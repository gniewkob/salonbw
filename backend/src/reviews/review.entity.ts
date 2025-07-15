import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Customer } from '../customers/customer.entity';

@Index(['reservationId'], { unique: true })
@Entity()
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    reservationId: number;

    @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
    reservation: Appointment;

    @ManyToOne(() => Customer, { eager: true })
    client: Customer;

    @Column('int')
    rating: number;

    @Column('text', { nullable: true })
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;
}
