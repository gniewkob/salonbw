import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/customer.entity';

@Entity()
export class Communication {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, {
        eager: true,
        nullable: true,
        onDelete: 'SET NULL',
    })
    customer: Customer | null;

    @Column()
    medium: string;

    @Column('text')
    content: string;

    @CreateDateColumn()
    timestamp: Date;
}
