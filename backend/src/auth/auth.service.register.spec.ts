import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { RegisterClientDto } from './dto/register-client.dto';

describe('AuthService.registerClient', () => {
    let service: AuthService;
    let users: {
        findByEmail: jest.Mock;
        createUser: jest.Mock;
        updateRefreshToken: jest.Mock;
    };
    let jwt: { signAsync: jest.Mock };

    beforeEach(async () => {
        users = {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            updateRefreshToken: jest.fn(),
        };
        jwt = { signAsync: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: users },
                { provide: JwtService, useValue: jwt },
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
        jwt.signAsync.mockResolvedValue('jwt');

        const result = await service.registerClient(dto);
        expect(result).toHaveProperty('access_token', 'jwt');
        expect(result).toHaveProperty('refresh_token');
        expect(users.updateRefreshToken).toHaveBeenCalled();
        expect(jwt.signAsync).toHaveBeenCalledWith({
            sub: 1,
            role: Role.Client,
        });

        const passed = users.createUser.mock.calls[0][1];
        expect(passed).toBe(dto.password);
    });
});
