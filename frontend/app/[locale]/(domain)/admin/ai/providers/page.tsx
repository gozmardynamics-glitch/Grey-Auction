import AIProvidersList from '../_islands/ai_providers_list';
import { getAIProviders } from '../_islands/ai-api';

export default async function AIProvidersPage() {
  const providers = await getAIProviders();
  return <AIProvidersList data={providers} />;
}
