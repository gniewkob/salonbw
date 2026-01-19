import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { LogsController } from './logs.controller';
import { LogService } from './log.service';
import { GetLogsDto } from './dto/get-logs.dto';
import { LogAction } from './log-action.enum';
import { Log } from './log.entity';

describe('LogsController', () => {
    let controller: LogsController;
    let logService: jest.Mocked<LogService>;
    let configService: jest.Mocked<ConfigService>;
    let logger: jest.Mocked<PinoLogger>;

    beforeEach(async () => {
        logService = {
            findAll: jest.fn(),
            logAction: jest.fn(),
        } as unknown as jest.Mocked<LogService>;

        configService = {
            get: jest.fn(),
        } as unknown as jest.Mocked<ConfigService>;

        logger = {
            error: jest.fn(),
        } as unknown as jest.Mocked<PinoLogger>;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [LogsController],
            providers: [
                {
                    provide: LogService,
                    useValue: logService,
                },
                {
                    provide: ConfigService,
                    useValue: configService,
                },
                {
                    provide: PinoLogger,
                    useValue: logger,
                },
            ],
        }).compile();

        controller = module.get<LogsController>(LogsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getLogs', () => {
        it('should call logService.findAll with correct parameters', async () => {
            const dto = new GetLogsDto();
            dto.userId = 1;
            dto.action = LogAction.USER_LOGIN;
            dto.from = '2023-01-01T00:00:00Z';
            dto.to = '2023-01-31T23:59:59Z';
            dto.page = 2;
            dto.limit = 20;

            const expectedResult = {
                data: [] as Log[],
                total: 0,
                page: 2,
                limit: 20,
            };

            logService.findAll.mockResolvedValue(expectedResult);

            const result = await controller.getLogs(dto);

            expect(logService.findAll).toHaveBeenCalledWith({
                userId: 1,
                action: LogAction.USER_LOGIN,
                from: new Date('2023-01-01T00:00:00Z'),
                to: new Date('2023-01-31T23:59:59Z'),
                page: 2,
                limit: 20,
            });
            expect(result).toEqual(expectedResult);
        });

        it('should handle optional parameters', async () => {
            const dto = new GetLogsDto();
            // Defaults: page=1, limit=10

            const expectedResult = {
                data: [] as Log[],
                total: 0,
                page: 1,
                limit: 10,
            };

            logService.findAll.mockResolvedValue(expectedResult);

            await controller.getLogs(dto);

            expect(logService.findAll).toHaveBeenCalledWith({
                userId: undefined,
                action: undefined,
                from: undefined,
                to: undefined,
                page: 1,
                limit: 10,
            });
        });
    });
});
