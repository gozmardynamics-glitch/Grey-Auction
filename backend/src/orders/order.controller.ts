import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from an invoice (buyer)' })
  async create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.createFromInvoice(dto.invoiceId, user.id);
    return { success: true, message: 'Order created', data: order };
  }

  @Get()
  @ApiOperation({ summary: "List the current user's orders (buyer or seller)" })
  async list(@CurrentUser() user: any) {
    const orders = await this.orderService.listByUser(user.id);
    return { success: true, data: orders };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order (party only)' })
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    const order = await this.orderService.findById(id, user.id);
    return { success: true, data: order };
  }
}
