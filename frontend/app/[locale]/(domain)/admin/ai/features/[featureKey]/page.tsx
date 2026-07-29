import AIFeatureConfig from '../../_islands/ai_feature_config';
import { getAIFeature, getAllModels } from '../../_islands/ai-api';

export default async function AIFeatureConfigPage({ params }: { params: Promise<{ featureKey: string }> }) {
  const { featureKey } = await params;
  const feature = await getAIFeature(featureKey);
  const allModels = await getAllModels();
  if (!feature) return <div className="py-12 text-center text-muted-foreground">Feature config not found</div>;
  return <AIFeatureConfig feature={feature} allModels={allModels} />;
}
