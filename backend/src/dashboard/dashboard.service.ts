import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Appointment) private readonly appts: Repository<Appointment>,
  ) {}

  async getStats() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const clientCount = await this.users.count({ where: { role: Role.Client } });
    const employeeCount = await this.users.count({ where: { role: Not(Role.Client) } });
    const todayCount = await this.appts.count({
      where: {
        startTime: Between(start, end),
        status: AppointmentStatus.Scheduled,
      },
    });
    const upcoming = await this.appts.find({
      where: {
        startTime: MoreThan(now),
        status: AppointmentStatus.Scheduled,
      },
      order: { startTime: 'ASC' },
      take: 5,
    });
    return {
      clientCount,
      todayCount,
      employeeCount,
      upcoming,
    };
  }
}
