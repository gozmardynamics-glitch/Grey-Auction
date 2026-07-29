import AIDashboard from './_islands/ai_dashboard';
import { getAIProviders, getAIUsageSummary } from './_islands/ai-api';

export default async function AIPage() {
  const providers = await getAIProviders();
  const summary = await getAIUsageSummary();
  return <AIDashboard providers={providers} summary={summary} />;
}
