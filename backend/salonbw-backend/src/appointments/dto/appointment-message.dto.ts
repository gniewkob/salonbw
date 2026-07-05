import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AppointmentMessageDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    body: string;
}
