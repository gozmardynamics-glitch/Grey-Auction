import { redirect } from 'next/navigation';

export default async function AIModelEditPage({ params }: { params: Promise<{ providerId: string; modelId: string }> }) {
  const { providerId } = await params;
  return redirect(`/admin/ai/providers/${providerId}/models`);
}
