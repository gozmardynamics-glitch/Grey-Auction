'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/common';
import { apiFetch } from '@/shared/utils/api-client';

interface AgentMetric {
  id: string;
  agentId: string;
  agentName: string;
  eventType: string;
  latencyMs: string | number;
  success: boolean;
  errorMessage: string | null;
  costEstimate: string | number;
  createdAt: string;
}

const REFRESH_MS = 15000;

/**
 * Agent monitoring: the real execution metrics, not a placeholder.
 * `/admin/agents/metrics` returns the most recent rows; the summary is derived
 * from them so the numbers always agree with the table below.
 */
export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [agentFilter, setAgentFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const json = await apiFetch<{ data?: AgentMetric[] }>('admin/agents/metrics');
      setMetrics(Array.isArray(json.data) ? json.data : []);
      setLastUpdated(new Date());
    } catch {
      toast.error('Could not load agent metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [live, load]);

  const agents = useMemo(
    () => [...new Map(metrics.map((m) => [m.agentId, m.agentName])).entries()],
    [metrics],
  );

  const visible = useMemo(
    () => (agentFilter === 'all' ? metrics : metrics.filter((m) => m.agentId === agentFilter)),
    [metrics, agentFilter],
  );

  const summary = useMemo(() => {
    if (visible.length === 0) {
      return { total: 0, successRate: 0, avgLatency: 0, totalCost: 0, failures: 0 };
    }
    const failures = visible.filter((m) => !m.success).length;
    const latency = visible.reduce((sum, m) => sum + Number(m.latencyMs || 0), 0);
    const cost = visible.reduce((sum, m) => sum + Number(m.costEstimate || 0), 0);
    return {
      total: visible.length,
      successRate: ((visible.length - failures) / visible.length) * 100,
      avgLatency: latency / visible.length,
      totalCost: cost,
      failures,
    };
  }, [visible]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Execution metrics for every agent run, newest first.
            {lastUpdated && ` Updated ${lastUpdated.toLocaleTimeString('en-GB')}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[190px]" aria-label="Filter by agent">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name || id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={live ? 'default' : 'outline'}
            onClick={() => setLive((v) => !v)}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {live ? 'Live (15s)' : 'Paused'}
          </Button>
          <Button variant="outline" onClick={() => void load()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.successRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Avg latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(summary.avgLatency)} ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" /> Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.failures}</p>
            <p className="text-xs text-muted-foreground">
              est. cost {summary.totalCost.toFixed(4)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading metrics…</p>
          ) : visible.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No agent has run yet. Metrics appear here the first time an agent executes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">When</th>
                    <th className="px-4 py-2.5 font-medium">Agent</th>
                    <th className="px-4 py-2.5 font-medium">Event</th>
                    <th className="px-4 py-2.5 font-medium">Result</th>
                    <th className="px-4 py-2.5 font-medium">Latency</th>
                    <th className="px-4 py-2.5 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.slice(0, 100).map((m) => (
                    <tr key={m.id} className="border-t border-border/50 align-top">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {new Date(m.createdAt).toLocaleString('en-GB')}
                      </td>
                      <td className="px-4 py-2.5">{m.agentName || m.agentId.slice(0, 8)}</td>
                      <td className="px-4 py-2.5">{m.eventType}</td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={
                            m.success
                              ? 'bg-emerald-100 text-emerald-700 border-0'
                              : 'bg-red-100 text-red-700 border-0'
                          }
                        >
                          {m.success ? 'success' : 'failed'}
                        </Badge>
                        {!m.success && m.errorMessage && (
                          <p className="mt-1 max-w-[280px] truncate text-xs text-destructive">
                            {m.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{Math.round(Number(m.latencyMs || 0))} ms</td>
                      <td className="px-4 py-2.5">{Number(m.costEstimate || 0).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
