import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for seller-only routes
 */
export const SELLER_ONLY_KEY = 'sellerOnly';

/**
 * Seller Only Decorator
 * Marks a route as accessible only by sellers
 * 
 * Usage:
 * @SellerOnly()
 * @Get('dashboard')
 * getDashboard() {
 *   // Only sellers can access
 * }
 */
export const SellerOnly = () => SetMetadata(SELLER_ONLY_KEY, true);
