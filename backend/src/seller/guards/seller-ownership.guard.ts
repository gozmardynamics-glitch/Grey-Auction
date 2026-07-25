import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Metadata key for ownership check
 */
export const OWNERSHIP_PARAM_KEY = 'ownershipParam';

/**
 * Decorator to specify which parameter to check for ownership
 * 
 * Usage:
 * @CheckOwnership('seller_id')
 * @Patch('products/:id')
 * updateProduct(@Param('id') id: string) {
 *   // Only the owner seller can update
 * }
 */
export const CheckOwnership = (paramName: string = 'seller_id') =>
  Reflect.metadata(OWNERSHIP_PARAM_KEY, paramName);

/**
 * Seller Ownership Guard
 * Ensures that the seller can only access/modify their own resources
 * 
 * This guard should be used AFTER SellerGuard
 * 
 * By default, it checks if the route parameter 'seller_id' matches the current seller's ID
 * You can specify a different parameter using @CheckOwnership('param_name')
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, SellerGuard, SellerOwnershipGuard)
 * @CheckOwnership('seller_id')
 * @Get('products/:id')
 * getProduct(@Param('id') id: string) {
 *   // Only the owner seller can view
 * }
 */
@Injectable()
export class SellerOwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const seller = request.seller; // Set by SellerGuard

    if (!seller) {
      throw new ForbiddenException('Seller authentication required');
    }

    // Get the parameter name to check (default: 'seller_id')
    const paramName = this.reflector.get<string>(
      OWNERSHIP_PARAM_KEY,
      context.getHandler(),
    ) || 'seller_id';

    // Get the value from route params, query, or body
    const resourceSellerId =
      request.params[paramName] ||
      request.query[paramName] ||
      request.body[paramName];

    // If no seller_id in the request, skip ownership check
    // (This allows endpoints that don't have seller_id in the path)
    if (!resourceSellerId) {
      return true;
    }

    // Verify ownership
    if (resourceSellerId !== seller.id) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
