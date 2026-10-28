import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';

import { StepUpGuard } from '../guards/step-up.guard';

export const STEP_UP_KEY = 'require_step_up';

/**
 * Marks a route as consequential enough to need a *recent* second-factor proof,
 * not just a valid session. Applied to anything that moves money or changes a
 * person's standing: escrow refunds and releases, wallet credits, account
 * suspension, administrator management, and the MFA policy itself.
 *
 * Guard and metadata go together on purpose. Wiring them separately left one
 * route guarded-but-unmarked, and an unmarked route silently allows the request
 * — the guard had nothing to look for. One decorator, no way to half-apply it.
 */
export const RequireStepUp = () => applyDecorators(UseGuards(StepUpGuard), SetMetadata(STEP_UP_KEY, true));
