import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { User, Gender } from '../src/users/user.entity';
import { Role } from '../src/users/role.enum';
import { Service } from '../src/services/service.entity';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { Commission } from '../src/commissions/commission.entity';
import { Review } from '../src/reviews/review.entity';
import * as bcrypt from 'bcrypt';
import { addDays, subDays } from 'date-fns';

loadEnv();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'salonbw',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: false,
});

async function seed() {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = AppDataSource.getRepository(User);
    const serviceRepo = AppDataSource.getRepository(Service);
    const appointmentRepo = AppDataSource.getRepository(Appointment);
    const commissionRepo = AppDataSource.getRepository(Commission);
    const reviewRepo = AppDataSource.getRepository(Review);

    // Get existing employees
    const employees = await userRepo.find({ where: { role: Role.Employee } });
    if (employees.length === 0) {
        console.log('❌ No employees found. Please create employees first.');
        process.exit(1);
    }
    console.log(`👥 Found ${employees.length} employees`);

    // Get existing services
    const services = await serviceRepo.find();
    if (services.length === 0) {
        console.log('❌ No services found. Please run import:services first.');
        process.exit(1);
    }
    console.log(`💇 Found ${services.length} services`);

    // Create test clients
    console.log('👤 Creating test clients...');
    const clientsData = [
        { name: 'Anna Kowalska', email: 'anna.kowalska@test.pl', phone: '500100100' },
        { name: 'Marek Nowak', email: 'marek.nowak@test.pl', phone: '500100101' },
        { name: 'Katarzyna Wiśniewska', email: 'kasia.w@test.pl', phone: '500100102' },
        { name: 'Piotr Dąbrowski', email: 'piotr.d@test.pl', phone: '500100103' },
        { name: 'Magdalena Szymańska', email: 'magda.s@test.pl', phone: '500100104' },
        { name: 'Tomasz Lewandowski', email: 'tomasz.l@test.pl', phone: '500100105' },
        { name: 'Joanna Wójcik', email: 'joanna.w@test.pl', phone: '500100106' },
        { name: 'Łukasz Kamiński', email: 'lukasz.k@test.pl', phone: '500100107' },
        { name: 'Natalia Pawlak', email: 'natalia.p@test.pl', phone: '500100108' },
        { name: 'Kamil Jankowski', email: 'kamil.j@test.pl', phone: '500100109' },
        { name: 'Patrycja Michalska', email: 'patrycja.m@test.pl', phone: '500100110' },
        { name: 'Szymon Zieliński', email: 'szymon.z@test.pl', phone: '500100111' },
        { name: 'Aleksandra Szymańska', email: 'ola.sz@test.pl', phone: '500100112' },
        { name: 'Grzegorz Woźniak', email: 'grzegorz.w@test.pl', phone: '500100113' },
        { name: 'Monika Kozłowska', email: 'monika.k@test.pl', phone: '500100114' },
    ];

    const clients: User[] = [];
    for (const clientData of clientsData) {
        let client = await userRepo.findOne({ where: { email: clientData.email } });
        if (!client) {
            const newClient = userRepo.create({
                ...clientData,
                role: Role.Client,
                password: await bcrypt.hash('test123', 10),
                gender: Math.random() > 0.5 ? Gender.Female : Gender.Male,
                createdAt: subDays(new Date(), Math.floor(Math.random() * 180)),
            } as any);
            const saved = await userRepo.save(newClient);
            client = Array.isArray(saved) ? saved[0] : saved;
        }
        if (client) clients.push(client);
    }
    console.log(`✅ ${clients.length} clients ready`);

    // Create appointments for last 3 months
    console.log('📅 Creating appointments...');
    const today = new Date();
    const appointments: any[] = [];

    for (let i = 0; i < 200; i++) {
        const date = subDays(today, Math.floor(Math.random() * 90));
        const hour = 9 + Math.floor(Math.random() * 9); // 9:00 - 17:00
        const startTime = new Date(date);
        startTime.setHours(hour, [0, 30][Math.floor(Math.random() * 2)], 0);
        
        const service = services[Math.floor(Math.random() * services.length)];
        const employee = employees[Math.floor(Math.random() * employees.length)];
        const client = clients[Math.floor(Math.random() * clients.length)];
        
        // 75% completed, 15% cancelled, 10% no-show
        const rand = Math.random();
        let status = AppointmentStatus.Scheduled;
        let finalizedAt: Date | null = null;
        let paidAmount: number | null = null;
        let tipAmount: number | null = null;
        let paymentMethod: string | null = null;

        if (rand < 0.75) {
            status = AppointmentStatus.Completed;
            finalizedAt = new Date(startTime);
            finalizedAt.setMinutes(finalizedAt.getMinutes() + (service?.duration || 60));
            paidAmount = Number(service?.price || 100) + Math.floor(Math.random() * 50);
            tipAmount = Math.random() > 0.6 ? Math.floor(Math.random() * 20) + 5 : 0;
            paymentMethod = ['cash', 'card', 'transfer'][Math.floor(Math.random() * 3)];
        } else if (rand < 0.9) {
            status = AppointmentStatus.Cancelled;
        } else {
            status = AppointmentStatus.NoShow;
        }

        const appointment = appointmentRepo.create({
            startTime,
            endTime: new Date(startTime.getTime() + (service?.duration || 60) * 60000),
            status,
            service,
            employee,
            client,
            price: Number(service?.price || 100),
            paidAmount,
            tipAmount,
            paymentMethod,
            finalizedAt,
            notes: Math.random() > 0.8 ? 'Notatka do wizyty testowej' : null,
        } as any);

        await appointmentRepo.save(appointment);
        appointments.push(appointment);

        // Create commission for completed appointments
        if (status === AppointmentStatus.Completed) {
            const commissionPercent = employee.commissionBase || 30;
            const commissionAmount = ((paidAmount || 0) * commissionPercent) / 100;
            
            const commission = commissionRepo.create({
                employee,
                appointment,
                amount: commissionAmount,
                percent: commissionPercent,
                createdAt: finalizedAt || startTime,
            } as any);
            await commissionRepo.save(commission);
        }

        // Create review for some completed appointments (35%)
        if (status === AppointmentStatus.Completed && Math.random() < 0.35) {
            const review = reviewRepo.create({
                appointment,
                client,
                employee,
                rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
                comment: [
                    'Świetna obsługa!',
                    'Bardzo polecam',
                    'Profesjonalnie wykonana usługa',
                    'Miła atmosfera',
                    'Jestem zadowolona',
                    'Super fryzura!',
                    'Na pewno wrócę',
                    'Polecam każdemu'
                ][Math.floor(Math.random() * 8)],
            } as any);
            await reviewRepo.save(review);
        }
    }
    console.log(`✅ Created ${appointments.length} appointments with commissions and reviews`);

    // Summary stats
    const completedAppointments = appointments.filter((a: any) => a.status === AppointmentStatus.Completed).length;
    const totalRevenue = appointments
        .filter((a: any) => a.status === AppointmentStatus.Completed)
        .reduce((sum: number, a: any) => sum + (a.paidAmount || 0), 0);
    const totalTips = appointments
        .filter((a: any) => a.status === AppointmentStatus.Completed)
        .reduce((sum: number, a: any) => sum + (a.tipAmount || 0), 0);
    
    const reviewCount = await reviewRepo.count();
    const commissionCount = await commissionRepo.count();

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${clients.length} clients`);
    console.log(`   - ${appointments.length} appointments (${completedAppointments} completed)`);
    console.log(`   - ${reviewCount} reviews added`);
    console.log(`   - ${commissionCount} commissions calculated`);
    console.log(`   - ${totalRevenue.toFixed(2)} PLN total revenue`);
    console.log(`   - ${totalTips.toFixed(2)} PLN total tips`);

    await AppDataSource.destroy();
    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
