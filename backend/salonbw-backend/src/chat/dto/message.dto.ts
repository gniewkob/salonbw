import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    appointmentId: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    message: string;
}
