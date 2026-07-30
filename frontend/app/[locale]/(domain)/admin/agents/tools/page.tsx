export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agent Tools</h2>
      <p className="text-muted-foreground">All available tools that agents can use. Managed from <a href="/admin/agents" className="text-primary hover:underline">Agent Studio</a>.</p>
    </div>
  );
}
