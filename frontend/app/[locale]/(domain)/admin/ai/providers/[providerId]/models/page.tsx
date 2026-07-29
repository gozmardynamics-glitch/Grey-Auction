import AIModelList from '../../../_islands/ai_model_list';
import { getProviderModels, getAIProvider } from '../../../_islands/ai-api';

export default async function AIProviderModelsPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const models = await getProviderModels(providerId);
  const provider = await getAIProvider(providerId);
  return <AIModelList models={models} providerId={providerId} providerName={provider?.displayName || providerId} />;
}
