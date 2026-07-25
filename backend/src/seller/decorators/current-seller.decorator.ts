import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Seller } from '../entities/seller.entity';

/**
 * Current Seller Decorator
 * Extracts the authenticated seller from the request
 * 
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentSeller() seller: Seller) {
 *   return seller;
 * }
 */
export const CurrentSeller = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Seller => {
    const request = ctx.switchToHttp().getRequest();
    return request.seller;
  },
);
