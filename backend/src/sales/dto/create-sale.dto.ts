import { IsInt, Min, IsOptional } from 'class-validator';

export class CreateSaleDto {
    @IsInt()
    clientId: number;

    @IsInt()
    employeeId: number;

    @IsInt()
    productId: number;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsInt()
    @IsOptional()
    appointmentId?: number;
}
