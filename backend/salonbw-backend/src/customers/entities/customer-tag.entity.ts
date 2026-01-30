import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('customer_tags')
export class CustomerTag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    color?: string;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'customer_tag_assignments',
        joinColumn: { name: 'tagId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    customers: User[];

    @CreateDateColumn()
    createdAt: Date;
}
