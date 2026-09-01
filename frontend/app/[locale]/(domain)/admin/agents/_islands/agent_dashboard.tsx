'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/common/card';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';
import { DataTable } from '@/shared/components/common/data_table';
import { MiniSpinner } from '@/shared/components/common/spinner';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { getAgentDashboard, runGapAnalysis, discoverCapabilities } from './agents-api';

interface AgentDashboardData {
  totalAgents: number; activeAgents: number; agentsByCategory: Record<string, number>;
  totalTools: number; activeTools: number; totalWorkflows: number; activeWorkflows: number;
  totalExecutions: number; successRate: string; recentMetrics: unknown[];
}

interface GapItem {
  severity: string; area: string; description: string; suggestedAction: string;
}

interface GapAnalysisResult {
  totalGaps: number; estimatedEffort: string; gaps?: GapItem[];
}

interface AgentInstance {
  id: string; name: string; displayName: string; category: string; isEnabled: boolean; status: string;
  totalExecutions: number; successRate: number; toolIds: string[];
}

const categoryColors: Record<string, string> = {
  marketing: 'bg-blue-100 text-blue-800', security: 'bg-red-100 text-red-800',
  sales: 'bg-green-100 text-green-800', support: 'bg-purple-100 text-purple-800',
  crm: 'bg-orange-100 text-orange-800', operations: 'bg-teal-100 text-teal-800',
  custom: 'bg-gray-100 text-gray-800',
};

export default function AgentDashboard() {
  const [data, setData] = useState<AgentDashboardData | null>(null);
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);

  const fetchData = useCallback(() => {
    Promise.all([
      getAgentDashboard(),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/agents/instances`).then((r) => r.json()),
    ])
      .then(([dash, agts]) => {
        setData(dash);
        setAgents(agts?.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = (await runGapAnalysis()) as GapAnalysisResult;
      setGapResult(result);
      toast.success(`Analysis complete: ${result.totalGaps} gaps found (${result.estimatedEffort})`);
    } catch { toast.error('Analysis failed'); } finally { setAnalyzing(false); }
  };

  const handleDiscover = async () => {
    try {
      const result = await discoverCapabilities();
      toast.success(`Discovered ${result.suggestions?.length || 0} optimization opportunities`);
    } catch { toast.error('Discovery failed'); }
  };

  if (loading) return <div className="flex justify-center py-12"><MiniSpinner /></div>;
  if (!data) return <div className="text-center py-12 text-muted-foreground">No data available</div>;

  const agentColumns: ColumnDef<AgentInstance>[] = [
    { accessorKey: 'displayName', header: 'Agent', cell: ({ row }) => <Link href={`/admin/agents/instances/${row.original.id}`} className="text-primary hover:underline font-medium">{row.original.displayName}</Link> },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge className={categoryColors[row.original.category] || ''}>{row.original.category}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.original.status; return <Badge variant={s === 'active' ? 'default' : s === 'error' ? 'destructive' : 'secondary'}>{s}</Badge>; } },
    { accessorKey: 'totalExecutions', header: 'Runs' },
    { accessorKey: 'successRate', header: 'Success', cell: ({ row }) => `${Number(row.original.successRate).toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Studio</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscover}><Zap className="mr-2 h-4 w-4" />Discover</Button>
          <Button onClick={handleAnalyze} disabled={analyzing}>{analyzing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}Update & Analyze</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Total Agents</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totalAgents}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{data.activeAgents}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Tools</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.activeTools}/{data.totalTools}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Workflows</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.activeWorkflows}/{data.totalWorkflows}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Executions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totalExecutions.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs">Success Rate</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.successRate}</div></CardContent></Card>
      </div>

      {data.agentsByCategory && Object.keys(data.agentsByCategory).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.agentsByCategory).map(([cat, count]) => (
            <Badge key={cat} className={categoryColors[cat] || ''}>{cat}: {count}</Badge>
          ))}
        </div>
      )}

      {gapResult && (
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Analysis Results — {gapResult.totalGaps} Gaps ({gapResult.estimatedEffort})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {gapResult.gaps?.map((g: GapItem, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm border-b pb-2">
                  <Badge variant={g.severity === 'critical' ? 'destructive' : g.severity === 'high' ? 'default' : 'secondary'} className="shrink-0 mt-0.5">{g.severity}</Badge>
                  <div><strong>{g.area}:</strong> {g.description}<br /><span className="text-muted-foreground">{g.suggestedAction}</span></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Agent Instances</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={agentColumns} data={agents} emptyTitle="No Agents" emptyDescription="Create your first AI agent." />
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/admin/agents/instances" className="text-sm text-primary hover:underline">Manage Agents</Link>
        <Link href="/admin/agents/tools" className="text-sm text-primary hover:underline">Manage Tools</Link>
        <Link href="/admin/agents/workflows" className="text-sm text-primary hover:underline">Manage Workflows</Link>
        <Link href="/admin/agents/monitoring" className="text-sm text-primary hover:underline">Monitoring</Link>
      </div>
    </div>
  );
}
