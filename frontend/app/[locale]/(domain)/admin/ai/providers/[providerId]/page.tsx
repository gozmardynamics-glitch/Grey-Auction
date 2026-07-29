import AIProviderForm from '../../_islands/ai_provider_form';
import { getAIProvider } from '../../_islands/ai-api';

export default async function AIProviderEditPage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const provider = await getAIProvider(providerId);
  if (!provider) return <div className="py-12 text-center text-muted-foreground">Provider not found</div>;
  return <AIProviderForm provider={provider} />;
}
