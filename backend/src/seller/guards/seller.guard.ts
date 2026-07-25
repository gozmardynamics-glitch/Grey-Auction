import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller, SellerStatus } from '../entities/seller.entity';
import { SELLER_ONLY_KEY } from '../decorators/seller-only.decorator';

/**
 * Seller Guard
 * Verifies that the authenticated user is a seller and loads seller data
 * 
 * This guard:
 * 1. Checks if the route requires seller authentication
 * 2. Verifies user is authenticated (via JWT)
 * 3. Loads seller profile from database
 * 4. Checks seller account is not suspended/banned
 * 5. Attaches seller to request object
 */
@Injectable()
export class SellerGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Seller)
    private readonly sellerRepository: Repository<Seller>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route requires seller authentication
    const requiresSeller = this.reflector.getAllAndOverride<boolean>(
      SELLER_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If route doesn't require seller auth, allow access
    if (!requiresSeller) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JWT guard

    // Check if user is authenticated
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Load seller profile
    const seller = await this.sellerRepository.findOne({
      where: { user_id: user.id, deleted_at: null },
    });

    if (!seller) {
      throw new ForbiddenException('Seller account not found');
    }

    // Check if seller is suspended or banned
    if (seller.status === SellerStatus.SUSPENDED) {
      throw new ForbiddenException(
        `Seller account is suspended. Reason: ${seller.suspension_reason}`,
      );
    }

    if (seller.status === SellerStatus.BANNED) {
      throw new ForbiddenException('Seller account is banned');
    }

    // Attach seller to request
    request.seller = seller;

    return true;
  }
}
