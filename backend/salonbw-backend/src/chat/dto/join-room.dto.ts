import { IsNumber, IsNotEmpty } from 'class-validator';

export class JoinRoomDto {
    @IsNumber()
    @IsNotEmpty()
    appointmentId: number;
}
