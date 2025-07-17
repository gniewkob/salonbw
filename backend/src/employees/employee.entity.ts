import { Entity, Column, OneToMany, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { EmployeeRole } from './employee-role.enum';
import { EmployeeCommission } from '../commissions/employee-commission.entity';

// Employee accounts share the same table as regular users
// but are typed separately for clarity.
@Index(['email'], { unique: true })
@Entity('user')
export class Employee extends User {
    @Column({
        type: 'simple-enum',
        enum: EmployeeRole,
        default: EmployeeRole.FRYZJER,
    })
    declare role: EmployeeRole;

    @OneToMany(() => EmployeeCommission, (commission) => commission.employee)
    commissions: EmployeeCommission[];
}
