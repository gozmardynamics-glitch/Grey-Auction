import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for requiring verified seller status
 */
export const REQUIRE_VERIFICATION_KEY = 'requireVerification';

/**
 * Require Verification Decorator
 * Marks a route as requiring verified seller status
 * 
 * Usage:
 * @RequireVerification()
 * @Post('products')
 * createProduct() {
 *   // Only verified sellers can access
 * }
 */
export const RequireVerification = () => SetMetadata(REQUIRE_VERIFICATION_KEY, true);
