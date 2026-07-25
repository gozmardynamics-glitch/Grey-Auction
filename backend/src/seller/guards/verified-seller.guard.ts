import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SellerVerificationStatus } from '../entities/seller.entity';
import { REQUIRE_VERIFICATION_KEY } from '../decorators/require-verification.decorator';

/**
 * Verified Seller Guard
 * Ensures that the seller is verified before accessing certain routes
 * 
 * This guard should be used AFTER SellerGuard
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, SellerGuard, VerifiedSellerGuard)
 * @RequireVerification()
 * @Post('products')
 * createProduct() {
 *   // Only verified sellers can access
 * }
 */
@Injectable()
export class VerifiedSellerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires verification
    const requiresVerification = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_VERIFICATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route doesn't require verification, allow access
    if (!requiresVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const seller = request.seller; // Set by SellerGuard

    if (!seller) {
      throw new ForbiddenException('Seller authentication required');
    }

    // Check verification status
    if (seller.verification_status !== SellerVerificationStatus.APPROVED) {
      throw new ForbiddenException(
        `Seller verification required. Current status: ${seller.verification_status}`,
      );
    }

    return true;
  }
}
