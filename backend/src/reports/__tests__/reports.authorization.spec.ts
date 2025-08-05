import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ReportsController } from '../reports.controller';
import { ReportsService } from '../reports.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Role } from '../../users/role.enum';

describe('ReportsController authorization', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [ReportsController],
            providers: [{ provide: ReportsService, useValue: {} }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: (ctx: any) => {
                    const req = ctx.switchToHttp().getRequest();
                    req.user = { id: 1, role: Role.Client };
                    return true;
                },
            })
            .overrideGuard(RolesGuard)
            .useValue({
                canActivate: (ctx: any) => {
                    const req = ctx.switchToHttp().getRequest();
                    return req.user?.role === Role.Admin;
                },
            })
            .compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('rejects non-admin access to financial report', () => {
        return request(app.getHttpServer()).get('/reports/financial').expect(403);
    });
});

