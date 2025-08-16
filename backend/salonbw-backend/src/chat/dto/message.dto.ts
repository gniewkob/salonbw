import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    appointmentId: number;

    @IsString()
    @IsNotEmpty()
    message: string;
}
