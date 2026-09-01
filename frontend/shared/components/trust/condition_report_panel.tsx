'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Defect {
  part: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
}

export interface ConditionReportView {
  id: string;
  productId: string;
  condition: string;
  grade: string;
  summary: string;
  defects: Defect[];
  inspectedAtLocation?: string | null;
  reporterName?: string | null;
  createdAt: string;
}

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-amber-100 text-amber-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-800',
};

function severityClass(s: Defect['severity']): string {
  return s === 'critical' ? 'text-red-600' : s === 'major' ? 'text-orange-600' : 'text-amber-600';
}

/**
 * Condition report panel (L4). Shows the current inspection report (condition,
 * grade, summary, defects) and toggles the full history. Read-only for buyers.
 */
export function ConditionReportPanel({ productId }: { productId?: string }) {
  const [report, setReport] = useState<ConditionReportView | null>(null);
  const [history, setHistory] = useState<ConditionReportView[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!productId) return;
    const base = API_BASE + '/products/' + encodeURIComponent(productId) + '/condition-report';
    fetch(base, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setReport(j?.data ?? null))
      .catch(() => {});
    fetch(base + '/history', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setHistory(Array.isArray(j?.data) ? j.data : []))
      .catch(() => {});
  }, [productId]);

  if (!productId) return null;
  if (!report) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        No condition report on file — contact the seller for an inspection.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Condition Report
            </span>
            <span
              data-testid="condition-grade"
              className={'rounded px-1.5 py-0.5 text-xs font-bold ' + (GRADE_COLOR[report.grade] || 'bg-muted')}
            >
              Grade {report.grade}
            </span>
          </div>
          <span className="text-xs capitalize text-muted-foreground">{report.condition.replace(/_/g, ' ')}</span>
        </div>
        <p className="text-sm text-foreground">{report.summary}</p>

        {report.defects.length > 0 && (
          <ul className="mt-2 space-y-1">
            {report.defects.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className={'mt-0.5 h-3.5 w-3.5 shrink-0 ' + severityClass(d.severity)} />
                <span>
                  <span className="font-medium capitalize">{d.part}</span>
                  <span className="text-muted-foreground"> ({d.severity})</span>: {d.description}
                </span>
              </li>
            ))}
          </ul>
        )}

        {history.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {open ? 'Hide' : 'Show'} {history.length - 1} earlier report{history.length - 1 === 1 ? '' : 's'}
          </button>
        )}

        {open && (
          <div className="mt-2 space-y-1 border-t border-border pt-2">
            {history.slice(1).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Grade {h.grade} · {h.condition.replace(/_/g, ' ')}</span>
                <span>{new Date(h.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConditionReportPanel;
