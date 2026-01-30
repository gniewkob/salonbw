import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';

export enum NoteType {
    General = 'general',
    Warning = 'warning',
    Preference = 'preference',
    Medical = 'medical',
    Payment = 'payment',
}

@Entity('customer_notes')
export class CustomerNote {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    customer: User;

    @ManyToOne(() => User, { nullable: true })
    createdBy?: User;

    @Column({ type: 'text' })
    content: string;

    @Column({
        type: 'simple-enum',
        enum: NoteType,
        default: NoteType.General,
    })
    type: NoteType;

    @Column({ default: false })
    isPinned: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
