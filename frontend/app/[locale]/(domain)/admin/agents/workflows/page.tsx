import Link from 'next/link';

export default function WorkflowsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Workflows</h2>
      <p className="text-muted-foreground">Agent coordination workflows. Managed from <Link href="/admin/agents" className="text-primary hover:underline">Agent Studio</Link>.</p>
    </div>
  );
}
