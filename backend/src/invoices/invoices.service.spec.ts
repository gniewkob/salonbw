import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { InvoicesService } from './invoices.service';
import { Invoice } from './invoice.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('InvoicesService', () => {
    let service: InvoicesService;
    let loggerErrorSpy: jest.SpyInstance;
    const repo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
    } as any;
    const appts = { findOne: jest.fn() } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        axiosMock.post.mockReset();
        repo.create.mockReset();
        repo.save.mockReset();
        appts.findOne.mockReset();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InvoicesService,
                { provide: getRepositoryToken(Invoice), useValue: repo },
                { provide: getRepositoryToken(Appointment), useValue: appts },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(InvoicesService);
        loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        if (loggerErrorSpy) {
            loggerErrorSpy.mockRestore();
        }
    });

    it('generates invoice', async () => {
        appts.findOne.mockResolvedValue({
            id: 1,
            client: { firstName: 'c', lastName: 'd' },
            service: { name: 's', price: 10 },
        });
        axiosMock.post.mockResolvedValue({
            data: { number: '1/2024', pdf_url: 'link' },
        });
        repo.create.mockImplementation((d: any) => d);
        repo.save.mockImplementation((d: any) => d);
        const inv = await service.generate(1);
        expect(inv.number).toBe('1/2024');
        expect(repo.save).toHaveBeenCalled();
    });

    it('returns pdf url', async () => {
        repo.findOne.mockResolvedValue({ id: 1, pdfUrl: 'l' });
        const res = await service.getPdf(1);
        expect(res.pdfUrl).toBe('l');
    });

    it('logs on failure', async () => {
        appts.findOne.mockResolvedValue({
            id: 1,
            client: { firstName: 'c', lastName: 'd' },
            service: { name: 's', price: 10 },
        });
        axiosMock.post.mockRejectedValue(new Error('fail'));
        await expect(service.generate(1)).rejects.toThrow('fail');
    });
});
