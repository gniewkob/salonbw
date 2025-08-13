import { AppointmentFormulasController } from './appointment-formulas.controller';
import { FormulasService } from './formulas.service';
import { Formula } from './formula.entity';
import { CreateFormulaDto } from './dto/create-formula.dto';

describe('AppointmentFormulasController', () => {
    let controller: AppointmentFormulasController;
    let service: jest.Mocked<FormulasService>;
    let formula: Formula;

    beforeEach(() => {
        formula = { id: 1 } as Formula;
        service = {
            addToAppointment: jest.fn().mockResolvedValue(formula),
        } as jest.Mocked<FormulasService>;
        controller = new AppointmentFormulasController(service);
    });

    it('delegates addFormula to service', async () => {
        const body: CreateFormulaDto = {
            description: 'Mix',
            date: '2023-01-01',
        };
        const addSpy = jest.spyOn(service, 'addToAppointment');
        await expect(
            controller.addFormula(1, body, { userId: 1 }),
        ).resolves.toBe(formula);
        expect(addSpy).toHaveBeenCalledWith(1, 1, {
            description: 'Mix',
            date: new Date('2023-01-01'),
        });
    });
});
