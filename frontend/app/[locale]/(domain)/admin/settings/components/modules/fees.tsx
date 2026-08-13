'use client';

import { useCallback, useEffect, useState } from 'react';
import { Percent, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Switch,
} from '@/shared/components/common';

import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FeeConfig {
  id: string | number;
  category: string;
  displayName: string;
  commissionPct: number;
  vatPct: number;
  otherChargesPct: number;
  fixedFee: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FeeFormState {
  category: string;
  displayName: string;
  commissionPct: string;
  vatPct: string;
  otherChargesPct: string;
  fixedFee: string;
  isActive: boolean;
}

const EMPTY_FORM: FeeFormState = {
  category: '',
  displayName: '',
  commissionPct: '',
  vatPct: '',
  otherChargesPct: '',
  fixedFee: '',
  isActive: true,
};

function formatMoney(value: number) {
  return `₦ ${value.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function FeesSettings() {
  const [configs, setConfigs] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<FeeFormState>(EMPTY_FORM);
  const [previewCategory, setPreviewCategory] = useState('');
  const [sampleAmount, setSampleAmount] = useState('1000000');

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fees`);
      const json = await res.json();
      const data: FeeConfig[] =
        json?.success && Array.isArray(json.data) ? json.data : [];
      setConfigs(data);
      setPreviewCategory((prev) =>
        prev && data.some((c) => c.category === prev)
          ? prev
          : data.find((c) => c.category === 'default')?.category ??
            data[0]?.category ??
            ''
      );
    } catch (error) {
      console.error('Failed to load fee configurations:', error);
      toast.error('Failed to load fee configurations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const updateField = <K extends keyof FeeFormState>(
    key: K,
    value: FeeFormState[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = (config: FeeConfig) => {
    setForm({
      category: config.category,
      displayName: config.displayName,
      commissionPct: String(config.commissionPct),
      vatPct: String(config.vatPct),
      otherChargesPct: String(config.otherChargesPct),
      fixedFee: String(config.fixedFee),
      isActive: config.isActive,
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        category: form.category.trim(),
        displayName: form.displayName.trim() || form.category.trim(),
        commissionPct: Number(form.commissionPct) || 0,
        vatPct: Number(form.vatPct) || 0,
        otherChargesPct: Number(form.otherChargesPct) || 0,
        fixedFee: Number(form.fixedFee) || 0,
        isActive: form.isActive,
      };
      const res = await fetch(`${API_BASE}/fees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error('save failed');
      }
      toast.success('Fee configuration saved.');
      setShowForm(false);
      resetForm();
      await loadConfigs();
    } catch (error) {
      console.error('Failed to save fee configuration:', error);
      toast.error('Failed to save fee configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (config: FeeConfig) => {
    const name = config.displayName || config.category;
    if (!window.confirm(`Delete fee configuration for "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/fees/${config.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('delete failed');
      toast.success('Fee configuration deleted.');
      await loadConfigs();
    } catch (error) {
      console.error('Failed to delete fee configuration:', error);
      toast.error('Failed to delete fee configuration.');
    }
  };

  const handleToggleActive = async (config: FeeConfig, next: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/fees`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: config.category,
          displayName: config.displayName,
          commissionPct: config.commissionPct,
          vatPct: config.vatPct,
          otherChargesPct: config.otherChargesPct,
          fixedFee: config.fixedFee,
          isActive: next,
        }),
      });
      if (!res.ok) throw new Error('toggle failed');
      await loadConfigs();
    } catch (error) {
      console.error('Failed to update fee configuration:', error);
      toast.error('Failed to update fee configuration.');
    }
  };

  const previewConfig =
    configs.find((c) => c.category === previewCategory) ?? configs[0];

  const amount = Number(sampleAmount) || 0;
  const commission = (amount * (previewConfig?.commissionPct ?? 0)) / 100;
  const vat = (amount * (previewConfig?.vatPct ?? 0)) / 100;
  const other = (amount * (previewConfig?.otherChargesPct ?? 0)) / 100;
  const fixed = previewConfig?.fixedFee ?? 0;
  const totalFees = commission + vat + other + fixed;
  const totalPayable = amount + totalFees;

  return (
    <div className="space-y-8 p-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            Fees &amp; Charges Configuration
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure platform commission, VAT, other charges and fixed fees
            per category.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add configuration
        </Button>
      </div>

      {/* ─── Inline form ────────────────────────────────────────── */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? 'Edit configuration' : 'Add configuration'}
            </CardTitle>
            <CardDescription>
              {editingId
                ? 'Update the fee rates for this category.'
                : 'Define commission, VAT, other charges and a fixed fee for a category.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Category slug</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    placeholder="e.g. vehicles"
                    disabled={editingId !== null}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Display name</Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    placeholder="e.g. Vehicles"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Commission</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.commissionPct}
                      onChange={(e) =>
                        updateField('commissionPct', e.target.value)
                      }
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">VAT</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.vatPct}
                      onChange={(e) => updateField('vatPct', e.target.value)}
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Other charges</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.otherChargesPct}
                      onChange={(e) =>
                        updateField('otherChargesPct', e.target.value)
                      }
                      placeholder="0"
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Fixed fee (₦)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fixedFee}
                    onChange={(e) => updateField('fixedFee', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Active</Label>
                  <div className="flex h-12 items-center gap-2">
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(c) => updateField('isActive', c)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {form.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={saving || !form.category.trim()}
                >
                  {saving ? 'Saving…' : 'Save configuration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ─── Config list ────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configs.length === 0 ? (
        <EmptyState
          icon={<Percent className="h-10 w-10" />}
          title="No fee configurations yet"
          description="Add a configuration to define commission, VAT and other charges."
          action={
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add configuration
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {configs.map((config) => {
            const isDefault = config.category === 'default';
            const isSelected = config.category === previewCategory;
            return (
              <Card
                key={config.id}
                className={cn(
                  'cursor-pointer transition-shadow',
                  isSelected && 'ring-2 ring-primary'
                )}
                onClick={() => setPreviewCategory(config.category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {config.displayName || config.category}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {config.category}
                        </Badge>
                        {isDefault && (
                          <Badge variant="outline" className="text-[11px]">
                            Platform Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={config.isActive}
                        onCheckedChange={(c) => handleToggleActive(config, c)}
                      />
                    </div>
                  </div>
                  {isDefault && (
                    <p className="pt-1 text-xs text-muted-foreground">
                      Applies when no category-specific config exists.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Stat
                      label="Commission"
                      value={`${config.commissionPct}%`}
                    />
                    <Stat label="VAT" value={`${config.vatPct}%`} />
                    <Stat
                      label="Other charges"
                      value={`${config.otherChargesPct}%`}
                    />
                    <Stat
                      label="Fixed fee"
                      value={formatMoney(config.fixedFee)}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(config);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete configuration"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(config);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Example breakdown preview ──────────────────────────── */}
      {configs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Example breakdown</CardTitle>
            <CardDescription>
              Preview how the selected configuration applies to a sample
              amount.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm">Sample amount</Label>
                <Input
                  type="number"
                  min={0}
                  value={sampleAmount}
                  onChange={(e) => setSampleAmount(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm">Configuration</Label>
                <Select
                  value={previewConfig?.category ?? ''}
                  onValueChange={setPreviewCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.id} value={c.category}>
                        {c.displayName || c.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Commission" value={formatMoney(commission)} />
              <Stat label="VAT" value={formatMoney(vat)} />
              <Stat label="Other charges" value={formatMoney(other)} />
              <Stat label="Fixed fee" value={formatMoney(fixed)} />
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total fees</span>
                <span className="font-medium">{formatMoney(totalFees)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total payable</span>
                <span className="font-semibold">{formatMoney(totalPayable)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
