import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new bidding room' })
  async create(@Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    const room = await this.roomService.create(dto, user.id);
    return { success: true, message: 'Room created', data: room };
  }

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.roomService.findAll(page || 1, limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  async findOne(@Param('id') id: string) {
    const room = await this.roomService.findById(id);
    return { success: true, data: room };
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a bidding room' })
  async join(@Param('id') id: string, @Body() dto: JoinRoomDto, @CurrentUser() user: any) {
    const participant = await this.roomService.joinRoom(id, user.id, dto);
    return { success: true, message: 'Joined room', data: participant };
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get room participants' })
  async getParticipants(@Param('id') id: string) {
    const participants = await this.roomService.getParticipants(id);
    return { success: true, data: participants };
  }
}
