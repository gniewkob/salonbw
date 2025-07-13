import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client, Role.Employee)
export class MessagesController {
    constructor(private readonly service: MessagesService) {}

    @Get()
    list(@Request() req) {
        return this.service.findForUser(req.user.id);
    }

    @Post()
    create(@Request() req, @Body() dto: CreateMessageDto) {
        return this.service.create(req.user.id, dto.recipientId, dto.content);
    }
}
