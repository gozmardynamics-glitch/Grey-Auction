import Link from 'next/link';

export default function AgentsInstancesPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agent Instances</h2>
      <p className="text-muted-foreground">View and manage all agent instances from the <Link href="/admin/agents" className="text-primary hover:underline">Agent Studio dashboard</Link>.</p>
    </div>
  );
}
