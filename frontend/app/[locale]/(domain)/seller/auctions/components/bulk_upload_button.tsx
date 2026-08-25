'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/common';
import { useAppSelector } from '@/redux/store';

const TEMPLATE_CSV = [
  'title,description,starting_bid,category,sub_category,end_time,city,country,country_code',
  '2022 Toyota Camry Hybrid,Excellent condition,2000000,Transport and Logistics,Vehicles,2026-12-31T23:59:59Z,Lagos,Nigeria,NG',
  'MacBook Pro 16" M3 Pro,Like new,1500000,Electronics,Laptops,2026-12-31T23:59:59Z,Abuja,Nigeria,NG',
].join('\n');

export default function BulkUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const authToken = useAppSelector((state) => state.auth.token);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'greyauction-bulk-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!authToken) {
      toast.error('Please sign in as a seller first');
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(apiBase + '/products/bulk', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + authToken },
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || 'Bulk upload failed');
        return;
      }
      setResult({
        created: json.data?.created?.length ?? 0,
        failed: json.data?.errors?.length ?? 0,
      });
      toast.success(json.message || 'Upload complete');
    } catch {
      toast.error('Network error — is the API running on port 3001?');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={onFile}
      />
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="h-4 w-4" />
        Template
      </Button>
      <Button variant="default" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
        <UploadCloud className="h-4 w-4" />
        {uploading ? 'Uploading...' : 'Bulk Upload CSV'}
      </Button>
      {result && (
        <span className="flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {result.created} created
          {result.failed > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-4 w-4" /> {result.failed} failed
            </span>
          )}
        </span>
      )}
    </div>
  );
}
