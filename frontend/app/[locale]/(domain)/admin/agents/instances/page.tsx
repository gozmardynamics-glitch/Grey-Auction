import { redirect } from 'next/navigation';

export default function AgentsInstancesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agent Instances</h2>
      <p className="text-muted-foreground">View and manage all agent instances from the <a href="/admin/agents" className="text-primary hover:underline">Agent Studio dashboard</a>.</p>
    </div>
  );
}
