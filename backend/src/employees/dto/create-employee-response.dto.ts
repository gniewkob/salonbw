import { ApiProperty } from '@nestjs/swagger';
import { EmployeeDto } from './employee.dto';

export class CreateEmployeeResponseDto {
    @ApiProperty({
        description: 'Created employee details',
        type: () => EmployeeDto,
    })
    employee: EmployeeDto;

    @ApiProperty({
        description: 'Plaintext password, returned only once.',
        type: String,
        example: 'TempPass123!',
    })
    password: string;
}
