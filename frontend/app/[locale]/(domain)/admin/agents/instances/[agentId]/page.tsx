import { redirect } from 'next/navigation';

export default function AgentEditPage({ params }: { params: Promise<{ agentId: string }> }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Agent detail view — managed from <a href="/admin/agents" className="text-primary hover:underline">Agent Studio</a>.</p>
    </div>
  );
}
