import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Product } from '../products/product.entity';

@Entity('commissions')
export class Commission {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ type: () => User })
    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ApiProperty({ required: false, type: () => Appointment })
    @Index({ unique: true, where: 'appointmentId IS NOT NULL' })
    @ManyToOne(() => Appointment, { nullable: true, eager: true })
    appointment?: Appointment | null;

    @ApiProperty({ required: false, type: () => Product })
    @ManyToOne(() => Product, { nullable: true, eager: true })
    product?: Product | null;

    @ApiProperty()
    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    amount: number;

    @ApiProperty()
    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    percent: number;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
