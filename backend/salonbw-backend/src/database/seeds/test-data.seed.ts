import { DataSource } from 'typeorm';
import { User } from '../../users/user.entity';
import { Service } from '../../services/service.entity';
import { EmployeeService } from '../../services/entities/employee-service.entity';
import { Appointment, AppointmentStatus } from '../../appointments/appointment.entity';
import { Role } from '../../users/role.enum';
import { PriceType } from '../../services/service.entity';

// Seed test data without service_categories (table may not exist in old migrations)

export default class TestDataSeed {
    async run(dataSource: DataSource): Promise<void> {
        const userRepo = dataSource.getRepository(User);
        const serviceRepo = dataSource.getRepository(Service);
        const employeeServiceRepo = dataSource.getRepository(EmployeeService);
        const appointmentRepo = dataSource.getRepository(Appointment);

        console.log('Seeding test data...');

        // 1. Create employees
        let employee1 = await userRepo.findOne({ where: { email: 'aleksandra.bodora@salon-bw.pl' } });
        if (!employee1) {
            employee1 = await userRepo.save({
                email: 'aleksandra.bodora@salon-bw.pl',
                password: '$2b$10$TestPasswordHash',
                name: 'Aleksandra Bodora',
                role: Role.Employee,
                phone: '500111222',
                firstName: 'Aleksandra',
                lastName: 'Bodora',
                receiveNotifications: true,
            });
        }

        let employee2 = await userRepo.findOne({ where: { email: 'pracownik.testowy@salon-bw.pl' } });
        if (!employee2) {
            employee2 = await userRepo.save({
                email: 'pracownik.testowy@salon-bw.pl',
                password: '$2b$10$TestPasswordHash',
                name: 'Pracownik Testowy',
                role: Role.Employee,
                phone: '500333444',
                firstName: 'Pracownik',
                lastName: 'Testowy',
                receiveNotifications: true,
            });
        }

        console.log(`✓ Employees: ${employee1?.id}, ${employee2?.id}`);

        // 2. Create services (without category - table may not exist)
        let service1 = await serviceRepo.findOne({ where: { name: 'Koloryzacja Ola - włosy długie' } });
        if (!service1) {
            service1 = await serviceRepo.save({
                name: 'Koloryzacja Ola - włosy długie',
                description: 'Pełna koloryzacja włosów długich',
                duration: 180,
                price: 350.00,
                priceType: PriceType.Fixed,
            });
        }

        let service2 = await serviceRepo.findOne({ where: { name: 'Strzyżenie Damskie Ola - włosy średnie' } });
        if (!service2) {
            service2 = await serviceRepo.save({
                name: 'Strzyżenie Damskie Ola - włosy średnie',
                description: 'Strzyżenie i modelowanie włosów średniej długości',
                duration: 60,
                price: 120.00,
                priceType: PriceType.Fixed,
            });
        }

        let service3 = await serviceRepo.findOne({ where: { name: 'Botoks' } });
        if (!service3) {
            service3 = await serviceRepo.save({
                name: 'Botoks',
                description: 'Zabieg botoksem na włosy',
                duration: 90,
                price: 200.00,
                priceType: PriceType.Fixed,
            });
        }

        console.log(`✓ Services: ${service1?.id}, ${service2?.id}, ${service3?.id}`);

        // 4. Assign services to employees
        if (employee1?.id && service1?.id) {
            await employeeServiceRepo.save({
                employeeId: employee1.id,
                serviceId: service1.id,
            }).catch(() => {});
        }
        if (employee1?.id && service2?.id) {
            await employeeServiceRepo.save({
                employeeId: employee1.id,
                serviceId: service2.id,
            }).catch(() => {});
        }
        if (employee1?.id && service3?.id) {
            await employeeServiceRepo.save({
                employeeId: employee1.id,
                serviceId: service3.id,
            }).catch(() => {});
        }
        if (employee2?.id && service1?.id) {
            await employeeServiceRepo.save({
                employeeId: employee2.id,
                serviceId: service1.id,
            }).catch(() => {});
        }
        if (employee2?.id && service2?.id) {
            await employeeServiceRepo.save({
                employeeId: employee2.id,
                serviceId: service2.id,
            }).catch(() => {});
        }

        // 5. Create test clients
        let client1 = await userRepo.findOne({ where: { email: 'klient.testowy1@example.com' } });
        if (!client1) {
            client1 = await userRepo.save({
                email: 'klient.testowy1@example.com',
                password: '$2b$10$TestPasswordHash',
                name: 'Anna Kowalska',
                role: Role.Client,
                phone: '600111222',
                firstName: 'Anna',
                lastName: 'Kowalska',
            });
        }

        let client2 = await userRepo.findOne({ where: { email: 'klient.testowy2@example.com' } });
        if (!client2) {
            client2 = await userRepo.save({
                email: 'klient.testowy2@example.com',
                password: '$2b$10$TestPasswordHash',
                name: 'Maria Nowak',
                role: Role.Client,
                phone: '600333444',
                firstName: 'Maria',
                lastName: 'Nowak',
            });
        }

        let client3 = await userRepo.findOne({ where: { email: 'klient.testowy3@example.com' } });
        if (!client3) {
            client3 = await userRepo.save({
                email: 'klient.testowy3@example.com',
                password: '$2b$10$TestPasswordHash',
                name: 'Katarzyna Wiśniewska',
                role: Role.Client,
                phone: '600555666',
                firstName: 'Katarzyna',
                lastName: 'Wiśniewska',
            });
        }

        console.log(`✓ Clients: ${client1?.id}, ${client2?.id}, ${client3?.id}`);

        // 6. Create appointments for 2026-02-08
        await appointmentRepo.delete({
            startTime: new Date('2026-02-08'),
        });

        if (client1?.id && employee1?.id && service1?.id) {
            await appointmentRepo.save({
                clientId: client1.id,
                employeeId: employee1.id,
                serviceId: service1.id,
                startTime: new Date('2026-02-08T09:00:00'),
                endTime: new Date('2026-02-08T12:00:00'),
                status: AppointmentStatus.Scheduled,
                notes: 'Pierwsza wizyta - koloryzacja',
            });
            console.log('✓ Appointment 1: 09:00 - Koloryzacja');
        }

        if (client2?.id && employee2?.id && service2?.id) {
            await appointmentRepo.save({
                clientId: client2.id,
                employeeId: employee2.id,
                serviceId: service2.id,
                startTime: new Date('2026-02-08T10:30:00'),
                endTime: new Date('2026-02-08T11:30:00'),
                status: AppointmentStatus.Confirmed,
                notes: 'Strzyżenie + modelowanie',
            });
            console.log('✓ Appointment 2: 10:30 - Strzyżenie');
        }

        if (client3?.id && employee1?.id && service3?.id) {
            await appointmentRepo.save({
                clientId: client3.id,
                employeeId: employee1.id,
                serviceId: service3.id,
                startTime: new Date('2026-02-08T14:00:00'),
                endTime: new Date('2026-02-08T15:30:00'),
                status: AppointmentStatus.InProgress,
                notes: 'Zabieg regenerujący',
            });
            console.log('✓ Appointment 3: 14:00 - Botoks');
        }

        console.log('\n✓ Test data seeding completed!');
    }
}
