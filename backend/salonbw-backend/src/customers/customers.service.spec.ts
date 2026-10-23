import { Repository } from 'typeorm';
import { CustomersService } from './customers.service';
import { User } from '../users/user.entity';

describe('CustomersService.create', () => {
    const createService = () => {
        const saved: Partial<User>[] = [];
        const usersRepo = {
            create: jest.fn((data: Partial<User>) => ({ ...data })),
            save: jest.fn((entity: Partial<User>) => {
                const row = { id: 13, ...entity };
                saved.push(row);
                return Promise.resolve(row);
            }),
        } as unknown as Repository<User>;
        const unused = {} as Repository<never>;
        const service = new CustomersService(
            null,
            usersRepo,
            unused,
            unused,
            unused,
            unused,
            unused,
            unused,
        );
        return { service, saved };
    };

    // Staff create clients who have no login yet (phone bookings, and soon the
    // historical import). Their account still needs a password value; it was
    // stored as plain text and echoed back in the API response.
    it('stores a hashed, unusable password and never returns it', async () => {
        const { service, saved } = createService();

        const result = await service.create({
            firstName: 'Halina',
            lastName: 'Telefoniczna',
            phone: '601202303',
        });

        expect(saved[0].password).toMatch(/^\$2[aby]\$\d{2}\$/);
        expect(result).not.toHaveProperty('password');
        expect(result).toMatchObject({ id: 13, name: 'Halina Telefoniczna' });
    });

    it('gives every created client a different secret', async () => {
        const { service, saved } = createService();

        await service.create({ firstName: 'A', phone: '600000001' });
        await service.create({ firstName: 'B', phone: '600000002' });

        expect(saved[0].password).not.toEqual(saved[1].password);
    });
});
