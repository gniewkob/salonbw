import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LogService } from '../logs/log.service';
import { User } from '../users/user.entity';
import { Response } from 'express';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: Partial<AuthService>;
    let usersService: Partial<UsersService>;
    let logService: Partial<LogService>;

    beforeEach(async () => {
        authService = {
            login: jest.fn().mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            }),
            refresh: jest.fn(),
        };

        usersService = {
            createUser: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' } as User),
        };

        logService = {
            logAction: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: UsersService, useValue: usersService },
                { provide: LogService, useValue: logService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should login user and return tokens', async () => {
        const user = { id: 1, email: 'test@example.com', role: 'client' } as unknown as User;
        const res = { cookie: jest.fn() } as unknown as Response;

        const result = await controller.login(user, res);

        expect(authService.login).toHaveBeenCalledWith(user, res);
        expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        expect(logService.logAction).toHaveBeenCalled();
    });

    it('should register user and log them in', async () => {
        const dto = { email: 'new@example.com', password: 'password', firstName: 'John', lastName: 'Doe', phone: '123456789' };
        const res = { cookie: jest.fn() } as unknown as Response;

        const result = await controller.register(dto, res);

        expect(usersService.createUser).toHaveBeenCalledWith(dto);
        expect(authService.login).toHaveBeenCalled();
        expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' });
        expect(logService.logAction).toHaveBeenCalled();
    });
});
