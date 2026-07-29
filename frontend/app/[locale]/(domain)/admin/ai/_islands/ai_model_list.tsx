'use client';

import { useCallback, useState } from 'react';
import { DataTable } from '@/shared/components/common/data_table';
import { Badge } from '@/shared/components/common/badge';
import { Button } from '@/shared/components/common/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/common/dialog';
import { Input } from '@/shared/components/common/input';
import { Label } from '@/shared/components/common/label';
import { Switch } from '@/shared/components/common/switch';
import { toast } from 'sonner';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, Edit } from 'lucide-react';
import type { LLMModel } from '../../models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AIModelListProps {
  models: LLMModel[];
  providerId: string;
  providerName: string;
}

export default function AIModelList({ models: initialModels, providerId, providerName }: AIModelListProps) {
  const [models, setModels] = useState<LLMModel[]>(initialModels);
  const [open, setOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [form, setForm] = useState({
    modelId: '', displayName: '', capabilities: '',
    inputPricePerMillion: '0', outputPricePerMillion: '0',
    contextWindow: '4096', maxOutputTokens: '2048',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchModels = useCallback(async () => {
    const res = await fetch(`${API_URL}/admin/ai/providers/${providerId}/models`);
    const json = await res.json();
    setModels(json.data || []);
  }, [providerId]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const url = editingModel
        ? `${API_URL}/admin/ai/providers/${providerId}/models/${editingModel.id}`
        : `${API_URL}/admin/ai/providers/${providerId}/models`;
      const method = editingModel ? 'PATCH' : 'POST';
      const payload = {
        displayName: form.displayName,
        modelId: form.modelId,
        capabilities: form.capabilities ? form.capabilities.split(',').map((s) => s.trim()).filter(Boolean) : [],
        inputPricePerMillion: Number(form.inputPricePerMillion),
        outputPricePerMillion: Number(form.outputPricePerMillion),
        contextWindow: Number(form.contextWindow),
        maxOutputTokens: Number(form.maxOutputTokens),
        isActive: form.isActive,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editingModel ? 'Model updated' : 'Model created');
        setOpen(false);
        setEditingModel(null);
        setForm({ modelId: '', displayName: '', capabilities: '', inputPricePerMillion: '0', outputPricePerMillion: '0', contextWindow: '4096', maxOutputTokens: '2048', isActive: true });
        await fetchModels();
      } else {
        toast.error('Failed to save model');
      }
    } catch {
      toast.error('Failed to save model');
    } finally {
      setSubmitting(false);
    }
  }, [form, editingModel, providerId, fetchModels]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`${API_URL}/admin/ai/providers/${providerId}/models/${id}`, { method: 'DELETE' });
      toast.success('Model deleted');
      await fetchModels();
    } catch {
      toast.error('Failed to delete model');
    }
  }, [providerId, fetchModels]);

  const openEdit = (model: LLMModel) => {
    setEditingModel(model);
    setForm({
      modelId: model.modelId,
      displayName: model.displayName,
      capabilities: (model.capabilities || []).join(', '),
      inputPricePerMillion: String(model.inputPricePerMillion),
      outputPricePerMillion: String(model.outputPricePerMillion),
      contextWindow: String(model.contextWindow),
      maxOutputTokens: String(model.maxOutputTokens),
      isActive: model.isActive,
    });
    setOpen(true);
  };

  const columns: ColumnDef<LLMModel>[] = [
    { accessorKey: 'modelId', header: 'Model ID' },
    { accessorKey: 'displayName', header: 'Display Name' },
    {
      accessorKey: 'capabilities',
      header: 'Capabilities',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.capabilities?.slice(0, 3).map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
          {(row.original.capabilities?.length || 0) > 3 && <Badge variant="outline" className="text-xs">+{row.original.capabilities!.length - 3}</Badge>}
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <Badge variant={row.original.isActive ? 'default' : 'secondary'}>{row.original.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      accessorKey: 'inputPricePerMillion',
      header: 'Input $/M',
      cell: ({ row }) => `$${row.original.inputPricePerMillion}`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Models for {providerName}</h3>
        <Button onClick={() => { setEditingModel(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Model</Button>
      </div>
      <DataTable columns={columns} data={models} emptyTitle="No Models" emptyDescription="Add models to this provider." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingModel ? 'Edit Model' : 'Add Model'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div><Label>Model ID</Label><Input value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })} placeholder="gpt-4o" /></div>
            <div><Label>Display Name</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="GPT-4o" /></div>
            <div><Label>Capabilities (comma-separated)</Label><Input value={form.capabilities} onChange={(e) => setForm({ ...form, capabilities: e.target.value })} placeholder="chat, json, vision" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Context Window</Label><Input type="number" value={form.contextWindow} onChange={(e) => setForm({ ...form, contextWindow: e.target.value })} /></div>
              <div><Label>Max Output Tokens</Label><Input type="number" value={form.maxOutputTokens} onChange={(e) => setForm({ ...form, maxOutputTokens: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Input Price ($/M tokens)</Label><Input type="number" step="0.01" value={form.inputPricePerMillion} onChange={(e) => setForm({ ...form, inputPricePerMillion: e.target.value })} /></div>
              <div><Label>Output Price ($/M tokens)</Label><Input type="number" step="0.01" value={form.outputPricePerMillion} onChange={(e) => setForm({ ...form, outputPricePerMillion: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-4"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></div>
            <Button onClick={handleSubmit} disabled={submitting || !form.modelId || !form.displayName}>
              {submitting ? 'Saving...' : editingModel ? 'Update Model' : 'Create Model'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
