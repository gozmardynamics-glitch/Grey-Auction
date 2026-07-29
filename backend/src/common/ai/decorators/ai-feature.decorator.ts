import { SetMetadata } from '@nestjs/common';

export const AI_FEATURE_KEY = 'ai_feature_key';
export const AIFeature = (featureKey: string) => SetMetadata(AI_FEATURE_KEY, featureKey);
