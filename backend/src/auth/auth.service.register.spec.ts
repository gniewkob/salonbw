import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';
import { LogsService } from '../logs/logs.service';

describe('AuthService.registerClient', () => {
    let service: AuthService;
    let users: {
        findByEmail: jest.Mock;
        createUser: jest.Mock;
        updateRefreshToken: jest.Mock;
    };
    let jwt: { signAsync: jest.Mock };
    let logs: { create: jest.Mock };

    beforeEach(async () => {
        users = {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            updateRefreshToken: jest.fn(),
        };
        jwt = { signAsync: jest.fn() };
        logs = { create: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: users },
                { provide: JwtService, useValue: jwt },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('returns tokens and creates user with provided password', async () => {
        const dto: RegisterClientDto = {
            email: 'a@test.com',
            password: 'secret',
            name: 'Alice',
        };
        users.findByEmail.mockResolvedValue(null);
        users.createUser.mockResolvedValue({
            id: 1,
            email: dto.email,
            role: Role.Client,
        });
        jwt.signAsync
            .mockResolvedValueOnce('access')
            .mockResolvedValueOnce('refresh');

        const result = await service.registerClient(dto);
        expect(result).toEqual({ access_token: 'access', refresh_token: 'refresh' });
        expect(users.updateRefreshToken).toHaveBeenCalledWith(1, 'refresh');
        expect(jwt.signAsync).toHaveBeenNthCalledWith(1, {
            sub: 1,
            role: Role.Client,
        });
        expect(jwt.signAsync).toHaveBeenNthCalledWith(
            2,
            { sub: 1 },
            expect.objectContaining({ secret: expect.any(String) }),
        );

        const passed = users.createUser.mock.calls[0][1];
        expect(passed).toBe(dto.password);
    });
});
