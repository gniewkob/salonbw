import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { User } from '../../users/user.entity';

@Entity('customer_groups')
export class CustomerGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true, type: 'text' })
    description?: string;

    @Column({ nullable: true })
    color?: string;

    @ManyToMany(() => User)
    @JoinTable({
        name: 'customer_group_members',
        joinColumn: { name: 'groupId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
    })
    members: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
