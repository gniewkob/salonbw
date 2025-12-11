import { IsString, IsNumber, IsNotEmpty, Length } from 'class-validator';

export class MessageDto {
    @IsNumber()
    @IsNotEmpty()
    appointmentId: number;

    @IsString()
    @IsNotEmpty()
    @Length(1, 500)
    message: string;
}
