/**
 * Skrypt dodający testowych pracowników i wizyt
 * Uruchomienie: node scripts/add-test-data.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000'; // Lokalny backend
const ADMIN_EMAIL = 'kontakt@bodora.pl';
const ADMIN_PASSWORD = 'haslohaslo';

let authToken = null;

async function login() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        authToken = response.data.accessToken;
        console.log('✓ Zalogowano jako admin');
        return true;
    } catch (error) {
        console.error('✗ Błąd logowania:', error.message);
        return false;
    }
}

async function createEmployee(employeeData) {
    try {
        const response = await axios.post(
            `${API_BASE}/users`,
            employeeData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✓ Dodano pracownika: ${employeeData.name} (ID: ${response.data.id})`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`→ Pracownik ${employeeData.email} już istnieje`);
            // Pobierz istniejącego
            const users = await axios.get(
                `${API_BASE}/users?email=${employeeData.email}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            return users.data[0];
        }
        console.error(`✗ Błąd dodawania pracownika ${employeeData.name}:`, error.message);
        return null;
    }
}

async function createService(serviceData) {
    try {
        const response = await axios.post(
            `${API_BASE}/services`,
            serviceData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✓ Dodano usługę: ${serviceData.name} (ID: ${response.data.id})`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`→ Usługa ${serviceData.name} już istnieje`);
            const services = await axios.get(
                `${API_BASE}/services`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            return services.data.find(s => s.name === serviceData.name);
        }
        console.error(`✗ Błąd dodawania usługi:`, error.message);
        return null;
    }
}

async function createClient(clientData) {
    try {
        const response = await axios.post(
            `${API_BASE}/users`,
            clientData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✓ Dodano klienta: ${clientData.name} (ID: ${response.data.id})`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log(`→ Klient ${clientData.email} już istnieje`);
            const users = await axios.get(
                `${API_BASE}/users?email=${clientData.email}`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            return users.data[0];
        }
        console.error(`✗ Błąd dodawania klienta:`, error.message);
        return null;
    }
}

async function createAppointment(appointmentData) {
    try {
        const response = await axios.post(
            `${API_BASE}/appointments`,
            appointmentData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✓ Dodano wizytę: ${appointmentData.startTime} (ID: ${response.data.id})`);
        return response.data;
    } catch (error) {
        console.error(`✗ Błąd dodawania wizyty:`, error.message);
        return null;
    }
}

async function assignServiceToEmployee(employeeId, serviceId) {
    try {
        await axios.post(
            `${API_BASE}/employee-services`,
            { employeeId, serviceId },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log(`✓ Przypisano usługę ${serviceId} do pracownika ${employeeId}`);
    } catch (error) {
        console.error(`✗ Błąd przypisywania usługi:`, error.message);
    }
}

async function main() {
    console.log('=== Dodawanie testowych danych do SalonBW ===\n');
    
    // Logowanie
    if (!await login()) {
        process.exit(1);
    }

    // 1. Dodanie pracowników
    console.log('\n--- Dodawanie pracowników ---');
    const employee1 = await createEmployee({
        email: 'aleksandra.bodora@salon-bw.pl',
        password: 'test123',
        name: 'Aleksandra Bodora',
        role: 'employee',
        phone: '500111222',
        firstName: 'Aleksandra',
        lastName: 'Bodora'
    });

    const employee2 = await createEmployee({
        email: 'pracownik.testowy@salon-bw.pl',
        password: 'test123',
        name: 'Pracownik Testowy',
        role: 'employee',
        phone: '500333444',
        firstName: 'Pracownik',
        lastName: 'Testowy'
    });

    // 2. Dodanie usług
    console.log('\n--- Dodawanie usług ---');
    const service1 = await createService({
        name: 'Koloryzacja Ola - włosy długie',
        description: 'Pełna koloryzacja włosów długich',
        duration: 180,
        price: 350.00,
        priceType: 'fixed'
    });

    const service2 = await createService({
        name: 'Strzyżenie Damskie Ola - włosy średnie',
        description: 'Strzyżenie i modelowanie włosów średniej długości',
        duration: 60,
        price: 120.00,
        priceType: 'fixed'
    });

    const service3 = await createService({
        name: 'Botoks',
        description: 'Zabieg botoksem na włosy',
        duration: 90,
        price: 200.00,
        priceType: 'fixed'
    });

    // 3. Przypisanie usług do pracowników
    if (employee1 && service1) await assignServiceToEmployee(employee1.id, service1.id);
    if (employee1 && service2) await assignServiceToEmployee(employee1.id, service2.id);
    if (employee1 && service3) await assignServiceToEmployee(employee1.id, service3.id);
    if (employee2 && service1) await assignServiceToEmployee(employee2.id, service1.id);
    if (employee2 && service2) await assignServiceToEmployee(employee2.id, service2.id);

    // 4. Dodanie klientów
    console.log('\n--- Dodawanie klientów ---');
    const client1 = await createClient({
        email: 'klient.testowy1@example.com',
        password: 'test123',
        name: 'Anna Kowalska',
        role: 'client',
        phone: '600111222',
        firstName: 'Anna',
        lastName: 'Kowalska'
    });

    const client2 = await createClient({
        email: 'klient.testowy2@example.com',
        password: 'test123',
        name: 'Maria Nowak',
        role: 'client',
        phone: '600333444',
        firstName: 'Maria',
        lastName: 'Nowak'
    });

    const client3 = await createClient({
        email: 'klient.testowy3@example.com',
        password: 'test123',
        name: 'Katarzyna Wiśniewska',
        role: 'client',
        phone: '600555666',
        firstName: 'Katarzyna',
        lastName: 'Wiśniewska'
    });

    // 5. Dodanie wizyt na 8 lutego 2026
    console.log('\n--- Dodawanie wizyt (8 luty 2026) ---');
    
    if (client1 && employee1 && service1) {
        await createAppointment({
            clientId: client1.id,
            employeeId: employee1.id,
            serviceId: service1.id,
            startTime: '2026-02-08T09:00:00.000Z',
            endTime: '2026-02-08T12:00:00.000Z',
            status: 'scheduled',
            notes: 'Pierwsza wizyta - koloryzacja'
        });
    }

    if (client2 && employee2 && service2) {
        await createAppointment({
            clientId: client2.id,
            employeeId: employee2.id,
            serviceId: service2.id,
            startTime: '2026-02-08T10:30:00.000Z',
            endTime: '2026-02-08T11:30:00.000Z',
            status: 'confirmed',
            notes: 'Strzyżenie + modelowanie'
        });
    }

    if (client3 && employee1 && service3) {
        await createAppointment({
            clientId: client3.id,
            employeeId: employee1.id,
            serviceId: service3.id,
            startTime: '2026-02-08T14:00:00.000Z',
            endTime: '2026-02-08T15:30:00.000Z',
            status: 'in_progress',
            notes: 'Zabieg regenerujący'
        });
    }

    console.log('\n=== Zakończono dodawanie danych ===');
}

main().catch(console.error);
