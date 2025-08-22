import {
    Controller,
    Get,
    Param,
    UseGuards,
    ForbiddenException,
    NotFoundException,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { Appointment } from '../appointments/appointment.entity';
import { ChatService } from './chat.service';
import { ChatMessage } from './chat-message.entity';

@ApiTags('appointments')
@Controller('appointments')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
    ) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get(':id/chat')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get chat messages for an appointment' })
    @ApiResponse({
        status: 200,
        description: 'List of chat messages',
        type: ChatMessage,
        isArray: true,
    })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Appointment not found' })
    async getChat(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<ChatMessage[]> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id },
            relations: ['client', 'employee'],
        });
        if (!appointment) {
            throw new NotFoundException();
        }
        if (
            user.role !== Role.Admin &&
            appointment.client.id !== user.userId &&
            appointment.employee.id !== user.userId
        ) {
            throw new ForbiddenException();
        }
        return this.chatService.findMessages(id);
    }
}
