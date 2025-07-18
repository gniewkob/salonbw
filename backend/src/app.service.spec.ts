import { AppService } from './app.service';

describe('AppService', () => {
    it('getHello returns greeting', () => {
        const service = new AppService();
        expect(service.getHello()).toBe('Hello World!');
    });
});
