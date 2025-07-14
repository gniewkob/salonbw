import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateFormulaDto {
    @IsInt()
    clientId: number;

    @IsString()
    description: string;

    @IsOptional()
    @IsInt()
    appointmentId?: number;
}
