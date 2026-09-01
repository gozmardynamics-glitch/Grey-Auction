import Link from 'next/link';

export default function WorkflowEditPage() {
  return (
    <div className="space-y-4"><p className="text-muted-foreground">Workflow editor — managed from <Link href="/admin/agents" className="text-primary hover:underline">Agent Studio</Link>.</p></div>
  );
}
