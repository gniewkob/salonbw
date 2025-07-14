import { IsString } from 'class-validator';

export class CreateAppointmentFormulaDto {
    @IsString()
    description: string;
}
