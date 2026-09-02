import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderApiResponseDto, OrderListApiResponseDto } from './dto/order-response.dto';
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

  @Post('buy-now/:productId')
  @ApiOperation({ summary: 'Buy a direct-sale lot now (U5: fees apply)' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderApiResponseDto })
  async buyNow(@CurrentUser() user: any, @Param('productId') productId: string) {
    const order = await this.orderService.createForBuyNow(productId, user.id);
    return { success: true, message: 'Order created', data: order };
  }

  @Post()
  @ApiOperation({ summary: 'Create an order from an invoice (buyer)' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderApiResponseDto })
  async create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    const order = await this.orderService.createFromInvoice(dto.invoiceId, user.id);
    return { success: true, message: 'Order created', data: order };
  }

  @Get()
  @ApiOperation({ summary: "List the current user's orders (buyer or seller)" })
  @ApiResponse({ status: 200, description: 'Orders', type: OrderListApiResponseDto })
  async list(@CurrentUser() user: any) {
    const orders = await this.orderService.listByUser(user.id);
    return { success: true, data: orders };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order (party only)' })
  @ApiResponse({ status: 200, description: 'Order', type: OrderApiResponseDto })
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    const order = await this.orderService.findById(id, user.id);
    return { success: true, data: order };
  }
}