import { ClientFormulasController } from './client-formulas.controller';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';

describe('ClientFormulasController', () => {
    let controller: ClientFormulasController;
    let service: jest.Mocked<FormulasService>;
    let formulas: Formula[];

    beforeEach(() => {
        formulas = [{ id: 1 } as Formula];
        service = {
            findForClient: jest.fn().mockResolvedValue(formulas),
        } as jest.Mocked<FormulasService>;
        controller = new ClientFormulasController(service);
    });

    it('delegates findMine to service', async () => {
        const findSpy = jest.spyOn(service, 'findForClient');
        await expect(controller.findMine({ userId: 1 })).resolves.toBe(
            formulas,
        );
        expect(findSpy).toHaveBeenCalledWith(1);
    });

    it('delegates findForClient to service', async () => {
        const findSpy = jest.spyOn(service, 'findForClient');
        await expect(controller.findForClient(2)).resolves.toBe(formulas);
        expect(findSpy).toHaveBeenCalledWith(2);
    });
});
