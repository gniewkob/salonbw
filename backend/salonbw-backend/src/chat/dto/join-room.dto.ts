import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class JoinRoomDto {
    @Type(() => Number)
    @IsInt()
    @IsNotEmpty()
    appointmentId: number;
}
