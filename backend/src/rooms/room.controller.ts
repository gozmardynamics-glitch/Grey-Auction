import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
  @ApiOperation({ summary: 'List public rooms' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.roomService.findAll(page || 1, limit || 20);
  }

  /**
   * The caller's own rooms, join codes included. Declared before `:id` so the
   * literal path is not swallowed by the parameterised one.
   */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List the rooms I created' })
  async mine(@CurrentUser() user: any) {
    const data = await this.roomService.findBySeller(user.id);
    return { success: true, data };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get room by ID (private rooms are member-only)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const room = await this.roomService.findForViewer(id, user?.id);
    return { success: true, data: room };
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a bidding room' })
  async join(@Param('id') id: string, @Body() dto: JoinRoomDto, @CurrentUser() user: any) {
    const participant = await this.roomService.joinRoom(id, user, dto);
    return { success: true, message: 'Joined room', data: participant };
  }

  @Get(':id/participants')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get room participants' })
  async getParticipants(@Param('id') id: string, @CurrentUser() user: any) {
    const participants = await this.roomService.getParticipants(id, user?.id);
    return { success: true, data: participants };
  }
}
