import AIFeaturesList from '../_islands/ai_features_list';
import { getAIFeatures } from '../_islands/ai-api';

export default async function AIFeaturesPage() {
  const features = await getAIFeatures();
  return <AIFeaturesList data={features} />;
}
